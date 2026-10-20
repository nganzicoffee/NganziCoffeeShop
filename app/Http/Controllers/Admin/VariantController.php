<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryReason;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVariantRequest;
use App\Http\Requests\Admin\UpdateVariantRequest;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class VariantController extends Controller
{
    public function store(StoreVariantRequest $request, Product $product): RedirectResponse
    {
        DB::transaction(function () use ($product, $request): void {
            Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            $variant = $product->variants()->create($request->validated());
            InventoryMovement::create([
                'variant_id' => $variant->id,
                'actor_id' => $request->user()->id,
                'reason' => InventoryReason::InitialStock,
                'delta' => $variant->stock,
                'stock_before' => 0,
                'stock_after' => $variant->stock,
                'note' => 'Initial stock recorded when adding a pack size.',
            ]);
        });

        return back()->with('toast', ['type' => 'success', 'message' => 'Variant added.']);
    }

    public function update(UpdateVariantRequest $request, Product $product, ProductVariant $variant): RedirectResponse
    {
        abort_if($variant->product_id !== $product->id, 404);

        $variant->update($request->validated());

        return back()->with('toast', ['type' => 'success', 'message' => 'Variant updated.']);
    }

    public function destroy(Product $product, ProductVariant $variant): RedirectResponse
    {
        $this->authorize('update', $product);
        abort_if($variant->product_id !== $product->id, 404);

        $variant->delete();

        return back()->with('toast', ['type' => 'success', 'message' => 'Variant removed.']);
    }
}
