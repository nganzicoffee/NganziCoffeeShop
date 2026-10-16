<?php

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\CheckoutService;
use App\Services\OrderInventoryService;

function checkoutCart(int $stock = 5, int $quantity = 2, int $price = 15000): array
{
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Published,
        'name' => 'Checkout Coffee',
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'label' => '250g',
        'sku' => 'CHECKOUT-250',
        'price_minor' => $price,
        'stock' => $stock,
        'active' => true,
    ]);
    $cart = Cart::factory()->create();
    CartItem::factory()->create([
        'cart_id' => $cart->id,
        'variant_id' => $variant->id,
        'quantity' => $quantity,
    ]);

    return [$cart, $variant];
}

function validCheckoutData(string $key): array
{
    return [
        'idempotency_key' => $key,
        'name' => 'Coffee Customer',
        'email' => '',
        'phone' => '+256700000000',
        'address_line' => '12 Coffee Lane',
        'delivery_area' => 'Kampala',
        'postal_code' => '',
        'delivery_notes' => '',
        'customer_notes' => '',
    ];
}

test('checkout displays server-calculated charges and configured areas', function () {
    [$cart] = checkoutCart();
    config()->set('shop.delivery.flat_fee', 2500);
    config()->set('shop.delivery.areas', ['Kampala', 'Entebbe']);

    $this->withSession(['cart_session_id' => $cart->session_id])
        ->get('/checkout')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('shop/checkout')
            ->where('quote.subtotal_minor', 30000)
            ->where('quote.delivery_fee_minor', 2500)
            ->where('quote.total_minor', 32500)
            ->where('deliveryAreas', ['Kampala', 'Entebbe']));
});

test('checkout quotes inclusive and exclusive tax from configuration', function () {
    $service = app(CheckoutService::class);
    config()->set('shop.delivery.flat_fee', 2000);
    config()->set('shop.tax.enabled', true);
    config()->set('shop.tax.rate', 0.18);

    config()->set('shop.tax.inclusive', true);
    expect($service->quote(10000, 'Kampala'))->toMatchArray([
        'subtotal_minor' => 10000,
        'delivery_fee_minor' => 2000,
        'tax_minor' => 1525,
        'total_minor' => 12000,
    ]);

    config()->set('shop.tax.inclusive', false);
    expect($service->quote(10000, 'Kampala'))->toMatchArray([
        'subtotal_minor' => 10000,
        'delivery_fee_minor' => 2000,
        'tax_minor' => 2160,
        'total_minor' => 14160,
    ]);
});

test('valid checkout creates one order, snapshots current prices and deducts stock', function () {
    [$cart, $variant] = checkoutCart(stock: 5, quantity: 2, price: 15000);
    config()->set('shop.delivery.flat_fee', 2500);
    $key = str_repeat('a', 64);

    $this->withSession([
        'cart_session_id' => $cart->session_id,
        'checkout.idempotency_key' => $key,
    ])->post('/checkout', validCheckoutData($key))
        ->assertRedirect();

    $order = Order::query()->firstOrFail();
    expect($order->subtotal_minor)->toBe(30000)
        ->and($order->delivery_fee_minor)->toBe(2500)
        ->and($order->total_minor)->toBe(32500)
        ->and($order->customer_email)->toBeNull()
        ->and($order->status)->toBe(OrderStatus::Pending)
        ->and($order->payment_status)->toBe(PaymentStatus::Unpaid)
        ->and($variant->fresh()->stock)->toBe(3)
        ->and($order->items)->toHaveCount(1)
        ->and($order->items->first()->line_total_minor)->toBe(30000)
        ->and($order->lookup_token)->toHaveLength(64)
        ->and($cart->items()->count())->toBe(0);

    expect(InventoryMovement::query()->where('order_id', $order->id)->first()->reason)
        ->toBe(InventoryReason::Sale);
});

test('repeated checkout submission with the same key does not create a duplicate order or deduct stock twice', function () {
    [$cart, $variant] = checkoutCart(stock: 5, quantity: 2);
    $key = str_repeat('b', 64);
    $this->withSession([
        'cart_session_id' => $cart->session_id,
        'checkout.idempotency_key' => $key,
    ]);

    $this->post('/checkout', validCheckoutData($key))->assertRedirect();
    $firstReference = Order::query()->value('reference');
    $this->post('/checkout', validCheckoutData($key))->assertRedirect(route('orders.confirmation', [
        'reference' => $firstReference,
        'lookupToken' => Order::query()->value('lookup_token'),
    ]));

    expect(Order::query()->count())->toBe(1)
        ->and($variant->fresh()->stock)->toBe(3);
});

test('checkout rejects an unavailable delivery area without creating an order', function () {
    [$cart, $variant] = checkoutCart();
    config()->set('shop.delivery.areas', ['Kampala', 'Entebbe']);
    $key = str_repeat('c', 64);

    $this->withSession([
        'cart_session_id' => $cart->session_id,
        'checkout.idempotency_key' => $key,
    ])->from('/checkout')->post('/checkout', [
        ...validCheckoutData($key),
        'delivery_area' => 'Mbarara',
    ])->assertSessionHasErrors('delivery_area');

    expect(Order::query()->count())->toBe(0)
        ->and($variant->fresh()->stock)->toBe(5);
});

test('checkout revalidates stock and ignores client-supplied totals', function () {
    [$cart, $variant] = checkoutCart(stock: 1, quantity: 2);
    $key = str_repeat('d', 64);

    $this->withSession([
        'cart_session_id' => $cart->session_id,
        'checkout.idempotency_key' => $key,
    ])->from('/checkout')->post('/checkout', [
        ...validCheckoutData($key),
        'total_minor' => 1,
        'unit_price_minor' => 1,
    ])->assertSessionHasErrors('cart');

    expect(Order::query()->count())->toBe(0)
        ->and($variant->fresh()->stock)->toBe(1);
});

test('confirmation requires both the public reference and secure lookup token', function () {
    [$cart] = checkoutCart();
    $key = str_repeat('e', 64);
    $this->withSession([
        'cart_session_id' => $cart->session_id,
        'checkout.idempotency_key' => $key,
    ])->post('/checkout', validCheckoutData($key));

    $order = Order::query()->firstOrFail();
    $this->get(route('orders.confirmation', [
        'reference' => $order->reference,
        'lookupToken' => $order->lookup_token,
    ]))->assertOk()->assertInertia(fn ($page) => $page
        ->component('shop/order-confirmation')
        ->where('order.paymentConfirmed', false));

    $this->get(route('orders.confirmation', [
        'reference' => $order->reference,
        'lookupToken' => str_repeat('0', 64),
    ]))->assertNotFound();
});

test('expired unpaid order releases its reserved stock exactly once', function () {
    [$cart, $variant] = checkoutCart(stock: 5, quantity: 2);
    $key = str_repeat('f', 64);
    $this->withSession([
        'cart_session_id' => $cart->session_id,
        'checkout.idempotency_key' => $key,
    ])->post('/checkout', validCheckoutData($key));
    $order = Order::query()->firstOrFail();
    $order->update(['inventory_reserved_until' => now()->subMinute()]);

    $this->artisan('orders:release-expired-inventory')
        ->expectsOutput('Released inventory for 1 expired order(s).')
        ->assertExitCode(0);
    $this->artisan('orders:release-expired-inventory')
        ->expectsOutput('Released inventory for 0 expired order(s).')
        ->assertExitCode(0);

    expect($variant->fresh()->stock)->toBe(5)
        ->and($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and(InventoryMovement::query()->where('order_id', $order->id)->count())->toBe(2);
});

test('failed payment releases reserved stock without waiting for the unpaid hold to expire', function () {
    [$cart, $variant] = checkoutCart(stock: 5, quantity: 2);
    $key = str_repeat('g', 64);
    $this->withSession([
        'cart_session_id' => $cart->session_id,
        'checkout.idempotency_key' => $key,
    ])->post('/checkout', validCheckoutData($key));
    $order = Order::query()->firstOrFail();
    $order->update([
        'payment_status' => PaymentStatus::Failed,
        'inventory_reserved_until' => now()->addDay(),
    ]);

    expect(app(OrderInventoryService::class)->releaseExpiredReservations())->toBe(1)
        ->and($variant->fresh()->stock)->toBe(5)
        ->and($order->fresh()->status)->toBe(OrderStatus::Cancelled);
});
