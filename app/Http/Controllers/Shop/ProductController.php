<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function show(string $slug): Response
    {
        $product = Product::with([
            'variants' => fn ($q) => $q->where('active', true)->orderBy('price_minor'),
            'images',
            'category',
        ])
            ->published()
            ->where('slug', $slug)
            ->firstOrFail();

        $related = Product::with(['variants' => fn ($q) => $q->where('active', true)->orderBy('price_minor'), 'images'])
            ->published()
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(4)
            ->get();

        return Inertia::render('shop/product', [
            'product' => $product,
            'related' => $related,
        ]);
    }
}
