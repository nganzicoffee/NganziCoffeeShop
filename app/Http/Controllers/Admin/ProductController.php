<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryReason;
use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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
        /** @var list<string> $paths */
        $paths = [];
        $disk = (string) config('shop.media_disk', 'public');
        try {
            $product = DB::transaction(function () use ($request, &$paths, $disk): Product {
                $data = $request->validated();
                if (empty($data['category_id'])) {
                    $category = Category::firstOrCreate(
                        ['slug' => Str::slug($data['category_name']) ?: Str::lower(Str::random(12))],
                        ['name' => trim($data['category_name']), 'sort_order' => 0],
                    );
                    $data['category_id'] = $category->id;
                }
                $product = Product::create(Arr::except($data, ['category_name', 'variants', 'front_image', 'back_image']));
                foreach ($data['variants'] ?? [] as $variantData) {
                    $variant = $product->variants()->create([...$variantData, 'active' => true]);
                    InventoryMovement::create([
                        'variant_id' => $variant->id,
                        'actor_id' => $request->user()->id,
                        'reason' => InventoryReason::InitialStock,
                        'delta' => $variant->stock,
                        'stock_before' => 0,
                        'stock_after' => $variant->stock,
                        'note' => 'Initial stock recorded when creating product.',
                    ]);
                }
                foreach (['front_image', 'back_image'] as $position => $field) {
                    $file = $request->file($field);
                    if ($file instanceof UploadedFile) {
                        $path = $file->store("products/{$product->id}", $disk);
                        if ($path === false) {
                            throw new \RuntimeException('Product image could not be saved.');
                        }
                        $paths[] = $path;
                        $product->images()->create([
                            'path' => $path,
                            'alt' => $product->name.($position === 0 ? ' — front' : ' — back'),
                            'sort_order' => $position,
                        ]);
                    }
                }

                return $product;
            });
        } catch (Throwable $exception) {
            Storage::disk($disk)->delete($paths);
            throw $exception;
        }

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
