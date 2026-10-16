<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryReason;
use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryMovementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(in_array($request->user()->role, [StaffRole::Owner, StaffRole::InventoryManager], true), 403);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'reason' => ['nullable', Rule::enum(InventoryReason::class)],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $lowStockThreshold = max(0, (int) config('shop.low_stock_threshold', 5));

        $variants = ProductVariant::query()
            ->with('product:id,name,status')
            ->orderBy('stock')
            ->orderBy('id')
            ->get()
            ->map(fn (ProductVariant $variant): array => [
                'id' => $variant->id,
                'product_id' => $variant->product_id,
                'product_name' => $variant->product->name ?? '—',
                'product_status' => $variant->product->status->value ?? 'draft',
                'label' => $variant->label,
                'sku' => $variant->sku,
                'stock' => $variant->stock,
                'active' => $variant->active,
            ])
            ->values();

        $movements = InventoryMovement::query()
            ->with(['variant.product:id,name', 'actor:id,name', 'order:id,reference'])
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->whereHas('variant', function ($query) use ($search): void {
                        $query->where('label', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
                            ->orWhereHas('product', fn ($product) => $product->where('name', 'like', "%{$search}%"));
                    })->orWhereHas('order', fn ($query) => $query->where('reference', 'like', "%{$search}%"));
                });
            })
            ->when($filters['reason'] ?? null, fn ($query, string $reason) => $query->where('reason', $reason))
            ->when($filters['from'] ?? null, fn ($query, string $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['to'] ?? null, fn ($query, string $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate(50)
            ->withQueryString()
            ->through(fn (InventoryMovement $movement): array => [
                'product' => $movement->variant->product->name ?? 'Deleted product',
                'variant' => $movement->variant->label ?? 'Deleted variant',
                'sku' => $movement->variant->sku ?? null,
                'reason' => $movement->reason->label(),
                'delta' => $movement->delta,
                'stockBefore' => $movement->stock_before,
                'stockAfter' => $movement->stock_after,
                'orderReference' => $movement->order?->reference,
                'actor' => $movement->actor->name ?? 'System',
                'note' => $movement->note,
                'at' => $movement->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('admin/inventory', [
            'variants' => $variants,
            'lowStockThreshold' => $lowStockThreshold,
            'movements' => $movements,
            'filters' => $filters,
            'reasons' => collect(InventoryReason::cases())->map(fn (InventoryReason $reason) => [
                'value' => $reason->value,
                'label' => $reason->label(),
            ]),
        ]);
    }
}
