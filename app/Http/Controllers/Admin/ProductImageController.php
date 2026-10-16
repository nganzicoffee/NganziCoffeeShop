<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreImageRequest;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageController extends Controller
{
    public function store(StoreImageRequest $request, Product $product): RedirectResponse
    {
        $disk = config('shop.media_disk');
        $file = $request->file('image');
        $path = $file->storeAs(
            "products/{$product->id}",
            Str::uuid().'.'.$file->extension(),
            $disk,
        );

        $nextOrder = $product->images()->max('sort_order') + 1;

        $product->images()->create([
            'path' => $path,
            'alt' => $request->input('alt', $product->name),
            'sort_order' => $nextOrder,
        ]);

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
            'order.*' => ['integer', 'exists:product_images,id'],
        ]);

        foreach ($request->input('order') as $position => $imageId) {
            $product->images()->where('id', $imageId)->update(['sort_order' => $position]);
        }

        return back();
    }
}
