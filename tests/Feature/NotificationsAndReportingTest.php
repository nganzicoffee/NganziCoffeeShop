<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Jobs\SendOrderNotification;
use App\Mail\OrderUpdateMail;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderNotification;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Notifications\OrderMessageBuilder;
use App\Services\Notifications\OrderNotificationService;
use App\Services\Notifications\SmsSender;
use App\Services\OrderPaymentService;
use App\Services\OrderStatusService;
use Illuminate\Support\Facades\Mail;

function createOrderWithItem(array $orderOverrides = [], array $itemOverrides = []): Order
{
    $order = Order::factory()->create(array_merge([
        'customer_name' => 'Sarah Namono',
        'customer_email' => 'sarah@example.com',
        'customer_phone' => '+256772123456',
        'delivery_address' => ['line1' => 'Plot 44 Acacia Ave', 'area' => 'Kampala'],
        'internal_notes' => 'CONFIDENTIAL-STAFF-NOTE-99',
        'subtotal_minor' => 30000,
        'delivery_fee_minor' => 5000,
        'tax_minor' => 0,
        'total_minor' => 35000,
        'currency' => 'UGX',
    ], $orderOverrides));

    OrderItem::factory()->create(array_merge([
        'order_id' => $order->id,
        'product_name' => 'Mt. Elgon Medium Roast',
        'variant_label' => '250g',
        'sku' => 'ELGON-250',
        'unit_price_minor' => 15000,
        'quantity' => 2,
        'line_total_minor' => 30000,
    ], $itemOverrides));

    return $order->fresh('items');
}

test('successful checkout sends order-received notification once and is idempotent on retry', function () {
    Mail::fake();

    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Published,
        'name' => 'Rwenzori Dark Roast',
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'label' => '500g',
        'sku' => 'RWEN-500',
        'price_minor' => 25000,
        'stock' => 10,
        'active' => true,
    ]);
    $cart = Cart::factory()->create();
    CartItem::factory()->create([
        'cart_id' => $cart->id,
        'variant_id' => $variant->id,
        'quantity' => 1,
    ]);

    $key = str_repeat('n', 64);
    $payload = [
        'idempotency_key' => $key,
        'name' => 'Grace Kato',
        'email' => 'grace@example.com',
        'phone' => '+256701234567',
        'address_line' => '18 Kololo Terrace',
        'delivery_area' => 'Kampala',
        'postal_code' => '',
        'delivery_notes' => '',
        'customer_notes' => '',
    ];

    $this->withSession([
        'cart_session_id' => $cart->session_id,
        'checkout.idempotency_key' => $key,
    ])->post('/checkout', $payload)->assertRedirect();

    // Retry checkout with same idempotency key
    $this->post('/checkout', $payload)->assertRedirect();

    $order = Order::firstOrFail();

    // Calling sendOrderReceived again directly is also a no-op
    app(OrderNotificationService::class)->sendOrderReceived($order);

    Mail::assertSent(OrderUpdateMail::class, 1);

    $notification = OrderNotification::where('order_id', $order->id)
        ->where('type', OrderNotification::TYPE_ORDER_RECEIVED)
        ->where('channel', OrderNotification::CHANNEL_EMAIL)
        ->firstOrFail();

    expect($notification->status)->toBe(OrderNotification::STATUS_SENT)
        ->and($notification->attempts)->toBe(1)
        ->and($notification->recipient_hint)->not->toContain('grace@example.com');
});

test('payment confirmation notification is sent only after verified payment and is idempotent on webhook retry', function () {
    Mail::fake();
    config()->set('shop.payments.webhook_secret', 'test-webhook-hmac-secret');

    $order = createOrderWithItem([
        'payment_status' => PaymentStatus::Unpaid,
    ]);

    // Pending or failed payment attempts must not send payment confirmation
    app(OrderPaymentService::class)->recordAttempt(
        order: $order,
        provider: 'mobile_money',
        providerReference: 'ATTEMPT-PENDING-1',
        status: PaymentStatus::Pending,
        amountMinor: $order->total_minor,
    );
    app(OrderPaymentService::class)->recordAttempt(
        order: $order,
        provider: 'mobile_money',
        providerReference: 'ATTEMPT-FAILED-1',
        status: PaymentStatus::Failed,
        amountMinor: $order->total_minor,
    );

    Mail::assertNothingSent();

    // Invalid webhook signature is rejected
    $body = json_encode([
        'order_reference' => $order->reference,
        'provider' => 'mtn_momo',
        'provider_reference' => 'MOMO-TXN-8899',
        'status' => 'paid',
        'amount_minor' => $order->total_minor,
    ], JSON_THROW_ON_ERROR);

    $this->call('POST', '/webhooks/payments', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_X_NGANZI_SIGNATURE' => 'invalid-signature',
    ], $body)->assertUnauthorized();

    Mail::assertNothingSent();

    // Valid verified webhook confirms payment and sends exactly 1 confirmation
    $validSignature = hash_hmac('sha256', $body, 'test-webhook-hmac-secret');

    $this->call('POST', '/webhooks/payments', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_X_NGANZI_SIGNATURE' => $validSignature,
    ], $body)->assertOk();

    // Retrying the exact same webhook does not send a duplicate notification
    $this->call('POST', '/webhooks/payments', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_X_NGANZI_SIGNATURE' => $validSignature,
    ], $body)->assertOk();

    expect($order->fresh()->payment_status)->toBe(PaymentStatus::Paid);
    Mail::assertSent(OrderUpdateMail::class, 1);

    expect(OrderNotification::where('order_id', $order->id)
        ->where('type', OrderNotification::TYPE_PAYMENT_CONFIRMED)
        ->count())->toBe(1);
});

test('fulfilment updates send notifications only on meaningful transitions and ignore unchanged status saves', function () {
    Mail::fake();

    $staff = User::factory()->orderManager()->create();
    $order = createOrderWithItem(['status' => OrderStatus::Pending]);
    $statusService = app(OrderStatusService::class);

    // Saving an unchanged status is a no-op
    $statusService->transition($order, OrderStatus::Pending, $staff, 'Unchanged status');
    Mail::assertNothingSent();
    expect(OrderStatusHistory::where('order_id', $order->id)->count())->toBe(0);

    // Pending -> Confirmed (meaningful: sends notification)
    $statusService->transition($order->fresh(), OrderStatus::Confirmed, $staff, 'Confirmed');
    expect(OrderNotification::where('order_id', $order->id)->count())->toBe(1);

    // Confirmed -> Processing (internal prep step: does not spam customer)
    $statusService->transition($order->fresh(), OrderStatus::Processing, $staff, 'Roasting');
    expect(OrderNotification::where('order_id', $order->id)->count())->toBe(1);

    // Processing -> ReadyToDispatch (internal prep step: does not spam customer)
    $statusService->transition($order->fresh(), OrderStatus::ReadyToDispatch, $staff, 'Packed');
    expect(OrderNotification::where('order_id', $order->id)->count())->toBe(1);

    // ReadyToDispatch -> Dispatched (meaningful: sends notification)
    $statusService->transition($order->fresh(), OrderStatus::Dispatched, $staff, 'With rider');
    expect(OrderNotification::where('order_id', $order->id)->count())->toBe(2);

    // Dispatched -> Completed (meaningful: sends notification)
    $statusService->transition($order->fresh(), OrderStatus::Completed, $staff, 'Delivered');
    expect(OrderNotification::where('order_id', $order->id)->count())->toBe(3);

    Mail::assertSent(OrderUpdateMail::class, 3);
});

test('notification template includes reference, summary, next steps and support contact without sensitive data', function () {
    config()->set('shop.support.email', 'support@nganzicoffee.com');
    config()->set('shop.support.phone', '+256700999888');

    $order = createOrderWithItem([
        'customer_phone' => '+256772123456',
        'delivery_address' => ['line1' => 'Secret Apartment 4B, Bugolobi', 'area' => 'Kampala'],
        'internal_notes' => 'VIP gate code 4321',
    ]);

    $notification = OrderNotification::create([
        'order_id' => $order->id,
        'type' => OrderNotification::TYPE_ORDER_RECEIVED,
        'channel' => OrderNotification::CHANNEL_EMAIL,
        'dedupe_key' => "order:{$order->id}:order_received:email",
        'recipient_hint' => 's***h@example.com',
        'status' => OrderNotification::STATUS_QUEUED,
    ]);

    $builder = app(OrderMessageBuilder::class);
    $message = $builder->build($notification, $order);
    $shortReference = $builder->shortReference($order);
    $html = (new OrderUpdateMail(
        order: $order,
        message: $message,
        shortReference: $shortReference,
        totalFormatted: $builder->money($order->total_minor, $order->currency),
    ))->render();

    expect($html)
        ->toContain($shortReference)
        ->toContain('Mt. Elgon Medium Roast')
        ->toContain('250g')
        ->toContain('UGX 35,000')
        ->toContain('What happens next')
        ->toContain('support@nganzicoffee.com')
        ->toContain('+256700999888')
        ->not->toContain('+256772123456')
        ->not->toContain('Secret Apartment 4B')
        ->not->toContain('VIP gate code 4321');
});

test('failed notification delivery redacts secrets, is observable in admin, and can be retried', function () {
    config()->set('shop.notifications.sms_enabled', true);

    $order = createOrderWithItem([
        'customer_email' => null,
        'customer_phone' => '+256772123456',
    ]);

    $notification = OrderNotification::create([
        'order_id' => $order->id,
        'type' => OrderNotification::TYPE_ORDER_RECEIVED,
        'channel' => OrderNotification::CHANNEL_SMS,
        'dedupe_key' => "order:{$order->id}:order_received:sms",
        'recipient_hint' => '+25*********56',
        'status' => OrderNotification::STATUS_QUEUED,
    ]);

    app()->bind(SmsSender::class, fn () => new class implements SmsSender
    {
        public function send(string $phoneNumber, string $message, array $context = []): void
        {
            throw new RuntimeException('SMS gateway rejected Bearer sk_live_9876543210secret for +256772123456 api_key=my_secret_key_123');
        }
    });

    $job = new SendOrderNotification($notification->id);
    expect(fn () => app()->call([$job, 'handle']))->toThrow(RuntimeException::class);

    $failed = $notification->fresh();
    expect($failed->status)->toBe(OrderNotification::STATUS_FAILED)
        ->and($failed->attempts)->toBe(1)
        ->and($failed->last_error)->not->toContain('sk_live_9876543210secret')
        ->and($failed->last_error)->not->toContain('my_secret_key_123')
        ->and($failed->last_error)->not->toContain('+256772123456')
        ->and($failed->last_error)->toContain('[redacted]');

    // Observable on dashboard and order detail
    $staff = User::factory()->orderManager()->create();
    $this->actingAs($staff)->get('/admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('metrics.failed_notifications_count', 1));

    $this->actingAs($staff)->get("/admin/orders/{$order->reference}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('order.notifications.0.status', 'failed'));

    // Now bind a working SMS sender and retry via admin endpoint
    app()->bind(SmsSender::class, fn () => new class implements SmsSender
    {
        public function send(string $phoneNumber, string $message, array $context = []): void {}
    });

    $this->actingAs($staff)
        ->post("/admin/orders/{$order->reference}/notifications/{$notification->id}/retry")
        ->assertRedirect();

    expect($notification->fresh()->status)->toBe(OrderNotification::STATUS_SENT)
        ->and($notification->fresh()->last_error)->toBeNull();
});

test('dashboard reports order count, paid sales, refunds, product performance, fulfilment backlog, and inventory exceptions', function () {
    $staff = User::factory()->reporting()->create();
    $today = now()->toDateString();

    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'category_id' => $category->id,
        'name' => 'Bugisu AA Light Roast',
        'status' => ProductStatus::Published,
    ]);
    $lowVariant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'label' => '250g',
        'sku' => 'BUG-250',
        'stock' => 2,
        'active' => true,
    ]);
    $outVariant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'label' => '1kg',
        'sku' => 'BUG-1KG',
        'stock' => 0,
        'active' => true,
    ]);

    $paidOrder = createOrderWithItem([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
        'total_minor' => 50000,
        'created_at' => now(),
    ], [
        'product_name' => 'Bugisu AA Light Roast',
        'variant_label' => '250g',
        'sku' => 'BUG-250',
        'quantity' => 3,
        'unit_price_minor' => 15000,
        'line_total_minor' => 45000,
    ]);

    createOrderWithItem([
        'status' => OrderStatus::Pending,
        'payment_status' => PaymentStatus::Unpaid,
        'total_minor' => 30000,
        'created_at' => now(),
    ]);

    createOrderWithItem([
        'status' => OrderStatus::Cancelled,
        'payment_status' => PaymentStatus::Refunded,
        'total_minor' => 20000,
        'created_at' => now(),
    ]);

    $this->actingAs($staff)->get("/admin?from={$today}&to={$today}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('metrics.order_count', 3)
            ->where('metrics.sales_minor', 50000)
            ->where('metrics.paid_order_count', 1)
            ->where('metrics.average_order_value_minor', 50000)
            ->where('metrics.refunded_count', 1)
            ->where('metrics.refunded_minor', 20000)
            ->where('metrics.unfulfilled_count', 2)
            ->where('productPerformance.0.product_name', 'Bugisu AA Light Roast')
            ->where('productPerformance.0.units_sold', 3)
            ->where('productPerformance.0.revenue_minor', 45000)
            ->has('fulfilmentBacklog', 5)
            ->has('inventoryExceptions', 2));
});

test('csv export is permission-protected, validates filters, sanitizes formulas, and excludes customer PII', function () {
    $inventoryManager = User::factory()->inventoryManager()->create();
    $customer = User::factory()->create();
    $reporting = User::factory()->reporting()->create();
    $today = now()->toDateString();

    createOrderWithItem([
        'customer_name' => 'Private Customer Name',
        'customer_email' => 'private@example.com',
        'customer_phone' => '+256788999000',
        'payment_status' => PaymentStatus::Paid,
        'created_at' => now(),
    ], [
        'product_name' => '=cmd|\' /C calc\'!A0',
        'variant_label' => '250g',
        'sku' => 'SAFE-SKU',
        'quantity' => 1,
        'line_total_minor' => 15000,
    ]);

    // Non-staff and InventoryManager are forbidden from exporting
    $this->actingAs($customer)->get("/admin/orders/export?from={$today}&to={$today}")->assertForbidden();
    $this->actingAs($inventoryManager)->get("/admin/orders/export?from={$today}&to={$today}")->assertForbidden();

    // Invalid date range is rejected
    $this->actingAs($reporting)
        ->from('/admin/orders')
        ->get('/admin/orders/export?from=2026-05-10&to=2026-05-01')
        ->assertRedirect('/admin/orders')
        ->assertSessionHasErrors('to');

    // Authorized reporting staff can export sanitized, PII-free CSV
    $response = $this->actingAs($reporting)->get("/admin/orders/export?from={$today}&to={$today}");
    $response->assertOk();
    $csv = $response->streamedContent();

    expect($csv)
        ->toContain("'=cmd|'")
        ->not->toContain('Private Customer Name')
        ->not->toContain('private@example.com')
        ->not->toContain('+256788999000');
});

test('privacy-conscious analytics script loads on storefront when configured and never on admin pages', function () {
    config()->set('shop.analytics.script_src', 'https://plausible.io/js/script.js');
    config()->set('shop.analytics.site_id', 'nganzicoffee.com');

    $this->get('/')
        ->assertOk()
        ->assertSee('https://plausible.io/js/script.js', false)
        ->assertSee('data-domain="nganzicoffee.com"', false);

    $staff = User::factory()->owner()->create();
    $this->actingAs($staff)->get('/admin')
        ->assertOk()
        ->assertDontSee('https://plausible.io/js/script.js', false);
});
