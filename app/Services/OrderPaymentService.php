<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\Notifications\OrderNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderPaymentService
{
    public function __construct(
        private readonly OrderNotificationService $notifications,
    ) {}

    /**
     * Record a verified payment confirmation and queue the customer confirmation
     * notification once. Retried webhooks or duplicate confirmations with the
     * same reference are idempotent no-ops.
     *
     * @param  array<string, mixed>  $meta
     */
    public function confirmPayment(
        Order $order,
        string $provider,
        string $providerReference,
        int $amountMinor,
        ?User $actor = null,
        array $meta = [],
    ): Payment {
        $payment = DB::transaction(function () use (
            $order,
            $provider,
            $providerReference,
            $amountMinor,
            $actor,
            $meta,
        ): Payment {
            $lockedOrder = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $existing = Payment::query()
                ->where('order_id', $lockedOrder->id)
                ->where('provider', $provider)
                ->where('provider_reference', $providerReference)
                ->where('status', PaymentStatus::Paid->value)
                ->first();

            if ($existing) {
                return $existing;
            }

            if ($amountMinor < $lockedOrder->total_minor) {
                throw ValidationException::withMessages([
                    'amount_minor' => 'Verified payment amount is less than the order total.',
                ]);
            }

            $payment = Payment::updateOrCreate(
                [
                    'order_id' => $lockedOrder->id,
                    'provider' => $provider,
                    'provider_reference' => $providerReference,
                ],
                [
                    'amount_minor' => $amountMinor,
                    'currency' => $lockedOrder->currency,
                    'status' => PaymentStatus::Paid,
                    'meta' => $meta !== [] ? $meta : null,
                ],
            );

            if ($lockedOrder->payment_status !== PaymentStatus::Paid) {
                $previous = $lockedOrder->payment_status;
                $lockedOrder->update(['payment_status' => PaymentStatus::Paid]);

                AuditLog::create([
                    'actor_id' => $actor?->id,
                    'event' => 'order.payment_confirmed',
                    'subject_type' => Order::class,
                    'subject_id' => $lockedOrder->id,
                    'details' => [
                        'reference' => $lockedOrder->reference,
                        'provider' => $provider,
                        'provider_reference' => $providerReference,
                        'amount_minor' => $amountMinor,
                        'currency' => $lockedOrder->currency,
                        'from' => $previous->value,
                        'to' => PaymentStatus::Paid->value,
                    ],
                ]);
            }

            return $payment;
        }, attempts: 3);

        $freshOrder = $order->fresh();
        if ($freshOrder) {
            $this->notifications->sendPaymentConfirmed($freshOrder, $payment);
        }

        return $payment;
    }

    /**
     * Record a non-paid payment attempt (pending or failed) without marking
     * the order paid or sending a payment confirmation notification.
     *
     * @param  array<string, mixed>  $meta
     */
    public function recordAttempt(
        Order $order,
        string $provider,
        string $providerReference,
        int $amountMinor,
        PaymentStatus $status,
        array $meta = [],
    ): Payment {
        if ($status === PaymentStatus::Paid) {
            return $this->confirmPayment($order, $provider, $providerReference, $amountMinor, null, $meta);
        }

        return DB::transaction(function () use ($order, $provider, $providerReference, $amountMinor, $status, $meta): Payment {
            $lockedOrder = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $payment = Payment::updateOrCreate(
                [
                    'order_id' => $lockedOrder->id,
                    'provider' => $provider,
                    'provider_reference' => $providerReference,
                ],
                [
                    'amount_minor' => $amountMinor,
                    'currency' => $lockedOrder->currency,
                    'status' => $status,
                    'meta' => $meta !== [] ? $meta : null,
                ],
            );

            if ($lockedOrder->payment_status === PaymentStatus::Unpaid && in_array($status, [PaymentStatus::Pending, PaymentStatus::Failed], true)) {
                $lockedOrder->update(['payment_status' => $status]);
            }

            return $payment;
        }, attempts: 3);
    }
}
