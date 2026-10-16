<?php

namespace App\Services\Notifications;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderNotification;

/**
 * Builds the customer-facing wording for an order notification.
 *
 * Content is deliberately limited to the order reference, an item summary,
 * totals, next steps, and support contact. Delivery address, phone number,
 * internal notes, and payment provider details are never included.
 */
class OrderMessageBuilder
{
    /** Status transitions that are meaningful enough to tell the customer about. */
    public const NOTIFIABLE_STATUSES = [
        OrderStatus::Confirmed,
        OrderStatus::Dispatched,
        OrderStatus::Completed,
        OrderStatus::Cancelled,
    ];

    /**
     * @return array{subject: string, headline: string, intro: string, next_steps: string, sms: string}
     */
    public function build(OrderNotification $notification, Order $order): array
    {
        $ref = $this->shortReference($order);

        [$subject, $headline, $intro, $next] = match ($notification->type) {
            OrderNotification::TYPE_ORDER_RECEIVED => [
                "We've received your order {$ref}",
                'Thank you — your order is in.',
                "We've received order {$ref} and reserved your coffee.",
                "We'll be in touch to confirm payment and delivery. You don't need to do anything else right now.",
            ],
            OrderNotification::TYPE_PAYMENT_CONFIRMED => [
                "Payment received for order {$ref}",
                'Your payment is confirmed.',
                'We have received your payment of '.$this->money((int) ($notification->context['amount_minor'] ?? $order->total_minor), $order->currency)." for order {$ref}.",
                "We'll prepare your order and let you know when it's on its way.",
            ],
            OrderNotification::TYPE_STATUS_UPDATED => $this->statusCopy(
                OrderStatus::tryFrom((string) ($notification->context['to'] ?? '')),
                $ref,
            ),
            default => ["Update on order {$ref}", 'Order update', "There's an update on order {$ref}.", ''],
        };

        return [
            'subject' => $subject,
            'headline' => $headline,
            'intro' => $intro,
            'next_steps' => $next,
            'sms' => trim("Nganzi Coffee: {$intro} {$next}"),
        ];
    }

    public function shortReference(Order $order): string
    {
        return strtoupper(substr($order->reference, 0, 8));
    }

    /** Mirrors resources/js/lib/price.ts so emails show the same amounts as the shop. */
    public function money(int $minor, string $currency): string
    {
        $noDecimals = ['UGX', 'JPY', 'KRW', 'VND', 'CLP', 'GNF', 'IDR', 'KMF', 'MGA', 'PYG', 'RWF', 'XAF', 'XOF'];
        $decimals = in_array(strtoupper($currency), $noDecimals, true) ? 0 : 2;
        $amount = $decimals === 0 ? $minor : $minor / 100;

        return strtoupper($currency).' '.number_format($amount, $decimals);
    }

    /** @return array{0: string, 1: string, 2: string, 3: string} */
    private function statusCopy(?OrderStatus $status, string $ref): array
    {
        return match ($status) {
            OrderStatus::Confirmed => [
                "Order {$ref} confirmed",
                'Your order is confirmed.',
                "We've confirmed order {$ref} and will start preparing it.",
                "We'll let you know when it's on its way.",
            ],
            OrderStatus::Dispatched => [
                "Order {$ref} is on its way",
                'Your order is on its way.',
                "Order {$ref} has left us and is heading to you.",
                'Please keep your phone nearby in case our delivery team needs to reach you.',
            ],
            OrderStatus::Completed => [
                "Order {$ref} delivered",
                'Enjoy your coffee.',
                "Order {$ref} is marked as delivered. Thank you for choosing Nganzi Coffee.",
                "If anything isn't right, get in touch and we'll help.",
            ],
            OrderStatus::Cancelled => [
                "Order {$ref} cancelled",
                'Your order has been cancelled.',
                "Order {$ref} has been cancelled.",
                "If you didn't expect this, please contact us and we'll look into it.",
            ],
            default => ["Update on order {$ref}", 'Order update', "There's an update on order {$ref}.", ''],
        };
    }
}
