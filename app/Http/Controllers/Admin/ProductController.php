<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::with(['category', 'variants'])
            ->when($request->input('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('category'), fn ($q, $c) => $q->where('category_id', $c))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'categories' => Category::orderBy('sort_order')->get(['id', 'name']),
            'filters' => $request->only('search', 'status', 'category'),
            'lowStockThreshold' => config('shop.low_stock_threshold'),
            'currency' => config('shop.currency'),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('admin/products/create', [
            'categories' => Category::orderBy('sort_order')->get(['id', 'name']),
            'statuses' => collect(ProductStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'currency' => config('shop.currency'),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $product = Product::create($request->validated());

        return to_route('admin.products.edit', $product)
            ->with('toast', ['type' => 'success', 'message' => 'Product created.']);
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        $product->load(['category', 'variants', 'images']);

        return Inertia::render('admin/products/edit', [
            'product' => $product,
            'categories' => Category::orderBy('sort_order')->get(['id', 'name']),
            'statuses' => collect(ProductStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'lowStockThreshold' => config('shop.low_stock_threshold'),
            'currency' => config('shop.currency'),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return back()->with('toast', ['type' => 'success', 'message' => 'Product updated.']);
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        $product->delete();

        return to_route('admin.products.index')
            ->with('toast', ['type' => 'success', 'message' => 'Product deleted.']);
    }
}
