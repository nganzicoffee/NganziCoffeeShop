<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
    ) {}

    /**
     * Show the cart page.
     */
    public function show(Request $request): Response
    {
        $cart = $this->cartService->resolveCart($request, createIfMissing: false);

        $summary = $cart
            ? $this->cartService->summary($cart)
            : ['items' => [], 'subtotal' => 0, 'item_count' => 0, 'warnings' => []];

        return Inertia::render('shop/cart', [
            'cart' => $summary,
            'currency' => config('shop.currency'),
        ]);
    }

    /**
     * Add a variant to the cart.
     */
    public function add(Request $request): RedirectResponse
    {
        $variantId = $request->input('variant_id');
        if (! is_numeric($variantId) || ! ProductVariant::whereKey((int) $variantId)->exists()) {
            abort(422, 'The selected variant id is invalid.');
        }

        $quantity = $this->validateQuantity($request->input('quantity'), minimum: 1);

        $cart = $this->cartService->resolveCart($request);

        try {
            $result = $this->cartService->addItem(
                $cart,
                (int) $variantId,
                $quantity,
            );
        } catch (\DomainException $e) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);
        }

        $message = 'Added to cart.';
        if (! empty($result['warnings'])) {
            $message .= ' '.implode(' ', $result['warnings']);
        }

        return back()->with('toast', [
            'type' => empty($result['warnings']) ? 'success' : 'warning',
            'message' => $message,
        ]);
    }

    /**
     * Update the quantity of a cart item.
     */
    public function update(Request $request, CartItem $cartItem): RedirectResponse
    {
        $cart = $this->cartService->resolveCart($request, createIfMissing: false);

        if (! $cart || $cartItem->cart_id !== $cart->id) {
            abort(404);
        }

        $quantity = $this->validateQuantity($request->input('quantity'), minimum: 0);

        try {
            $result = $this->cartService->updateItem($cartItem, $quantity);
        } catch (\DomainException $e) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);
        }

        $message = $result['removed'] ? 'Item removed.' : 'Cart updated.';
        if (! empty($result['warnings'])) {
            $message .= ' '.implode(' ', $result['warnings']);
        }

        return redirect()->route('cart.show')->with('toast', [
            'type' => empty($result['warnings']) ? 'success' : 'warning',
            'message' => $message,
        ]);
    }

    /**
     * Remove an item from the cart.
     */
    public function remove(Request $request, CartItem $cartItem): RedirectResponse
    {
        $cart = $this->cartService->resolveCart($request, createIfMissing: false);

        if (! $cart || $cartItem->cart_id !== $cart->id) {
            abort(404);
        }

        $this->cartService->removeItem($cartItem);

        return redirect()->route('cart.show')->with('toast', [
            'type' => 'success',
            'message' => 'Item removed from cart.',
        ]);
    }

    private function validateQuantity(mixed $value, int $minimum): int
    {
        if (! is_numeric($value) || ! preg_match('/^-?\d+$/', (string) $value)) {
            abort(422, 'The quantity field must be an integer.');
        }

        $quantity = (int) $value;

        if ($quantity < $minimum) {
            abort(422, $minimum === 1 ? 'The quantity field must be at least 1.' : 'The quantity field must be at least 0.');
        }

        return $quantity;
    }
}
