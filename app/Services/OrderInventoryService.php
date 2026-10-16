<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class OrderInventoryService
{
    public function releaseExpiredReservations(): int
    {
        $released = 0;

        Order::query()
            ->where('status', OrderStatus::Pending->value)
            ->whereIn('payment_status', [
                PaymentStatus::Unpaid->value,
                PaymentStatus::Pending->value,
                PaymentStatus::Failed->value,
            ])
            ->whereNull('inventory_released_at')
            ->whereNotNull('inventory_reserved_until')
            ->where(function ($query): void {
                $query->where('payment_status', PaymentStatus::Failed->value)
                    ->orWhere('inventory_reserved_until', '<=', now());
            })
            ->orderBy('id')
            ->chunkById(100, function ($orders) use (&$released): void {
                foreach ($orders as $candidate) {
                    if ($this->release($candidate)) {
                        $released++;
                    }
                }
            });

        return $released;
    }

    private function release(Order $candidate): bool
    {
        return DB::transaction(function () use ($candidate): bool {
            $order = Order::query()->whereKey($candidate->id)->lockForUpdate()->firstOrFail();

            if (
                $order->status !== OrderStatus::Pending
                || $order->payment_status === PaymentStatus::Paid
                || $order->inventory_released_at !== null
                || $order->inventory_reserved_until === null
                || ($order->payment_status !== PaymentStatus::Failed && $order->inventory_reserved_until->isFuture())
            ) {
                return false;
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
                    'order_id' => $order->id,
                    'reason' => InventoryReason::SaleReversed,
                    'delta' => $item->quantity,
                    'stock_before' => $stockBefore,
                    'stock_after' => $variant->stock,
                    'note' => "Expired unpaid order {$order->reference}; reserved stock released.",
                ]);
            }

            $order->update([
                'status' => OrderStatus::Cancelled,
                'inventory_released_at' => now(),
            ]);

            return true;
        }, attempts: 3);
    }
}
