<?php

use App\Enums\ProductStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\CartService;

/* ── Cart page ────────────────────────────────────────────────────── */

test('cart page loads when empty', function () {
    $this->get('/cart')->assertOk();
});

/* ── Add to cart ──────────────────────────────────────────────────── */

test('can add a published active variant to cart', function () {
    $variant = publishedVariant(stock: 5);

    $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 2])
        ->assertRedirect();

    expect((int) CartItem::where('variant_id', $variant->id)->sum('quantity'))->toBe(2);
});

test('cannot add an unpublished product to cart', function () {
    $category = Category::factory()->create();
    $product = Product::factory()->create(['category_id' => $category->id, 'status' => ProductStatus::Draft]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'active' => true, 'stock' => 5]);

    $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 1])
        ->assertRedirect();

    expect(CartItem::where('variant_id', $variant->id)->count())->toBe(0);
});

test('cannot add an inactive variant to cart', function () {
    $category = Category::factory()->create();
    $product = Product::factory()->create(['category_id' => $category->id, 'status' => ProductStatus::Published]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'active' => false, 'stock' => 5]);

    $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 1])
        ->assertRedirect();

    expect(CartItem::where('variant_id', $variant->id)->count())->toBe(0);
});

test('cannot add out-of-stock variant to cart', function () {
    $variant = publishedVariant(stock: 0);

    $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 1])
        ->assertRedirect();

    expect(CartItem::where('variant_id', $variant->id)->count())->toBe(0);
});

test('quantity is capped at stock level', function () {
    $variant = publishedVariant(stock: 3);

    $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 10])
        ->assertRedirect();

    expect(CartItem::where('variant_id', $variant->id)->value('quantity'))->toBe(3);
});

test('quantity is capped at MAX_QTY', function () {
    $variant = publishedVariant(stock: 50);

    $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => CartService::MAX_QTY + 5])
        ->assertRedirect();

    expect((int) CartItem::where('variant_id', $variant->id)->value('quantity'))->toBe(CartService::MAX_QTY);
});

test('invalid variant id is rejected with 422', function () {
    $this->post('/cart', ['variant_id' => 99999, 'quantity' => 1])
        ->assertStatus(422);
});

test('non-integer quantity is rejected with 422', function () {
    $variant = publishedVariant(stock: 5);

    $this->post('/cart', ['variant_id' => $variant->id, 'quantity' => 'abc'])
        ->assertStatus(422);
});

/* ── Update cart item ─────────────────────────────────────────────── */

test('can update cart item quantity', function () {
    [$cart, $item] = cartWithItem(stock: 5, qty: 1);

    $this->withSession(['cart_session_id' => $cart->session_id])
        ->patch("/cart/{$item->id}", ['quantity' => 3])
        ->assertRedirect(route('cart.show'));

    expect($item->fresh()->quantity)->toBe(3);
});

test('setting quantity to zero removes the item', function () {
    [$cart, $item] = cartWithItem(stock: 5, qty: 2);

    $this->withSession(['cart_session_id' => $cart->session_id])
        ->patch("/cart/{$item->id}", ['quantity' => 0])
        ->assertRedirect(route('cart.show'));

    expect(CartItem::find($item->id))->toBeNull();
});

test('cannot update item belonging to another cart', function () {
    [, $item] = cartWithItem(stock: 5, qty: 1);
    $otherCart = Cart::factory()->create();

    $this->withSession(['cart_session_id' => $otherCart->session_id])
        ->patch("/cart/{$item->id}", ['quantity' => 2])
        ->assertNotFound();
});

/* ── Remove cart item ─────────────────────────────────────────────── */

test('can remove a cart item', function () {
    [$cart, $item] = cartWithItem(stock: 5, qty: 2);

    $this->withSession(['cart_session_id' => $cart->session_id])
        ->delete("/cart/{$item->id}")
        ->assertRedirect(route('cart.show'));

    expect(CartItem::find($item->id))->toBeNull();
});

test('cannot remove item belonging to another cart', function () {
    [, $item] = cartWithItem(stock: 5, qty: 1);
    $otherCart = Cart::factory()->create();

    $this->withSession(['cart_session_id' => $otherCart->session_id])
        ->delete("/cart/{$item->id}")
        ->assertNotFound();
});

/* ── Server-side price integrity ──────────────────────────────────── */

test('cart summary uses server price not browser-supplied value', function () {
    $variant = publishedVariant(stock: 5, price: 25000);
    $cart = Cart::factory()->create();
    CartItem::factory()->create(['cart_id' => $cart->id, 'variant_id' => $variant->id, 'quantity' => 2]);

    $service = app(CartService::class);
    $summary = $service->summary($cart);

    // line_total must be server price × qty, regardless of anything the browser sends
    expect($summary['items'][0]['line_total'])->toBe(50000);
    expect($summary['subtotal'])->toBe(50000);
});

/* ── Helpers ──────────────────────────────────────────────────────── */

function publishedVariant(int $stock, int $price = 15000): ProductVariant
{
    $category = Category::factory()->create();
    $product = Product::factory()->create(['category_id' => $category->id, 'status' => ProductStatus::Published]);

    return ProductVariant::factory()->create([
        'product_id' => $product->id,
        'active' => true,
        'stock' => $stock,
        'price_minor' => $price,
    ]);
}

/** @return array{Cart, CartItem} */
function cartWithItem(int $stock, int $qty): array
{
    $variant = publishedVariant(stock: $stock);
    $cart = Cart::factory()->create();
    $item = CartItem::factory()->create(['cart_id' => $cart->id, 'variant_id' => $variant->id, 'quantity' => $qty]);

    return [$cart, $item];
}
