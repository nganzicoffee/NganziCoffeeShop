<?php

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\StaffRole;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;

function adminTestOrder(array $attributes = []): Order
{
    return Order::factory()->create($attributes);
}

function adminTestInventory(int $stock, int $price = 15000): ProductVariant
{
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Published,
    ]);

    return ProductVariant::factory()->create([
        'product_id' => $product->id,
        'active' => true,
        'stock' => $stock,
        'price_minor' => $price,
    ]);
}

test('admin routes require a verified staff account', function () {
    $this->get('/admin')->assertRedirect('/login');
    $this->actingAs(User::factory()->create())->get('/admin')->assertForbidden();
});

test('dashboard reports paid sales separately and computes average order value', function () {
    $staff = User::factory()->reporting()->create();
    $today = now()->toDateString();
    adminTestOrder([
        'payment_status' => PaymentStatus::Paid,
        'total_minor' => 40000,
        'created_at' => now(),
    ]);
    adminTestOrder([
        'payment_status' => PaymentStatus::Paid,
        'total_minor' => 60000,
        'created_at' => now(),
    ]);
    adminTestOrder([
        'payment_status' => PaymentStatus::Unpaid,
        'total_minor' => 90000,
        'created_at' => now(),
    ]);
    adminTestOrder([
        'payment_status' => PaymentStatus::Refunded,
        'total_minor' => 120000,
        'created_at' => now(),
    ]);

    $this->actingAs($staff)->get("/admin?from={$today}&to={$today}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('metrics.sales_minor', 100000)
            ->where('metrics.paid_order_count', 2)
            ->where('metrics.average_order_value_minor', 50000)
            ->has('salesTrend')
            ->where('salesDefinition', fn (string $definition) => str_contains($definition, 'excludes unpaid')));
});

test('dashboard counts pending, unfulfilled, low-stock and out-of-stock inventory', function () {
    $staff = User::factory()->owner()->create();
    adminTestOrder(['status' => OrderStatus::Pending]);
    adminTestOrder(['status' => OrderStatus::Processing]);
    adminTestOrder(['status' => OrderStatus::Completed]);
    adminTestOrder(['status' => OrderStatus::Cancelled]);
    adminTestInventory(3);
    adminTestInventory(0);

    $this->actingAs($staff)->get('/admin')
        ->assertInertia(fn ($page) => $page
            ->where('metrics.awaiting_action_count', 1)
            ->where('metrics.unfulfilled_count', 2)
            ->where('metrics.low_stock_count', 1)
            ->where('metrics.out_of_stock_count', 1));
});

test('order search filters by customer and payment status', function () {
    $staff = User::factory()->reporting()->create();
    $matching = adminTestOrder([
        'customer_name' => 'Amina N.',
        'customer_email' => 'amina@example.com',
        'payment_status' => PaymentStatus::Paid,
    ]);
    adminTestOrder(['customer_name' => 'Other Customer', 'payment_status' => PaymentStatus::Paid]);

    $this->actingAs($staff)->get('/admin/orders?search=amina&payment_status=paid')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/index')
            ->has('orders.data', 1)
            ->where('orders.data.0.reference', $matching->reference));
});

test('order managers can make only allowed audited status transitions', function () {
    $staff = User::factory()->orderManager()->create();
    $order = adminTestOrder(['status' => OrderStatus::Pending]);

    $this->actingAs($staff)->patch("/admin/orders/{$order->reference}/status", [
        'status' => OrderStatus::Confirmed->value,
        'note' => 'Customer details verified.',
    ])->assertRedirect();

    $history = OrderStatusHistory::where('order_id', $order->id)->firstOrFail();
    expect($order->fresh()->status)->toBe(OrderStatus::Confirmed)
        ->and($history->from_status)->toBe(OrderStatus::Pending)
        ->and($history->to_status)->toBe(OrderStatus::Confirmed)
        ->and($history->actor_id)->toBe($staff->id)
        ->and($history->note)->toBe('Customer details verified.');
});

test('status transitions cannot skip fulfilment stages', function () {
    $staff = User::factory()->orderManager()->create();
    $order = adminTestOrder(['status' => OrderStatus::Pending]);

    $this->actingAs($staff)->from("/admin/orders/{$order->reference}")
        ->patch("/admin/orders/{$order->reference}/status", ['status' => OrderStatus::Dispatched->value])
        ->assertSessionHasErrors('status');

    expect($order->fresh()->status)->toBe(OrderStatus::Pending)
        ->and(OrderStatusHistory::where('order_id', $order->id)->count())->toBe(0);
});

test('cancellation requires a reason and releases reserved stock once', function () {
    $staff = User::factory()->orderManager()->create();
    $variant = adminTestInventory(3);
    $order = adminTestOrder([
        'status' => OrderStatus::Pending,
        'inventory_reserved_until' => now()->addDay(),
    ]);
    OrderItem::factory()->create([
        'order_id' => $order->id,
        'variant_id' => $variant->id,
        'quantity' => 2,
    ]);
    $variant->update(['stock' => 1]);

    $this->actingAs($staff)->from("/admin/orders/{$order->reference}")
        ->patch("/admin/orders/{$order->reference}/status", ['status' => OrderStatus::Cancelled->value])
        ->assertSessionHasErrors('note');
    expect($variant->fresh()->stock)->toBe(1);

    $this->patch("/admin/orders/{$order->reference}/status", [
        'status' => OrderStatus::Cancelled->value,
        'note' => 'Customer requested cancellation.',
    ])->assertRedirect();

    expect($variant->fresh()->stock)->toBe(3)
        ->and($order->fresh()->status)->toBe(OrderStatus::Cancelled)
        ->and(InventoryMovement::where('order_id', $order->id)->where('reason', InventoryReason::SaleReversed)->count())->toBe(1);
});

test('paid order cancellation is blocked until refunds are supported', function () {
    $staff = User::factory()->owner()->create();
    $order = adminTestOrder([
        'status' => OrderStatus::Processing,
        'payment_status' => PaymentStatus::Paid,
    ]);

    $this->actingAs($staff)->from("/admin/orders/{$order->reference}")
        ->patch("/admin/orders/{$order->reference}/status", [
            'status' => OrderStatus::Cancelled->value,
            'note' => 'Cancel request.',
        ])->assertSessionHasErrors('status');
    expect($order->fresh()->status)->toBe(OrderStatus::Processing);
});

test('reporting staff cannot update order status', function () {
    $staff = User::factory()->reporting()->create();
    $order = adminTestOrder(['status' => OrderStatus::Pending]);

    $this->actingAs($staff)->patch("/admin/orders/{$order->reference}/status", [
        'status' => OrderStatus::Confirmed->value,
    ])->assertForbidden();
});

test('paid product report exports only captured paid order line items', function () {
    $staff = User::factory()->reporting()->create();
    $paid = adminTestOrder(['payment_status' => PaymentStatus::Paid, 'created_at' => now()]);
    $unpaid = adminTestOrder(['payment_status' => PaymentStatus::Unpaid, 'created_at' => now()]);
    OrderItem::factory()->create([
        'order_id' => $paid->id,
        'product_name' => 'Paid Coffee',
        'variant_label' => '250g',
        'quantity' => 2,
        'unit_price_minor' => 15000,
        'line_total_minor' => 30000,
    ]);
    OrderItem::factory()->create([
        'order_id' => $unpaid->id,
        'product_name' => 'Unpaid Coffee',
    ]);
    $date = now()->toDateString();

    $response = $this->actingAs($staff)->get("/admin/orders/export?from={$date}&to={$date}");
    $response->assertOk()->assertDownload("paid-product-sales-{$date}-{$date}.csv");
    $csv = $response->streamedContent();
    expect($csv)->toContain('Paid Coffee')->not->toContain('Unpaid Coffee');
});

test('order detail includes payment attempts, delivery details and status history', function () {
    $staff = User::factory()->owner()->create();
    $order = adminTestOrder(['delivery_address' => ['line1' => '12 Bean Road', 'area' => 'Kampala']]);
    $order->payments()->create([
        'provider' => 'manual',
        'provider_reference' => 'PAY-123',
        'amount_minor' => $order->total_minor,
        'currency' => $order->currency,
        'status' => PaymentStatus::Pending,
    ]);
    OrderStatusHistory::factory()->create([
        'order_id' => $order->id,
        'actor_id' => $staff->id,
        'from_status' => OrderStatus::Pending,
        'to_status' => OrderStatus::Confirmed,
    ]);

    $this->actingAs($staff)->get("/admin/orders/{$order->reference}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/show')
            ->where('order.deliveryAddress.area', 'Kampala')
            ->where('order.payments.0.reference', 'PAY-123')
            ->where('order.history.0.actor', $staff->name));
});

test('order detail includes customer prior order history for fulfillment and support', function () {
    $staff = User::factory()->owner()->create();
    $firstOrder = adminTestOrder([
        'customer_email' => 'loyal@example.com',
        'customer_phone' => '+256700111222',
        'total_minor' => 35000,
        'created_at' => now()->subDays(5),
    ]);
    $secondOrder = adminTestOrder([
        'customer_email' => 'loyal@example.com',
        'customer_phone' => '+256700111222',
        'total_minor' => 70000,
        'created_at' => now(),
    ]);

    $this->actingAs($staff)->get("/admin/orders/{$secondOrder->reference}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/orders/show')
            ->has('order.customerHistory', 1)
            ->where('order.customerHistory.0.reference', $firstOrder->reference));
});

test('inventory movement history is accessible to inventory manager and owner only', function () {
    $owner = User::factory()->owner()->create();
    $inventoryManager = User::factory()->inventoryManager()->create();
    $reporting = User::factory()->reporting()->create();

    $this->actingAs($reporting)->get('/admin/inventory')->assertForbidden();

    $this->actingAs($inventoryManager)->get('/admin/inventory')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/inventory'));

    $this->actingAs($owner)->get('/admin/inventory')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/inventory'));
});

test('store settings are accessible and mutable by owner only', function () {
    $owner = User::factory()->owner()->create();
    $orderManager = User::factory()->orderManager()->create();

    $this->actingAs($orderManager)->get('/admin/settings')->assertForbidden();
    $this->actingAs($orderManager)->put('/admin/settings', [
        'delivery_fee' => 5000,
        'free_delivery_above' => 100000,
        'delivery_areas' => 'Kampala',
        'reservation_hours' => 24,
        'tax_enabled' => false,
        'tax_rate' => 0.0,
        'tax_inclusive' => true,
    ])->assertForbidden();

    $this->actingAs($owner)->get('/admin/settings')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/settings'));

    $this->actingAs($owner)->put('/admin/settings', [
        'delivery_fee' => 7500,
        'free_delivery_above' => 150000,
        'delivery_areas' => 'Kampala, Entebbe, Wakiso',
        'reservation_hours' => 48,
        'tax_enabled' => true,
        'tax_rate' => 0.18,
        'tax_inclusive' => true,
    ])->assertRedirect();

    $this->assertDatabaseHas('store_settings', [
        'key' => 'delivery_flat_fee',
        'value' => '7500',
    ]);
});

test('staff management allows owner to update roles and prevents demoting last owner', function () {
    $owner = User::factory()->owner()->create();
    $targetUser = User::factory()->create(['email_verified_at' => now(), 'role' => null]);
    $reporting = User::factory()->reporting()->create();

    $this->actingAs($reporting)->get('/admin/staff')->assertForbidden();

    $this->actingAs($owner)->get('/admin/staff')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/staff'));

    // Promote target user to order manager
    $this->actingAs($owner)->patch("/admin/staff/{$targetUser->id}/role", [
        'role' => StaffRole::OrderManager->value,
    ])->assertRedirect();

    expect($targetUser->fresh()->role)->toBe(StaffRole::OrderManager);

    // Attempting to demote last owner is rejected
    $this->actingAs($owner)->from('/admin/staff')
        ->patch("/admin/staff/{$owner->id}/role", [
            'role' => StaffRole::Reporting->value,
        ])->assertForbidden(); // Cannot change own role
});

test('audit log is accessible by owner only and records actions', function () {
    $owner = User::factory()->owner()->create();
    $orderManager = User::factory()->orderManager()->create();

    $this->actingAs($orderManager)->get('/admin/audit-log')->assertForbidden();

    $this->actingAs($owner)->get('/admin/audit-log')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/audit-log'));
});
