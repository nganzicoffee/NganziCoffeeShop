<?php

namespace App\Services\Notifications;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Jobs\SendOrderNotification;
use App\Models\Order;
use App\Models\OrderNotification;
use App\Models\Payment;
use Illuminate\Database\UniqueConstraintViolationException;

class OrderNotificationService
{
    /**
     * Queue an order-received notification after checkout completes.
     * Idempotent per (order, channel).
     */
    public function sendOrderReceived(Order $order): void
    {
        $this->enqueue(
            order: $order,
            type: OrderNotification::TYPE_ORDER_RECEIVED,
            dedupeSuffix: 'received',
            context: [
                'reference' => $order->reference,
                'total_minor' => $order->total_minor,
                'currency' => $order->currency,
            ],
        );
    }

    /**
     * Queue a payment-confirmed notification only when the order's payment
     * status is verified as Paid. Retried webhooks or duplicate confirmations
     * hit the unique dedupe key and become no-ops.
     */
    public function sendPaymentConfirmed(Order $order, ?Payment $payment = null): void
    {
        if ($order->payment_status !== PaymentStatus::Paid) {
            return;
        }

        if ($payment !== null && $payment->status !== PaymentStatus::Paid) {
            return;
        }

        $this->enqueue(
            order: $order,
            type: OrderNotification::TYPE_PAYMENT_CONFIRMED,
            dedupeSuffix: 'payment_confirmed',
            context: [
                'reference' => $order->reference,
                'amount_minor' => $payment !== null ? $payment->amount_minor : $order->total_minor,
                'currency' => $payment !== null ? $payment->currency : $order->currency,
                'provider' => $payment?->provider,
            ],
        );
    }

    /**
     * Queue a fulfilment status update only when a meaningful transition occurred.
     * Saving an unchanged status or transitioning to an internal-only stage is ignored.
     */
    public function sendStatusUpdated(Order $order, OrderStatus $from, OrderStatus $to): void
    {
        if ($from === $to) {
            return;
        }

        if (! in_array($to, OrderMessageBuilder::NOTIFIABLE_STATUSES, true)) {
            return;
        }

        $this->enqueue(
            order: $order,
            type: OrderNotification::TYPE_STATUS_UPDATED,
            dedupeSuffix: "status:{$to->value}",
            context: [
                'reference' => $order->reference,
                'from' => $from->value,
                'from_label' => $from->label(),
                'to' => $to->value,
                'to_label' => $to->label(),
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function enqueue(Order $order, string $type, string $dedupeSuffix, array $context): void
    {
        foreach ($this->activeChannelsFor($order) as [$channel, $recipientHint]) {
            $dedupeKey = "order:{$order->id}:{$dedupeSuffix}:{$channel}";

            $existing = OrderNotification::query()
                ->where('dedupe_key', $dedupeKey)
                ->first();

            if ($existing) {
                continue;
            }

            try {
                $record = OrderNotification::create([
                    'order_id' => $order->id,
                    'type' => $type,
                    'channel' => $channel,
                    'dedupe_key' => $dedupeKey,
                    'recipient_hint' => $recipientHint,
                    'context' => $context,
                    'status' => OrderNotification::STATUS_QUEUED,
                    'attempts' => 0,
                ]);
            } catch (UniqueConstraintViolationException) {
                continue;
            }

            SendOrderNotification::dispatch($record->id)->afterCommit();
        }
    }

    /**
     * @return list<array{0: string, 1: string|null}>
     */
    private function activeChannelsFor(Order $order): array
    {
        $channels = [];

        if (config('shop.notifications.mail_enabled', true) && ! empty($order->customer_email)) {
            $channels[] = ['mail', NotificationRedactor::maskEmail($order->customer_email)];
        }

        if (config('shop.notifications.sms_enabled', false) && ! empty($order->customer_phone)) {
            $channels[] = ['sms', NotificationRedactor::maskPhone($order->customer_phone)];
        }

        return $channels;
    }
}
