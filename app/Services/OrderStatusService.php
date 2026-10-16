<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\AuditLog;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Notifications\OrderNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    public function __construct(
        private readonly OrderNotificationService $notifications,
    ) {}

    public function transition(Order $order, OrderStatus $next, User $actor, ?string $note): Order
    {
        return DB::transaction(function () use ($order, $next, $actor, $note): Order {
            $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $previous = $lockedOrder->status;

            // Saving an unchanged status is a safe no-op: no history, audit log, or duplicate notification.
            if ($previous === $next) {
                return $lockedOrder;
            }

            if (! $previous->canTransitionTo($next)) {
                throw ValidationException::withMessages([
                    'status' => "An order cannot move from {$previous->label()} to {$next->label()}.",
                ]);
            }

            if ($next === OrderStatus::Cancelled) {
                if (in_array($lockedOrder->payment_status, [
                    PaymentStatus::Paid,
                    PaymentStatus::PartiallyRefunded,
                    PaymentStatus::Refunded,
                ], true)) {
                    throw ValidationException::withMessages([
                        'status' => 'Paid orders cannot be cancelled until a refund workflow is available.',
                    ]);
                }

                if (trim((string) $note) === '') {
                    throw ValidationException::withMessages([
                        'note' => 'Provide a reason when cancelling an order.',
                    ]);
                }

                $this->releaseReservedInventory($lockedOrder, $actor, $note);
            }

            $lockedOrder->update(['status' => $next]);
            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'actor_id' => $actor->id,
                'from_status' => $previous,
                'to_status' => $next,
                'note' => $note,
            ]);
            AuditLog::create([
                'actor_id' => $actor->id,
                'event' => 'order.status_updated',
                'subject_type' => Order::class,
                'subject_id' => $lockedOrder->id,
                'details' => [
                    'reference' => $lockedOrder->reference,
                    'from' => $previous->value,
                    'to' => $next->value,
                    'note' => $note,
                ],
            ]);

            $fresh = $lockedOrder->fresh();
            $this->notifications->sendStatusUpdated($fresh, $previous, $next);

            return $fresh;
        }, attempts: 3);
    }

    private function releaseReservedInventory(Order $order, User $actor, string $note): void
    {
        if ($order->inventory_released_at !== null) {
            return;
        }

        $items = $order->items()->orderBy('variant_id')->lockForUpdate()->get();
        $variants = ProductVariant::query()
            ->whereIn('id', $items->pluck('variant_id')->filter()->unique())
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($items as $item) {
            $variant = $variants->get($item->variant_id);
            if (! $variant) {
                continue;
            }

            $stockBefore = $variant->stock;
            $variant->increment('stock', $item->quantity);
            $variant->refresh();

            InventoryMovement::create([
                'variant_id' => $variant->id,
                'actor_id' => $actor->id,
                'order_id' => $order->id,
                'reason' => InventoryReason::SaleReversed,
                'delta' => $item->quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $variant->stock,
                'note' => "Order {$order->reference} cancelled: {$note}",
            ]);
        }

        $order->update(['inventory_released_at' => now()]);
    }
}
