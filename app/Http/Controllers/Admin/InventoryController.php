<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryReason;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdjustInventoryRequest;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function store(AdjustInventoryRequest $request, Product $product, ProductVariant $variant): RedirectResponse
    {
        abort_if($variant->product_id !== $product->id, 404);

        DB::transaction(function () use ($request, $variant) {
            $before = $variant->stock;
            $delta = $request->integer('delta');
            $proposed = $before + $delta;

            // Prevent stock going below zero unless explicitly a write-off reason.
            $writeOffReasons = [InventoryReason::Damaged, InventoryReason::Lost];
            $reason = InventoryReason::from($request->input('reason'));

            if ($proposed < 0 && ! in_array($reason, $writeOffReasons, true)) {
                abort(422, 'Stock cannot go below zero for this reason.');
            }

            $after = max(0, $proposed);

            $variant->update(['stock' => $after]);

            $variant->inventoryMovements()->create([
                'actor_id' => $request->user()->id,
                'order_id' => null,
                'reason' => $reason,
                'delta' => $delta,
                'stock_before' => $before,
                'stock_after' => $after,
                'note' => $request->input('note'),
            ]);
            AuditLog::create([
                'actor_id' => $request->user()->id,
                'event' => 'inventory.adjusted',
                'subject_type' => ProductVariant::class,
                'subject_id' => $variant->id,
                'details' => [
                    'reason' => $reason->value,
                    'delta' => $delta,
                    'stock_before' => $before,
                    'stock_after' => $after,
                    'note' => $request->input('note'),
                ],
            ]);
        });

        return back()->with('toast', ['type' => 'success', 'message' => 'Inventory adjusted.']);
    }
}
