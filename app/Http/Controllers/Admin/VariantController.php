<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVariantRequest;
use App\Http\Requests\Admin\UpdateVariantRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;

class VariantController extends Controller
{
    public function store(StoreVariantRequest $request, Product $product): RedirectResponse
    {
        $product->variants()->create($request->validated());

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
