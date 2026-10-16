<?php

namespace App\Jobs;

use App\Mail\OrderUpdateMail;
use App\Models\OrderNotification;
use App\Services\Notifications\NotificationRedactor;
use App\Services\Notifications\OrderMessageBuilder;
use App\Services\Notifications\SmsSender;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendOrderNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * Backoff in seconds between retry attempts for transient provider errors.
     *
     * @var list<int>
     */
    public array $backoff = [15, 60, 300];

    public function __construct(public readonly int $orderNotificationId)
    {
        $this->onQueue((string) config('shop.notifications.queue', 'default'));
    }

    public function handle(OrderMessageBuilder $builder, SmsSender $sms): void
    {
        $notification = OrderNotification::query()
            ->with('order.items')
            ->find($this->orderNotificationId);

        if (! $notification || ! $notification->order) {
            return;
        }

        // Claim delivery atomically so concurrent workers or duplicate dispatches cannot double-send.
        $shouldSend = DB::transaction(function () use ($notification): bool {
            $locked = OrderNotification::query()
                ->whereKey($notification->id)
                ->lockForUpdate()
                ->first();

            if (! $locked || in_array($locked->status, [
                OrderNotification::STATUS_SENT,
                OrderNotification::STATUS_SKIPPED,
            ], true)) {
                return false;
            }

            $locked->update([
                'attempts' => $locked->attempts + 1,
            ]);

            return true;
        });

        if (! $shouldSend) {
            return;
        }

        $notification->refresh();
        $order = $notification->order;
        $copy = $builder->build($notification, $order);

        try {
            if ($notification->channel === 'mail') {
                if (empty($order->customer_email)) {
                    $notification->update([
                        'status' => OrderNotification::STATUS_SKIPPED,
                        'last_error' => 'No customer email on order.',
                    ]);

                    return;
                }

                Mail::to($order->customer_email)->send(new OrderUpdateMail(
                    order: $order,
                    message: $copy,
                    shortReference: $builder->shortReference($order),
                    totalFormatted: $builder->money($order->total_minor, $order->currency),
                ));
            } elseif ($notification->channel === 'sms') {
                if (empty($order->customer_phone)) {
                    $notification->update([
                        'status' => OrderNotification::STATUS_SKIPPED,
                        'last_error' => 'No customer phone on order.',
                    ]);

                    return;
                }

                $sms->send($order->customer_phone, $copy['sms']);
            }

            $notification->update([
                'status' => OrderNotification::STATUS_SENT,
                'sent_at' => now(),
                'failed_at' => null,
                'last_error' => null,
            ]);
        } catch (Throwable $exception) {
            $summary = NotificationRedactor::summarise($exception);

            $notification->update([
                'status' => OrderNotification::STATUS_FAILED,
                'failed_at' => now(),
                'last_error' => $summary,
            ]);

            Log::warning('Order notification delivery attempt failed', [
                'order_notification_id' => $notification->id,
                'order_reference' => $order->reference,
                'type' => $notification->type,
                'channel' => $notification->channel,
                'attempt' => $notification->attempts,
                'error' => $summary,
            ]);

            throw $exception;
        }
    }

    public function failed(?Throwable $exception): void
    {
        if (! $exception) {
            return;
        }

        OrderNotification::query()
            ->whereKey($this->orderNotificationId)
            ->update([
                'status' => OrderNotification::STATUS_FAILED,
                'failed_at' => now(),
                'last_error' => NotificationRedactor::summarise($exception),
            ]);
    }
}
