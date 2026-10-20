<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreImageRequest;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductImageController extends Controller
{
    public function store(StoreImageRequest $request, Product $product): RedirectResponse
    {
        if ($product->images()->count() >= 2) {
            throw ValidationException::withMessages(['image' => 'Use up to two product images. Remove an image before uploading its replacement.']);
        }
        $disk = config('shop.media_disk');
        $file = $request->file('image');
        $path = $file->storeAs(
            "products/{$product->id}",
            Str::uuid().'.'.$file->extension(),
            $disk,
        );

        if ($path === false) {
            throw ValidationException::withMessages(['image' => 'The image could not be saved. Check product image storage.']);
        }

        try {
            DB::transaction(function () use ($product, $path, $request): void {
                Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
                if ($product->images()->count() >= 2) {
                    throw ValidationException::withMessages(['image' => 'Both image positions are already filled.']);
                }
                $product->images()->create([
                    'path' => $path,
                    'alt' => $request->input('alt', $product->name),
                    'sort_order' => (int) $product->images()->max('sort_order') + 1,
                ]);
            });
        } catch (\Throwable $exception) {
            Storage::disk($disk)->delete($path);
            throw $exception;
        }

        return back()->with('toast', ['type' => 'success', 'message' => 'Image uploaded.']);
    }

    public function destroy(Product $product, ProductImage $image): RedirectResponse
    {
        $this->authorize('update', $product);
        abort_if($image->product_id !== $product->id, 404);

        Storage::disk(config('shop.media_disk'))->delete($image->path);
        $image->delete();

        return back()->with('toast', ['type' => 'success', 'message' => 'Image removed.']);
    }

    public function reorder(Request $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'distinct', 'exists:product_images,id'],
        ]);

        DB::transaction(function () use ($request, $product): void {
            Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            $current = $product->images()->pluck('id')->map(fn ($id) => (int) $id)->sort()->values()->all();
            $requested = array_map(intval(...), $request->input('order'));
            $sorted = $requested;
            sort($sorted);
            if ($sorted !== $current) {
                throw ValidationException::withMessages(['order' => 'Include every image belonging to this product exactly once.']);
            }
            foreach ($requested as $position => $imageId) {
                $product->images()->where('id', $imageId)->update(['sort_order' => $position]);
            }
        });

        return back();
    }
}
