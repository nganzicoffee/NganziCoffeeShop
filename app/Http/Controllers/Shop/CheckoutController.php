<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\CartService;
use App\Services\CheckoutService;
use App\Services\ShopSettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CheckoutService $checkoutService,
        private readonly ShopSettingsService $settings,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $cart = $this->cartService->resolveCart($request, createIfMissing: false);
        if (! $cart) {
            return redirect()->route('cart.show');
        }

        $summary = $this->cartService->summary($cart);
        if ($summary['items'] === []) {
            return redirect()->route('cart.show');
        }

        $activeKey = $request->session()->get('checkout.idempotency_key');
        if (! $activeKey || Order::where('idempotency_key', $activeKey)->exists()) {
            $activeKey = Str::random(64);
            $request->session()->put('checkout.idempotency_key', $activeKey);
        }

        $areas = $this->settings->areas(config('shop.delivery.areas', []));
        $quote = $this->checkoutService->quote(
            $summary['subtotal'],
            $areas[0] ?? '',
        );

        return Inertia::render('shop/checkout', [
            'cart' => $summary,
            'quote' => $quote,
            'currency' => config('shop.currency'),
            'taxEnabled' => $this->settings->taxEnabled(),
            'deliveryAreas' => $areas,
            'idempotencyKey' => $activeKey,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'idempotency_key' => ['required', 'string', 'size:64', 'alpha_num'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:40'],
            'address_line' => ['required', 'string', 'max:255'],
            'delivery_area' => ['required', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:40'],
            'delivery_notes' => ['nullable', 'string', 'max:2000'],
            'customer_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $activeKey = $request->session()->get('checkout.idempotency_key');
        $previousKey = $request->session()->get('checkout.previous_idempotency_key');
        $idempotencyKey = $data['idempotency_key'];

        if (! in_array($idempotencyKey, [$activeKey, $previousKey], true)) {
            throw ValidationException::withMessages([
                'checkout' => 'This checkout has expired. Please review your cart and try again.',
            ]);
        }

        $existingOrder = Order::query()->where('idempotency_key', $idempotencyKey)->first();
        if ($existingOrder) {
            return $this->confirmationRedirect($existingOrder);
        }

        if ($idempotencyKey !== $activeKey) {
            throw ValidationException::withMessages([
                'checkout' => 'This checkout has expired. Please review your cart and try again.',
            ]);
        }

        $cart = $this->cartService->resolveCart($request, createIfMissing: false);
        if (! $cart) {
            throw ValidationException::withMessages([
                'cart' => 'Your cart could not be found. Please add your items again.',
            ]);
        }

        $order = $this->checkoutService->placeOrder(
            $cart,
            [
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'],
                'address_line' => $data['address_line'],
                'delivery_area' => $data['delivery_area'],
                'postal_code' => $data['postal_code'] ?? null,
                'delivery_notes' => $data['delivery_notes'] ?? null,
                'customer_notes' => $data['customer_notes'] ?? null,
            ],
            $idempotencyKey,
        );

        $request->session()->put('checkout.previous_idempotency_key', $idempotencyKey);
        $request->session()->put('checkout.idempotency_key', Str::random(64));

        return $this->confirmationRedirect($order);
    }

    public function confirmation(string $reference, string $lookupToken): Response
    {
        $order = Order::query()
            ->where('reference', $reference)
            ->where('lookup_token', $lookupToken)
            ->with('items')
            ->firstOrFail();

        return Inertia::render('shop/order-confirmation', [
            'order' => [
                'reference' => $order->reference,
                'status' => $order->status->label(),
                'paymentStatus' => $order->payment_status->label(),
                'customerName' => $order->customer_name,
                'items' => $order->items->map(fn ($item): array => [
                    'productName' => $item->product_name,
                    'variantLabel' => $item->variant_label,
                    'quantity' => $item->quantity,
                    'lineTotal' => $item->line_total_minor,
                ]),
                'subtotal' => $order->subtotal_minor,
                'deliveryFee' => $order->delivery_fee_minor,
                'tax' => $order->tax_minor,
                'total' => $order->total_minor,
                'currency' => $order->currency,
                'paymentConfirmed' => $order->payment_status->isPaid(),
            ],
        ]);
    }

    private function confirmationRedirect(Order $order): RedirectResponse
    {
        return redirect()->route('orders.confirmation', [
            'reference' => $order->reference,
            'lookupToken' => $order->lookup_token,
        ]);
    }
}
