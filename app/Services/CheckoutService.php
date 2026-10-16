<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Models\AuditLog;
use App\Models\Cart;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\Notifications\OrderNotificationService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private readonly ShopSettingsService $settings,
        private readonly OrderNotificationService $notifications,
    ) {}

    /**
     * Return the server-calculated charges for a cart subtotal and delivery area.
     *
     * @return array{subtotal_minor: int, delivery_fee_minor: int, tax_minor: int, total_minor: int}
     */
    public function quote(int $subtotal, string $area): array
    {
        $areas = $this->settings->areas(config('shop.delivery.areas', []));
        if ($areas !== [] && ! in_array(mb_strtolower($area), array_map(mb_strtolower(...), $areas), true)) {
            throw ValidationException::withMessages([
                'delivery_area' => 'We do not currently deliver to this area.',
            ]);
        }

        $deliveryFee = $this->settings->deliveryFee($subtotal);

        $taxEnabled = $this->settings->taxEnabled();
        $taxRate = $this->settings->taxRate();
        $taxInclusive = $this->settings->taxInclusive();

        $taxableAmount = $taxInclusive ? $subtotal : $subtotal + $deliveryFee;
        $tax = $taxEnabled && $taxRate > 0
            ? (int) round($taxInclusive
                ? $taxableAmount * $taxRate / (1 + $taxRate)
                : $taxableAmount * $taxRate)
            : 0;

        return [
            'subtotal_minor' => $subtotal,
            'delivery_fee_minor' => $deliveryFee,
            'tax_minor' => $tax,
            'total_minor' => $subtotal + $deliveryFee + ($taxInclusive ? 0 : $tax),
        ];
    }

    /**
     * Create one order for an idempotent submission, locking cart and stock rows.
     *
     * @param  array{name: string, email: string|null, phone: string, address_line: string, delivery_area: string, postal_code: string|null, delivery_notes: string|null, customer_notes: string|null}  $customer
     */
    public function placeOrder(Cart $cart, array $customer, string $idempotencyKey): Order
    {
        try {
            return DB::transaction(function () use ($cart, $customer, $idempotencyKey): Order {
                $lockedCart = Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
                $existingOrder = Order::query()
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existingOrder) {
                    return $existingOrder;
                }

                $cartItems = $lockedCart->items()->orderBy('id')->lockForUpdate()->get();

                if ($cartItems->isEmpty()) {
                    throw ValidationException::withMessages([
                        'cart' => 'Your cart is empty. Add an item before placing your order.',
                    ]);
                }

                $variantIds = $cartItems->pluck('variant_id')->unique()->sort()->values();
                $productIds = ProductVariant::query()
                    ->whereIn('id', $variantIds)
                    ->orderBy('product_id')
                    ->pluck('product_id')
                    ->unique()
                    ->sort()
                    ->values();
                $products = Product::query()
                    ->whereIn('id', $productIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');
                $variants = ProductVariant::query()
                    ->whereIn('id', $variantIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $subtotal = 0;
                $items = [];
                foreach ($cartItems as $cartItem) {
                    /** @var ProductVariant|null $variant */
                    $variant = $variants->get($cartItem->variant_id);
                    $product = $variant ? $products->get($variant->product_id) : null;

                    if (! $variant || ! $product || $product->status !== ProductStatus::Published || ! $variant->active) {
                        throw ValidationException::withMessages([
                            'cart' => 'An item in your cart is no longer available. Review your cart and try again.',
                        ]);
                    }

                    if ($cartItem->quantity < 1 || $cartItem->quantity > CartService::MAX_QTY || $variant->stock < $cartItem->quantity) {
                        throw ValidationException::withMessages([
                            'cart' => "{$product->name} ({$variant->label}) no longer has the requested quantity in stock.",
                        ]);
                    }

                    $lineTotal = $variant->price_minor * $cartItem->quantity;
                    $subtotal += $lineTotal;
                    $items[] = [
                        'variant' => $variant,
                        'product' => $product,
                        'quantity' => $cartItem->quantity,
                        'line_total' => $lineTotal,
                    ];
                }

                $quote = $this->quote($subtotal, $customer['delivery_area']);

                $order = Order::create([
                    'idempotency_key' => $idempotencyKey,
                    'status' => OrderStatus::Pending,
                    'payment_status' => PaymentStatus::Unpaid,
                    'customer_name' => $customer['name'],
                    'customer_email' => $customer['email'],
                    'customer_phone' => $customer['phone'],
                    'delivery_address' => array_filter([
                        'line1' => $customer['address_line'],
                        'area' => $customer['delivery_area'],
                        'postal_code' => $customer['postal_code'],
                    ], static fn (mixed $value): bool => $value !== null && $value !== ''),
                    'delivery_notes' => $customer['delivery_notes'],
                    'customer_notes' => $customer['customer_notes'],
                    ...$quote,
                    'currency' => config('shop.currency'),
                    'inventory_reserved_until' => now()->addHours($this->settings->reservationHours()),
                ]);
                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'actor_id' => null,
                    'from_status' => OrderStatus::Pending,
                    'to_status' => OrderStatus::Pending,
                    'note' => 'Order received from customer checkout.',
                ]);
                AuditLog::create([
                    'actor_id' => null,
                    'event' => 'order.created',
                    'subject_type' => Order::class,
                    'subject_id' => $order->id,
                    'details' => ['reference' => $order->reference],
                ]);

                foreach ($items as $item) {
                    /** @var ProductVariant $variant */
                    $variant = $item['variant'];
                    $quantity = $item['quantity'];
                    $stockBefore = $variant->stock;
                    $updated = ProductVariant::query()
                        ->whereKey($variant->id)
                        ->where('stock', '>=', $quantity)
                        ->decrement('stock', $quantity);

                    if ($updated !== 1) {
                        throw ValidationException::withMessages([
                            'cart' => 'Stock changed while placing your order. Review your cart and try again.',
                        ]);
                    }

                    $variant->refresh();
                    OrderItem::create([
                        'order_id' => $order->id,
                        'variant_id' => $variant->id,
                        'product_name' => $item['product']->name,
                        'variant_label' => $variant->label,
                        'sku' => $variant->sku,
                        'unit_price_minor' => $variant->price_minor,
                        'quantity' => $quantity,
                        'line_total_minor' => $item['line_total'],
                    ]);

                    InventoryMovement::create([
                        'variant_id' => $variant->id,
                        'order_id' => $order->id,
                        'reason' => InventoryReason::Sale,
                        'delta' => -$quantity,
                        'stock_before' => $stockBefore,
                        'stock_after' => $variant->stock,
                        'note' => "Stock reserved for order {$order->reference}.",
                    ]);
                }

                $lockedCart->items()->delete();

                $this->notifications->sendOrderReceived($order);

                return $order;
            }, attempts: 3);
        } catch (QueryException $exception) {
            $existingOrder = Order::query()->where('idempotency_key', $idempotencyKey)->first();
            if ($existingOrder) {
                return $existingOrder;
            }

            throw $exception;
        }
    }
}
