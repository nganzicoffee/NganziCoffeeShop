<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function home(): Response
    {
        $featured = Product::with(['variants' => fn ($q) => $q->where('active', true)->orderBy('price_minor'), 'images'])
            ->published()
            ->featured()
            ->latest()
            ->take(4)
            ->get();

        $categories = Category::withCount(['products' => fn ($q) => $q->published()])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('welcome', [
            'featuredProducts' => $featured,
            'categories' => $categories,
        ]);
    }

    public function index(): Response
    {
        $categories = Category::withCount(['products' => fn ($q) => $q->published()])
            ->orderBy('sort_order')
            ->get();

        $products = Product::with(['variants' => fn ($q) => $q->where('active', true)->orderBy('price_minor'), 'images', 'category'])
            ->published()
            ->when(request('category'), fn ($q, $slug) => $q->whereHas('category', fn ($c) => $c->where('slug', $slug)))
            ->when(request('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('shop/index', [
            'products' => $products,
            'categories' => $categories,
            'activeCategory' => request('category'),
            'filters' => request()->only('search', 'category'),
        ]);
    }
}
