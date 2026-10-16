<?php

namespace App\Services;

use App\Enums\ProductStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartService
{
    /**
     * Maximum quantity per line item.
     */
    public const MAX_QTY = 10;

    /**
     * Resolve (or create) the cart for the current request.
     */
    public function resolveCart(Request $request, bool $createIfMissing = true): ?Cart
    {
        $sessionId = $request->session()->get('cart_session_id');

        if ($sessionId) {
            $cart = Cart::where('session_id', $sessionId)->first();
            if ($cart) {
                return $cart;
            }
        }

        if (! $createIfMissing) {
            return null;
        }

        $sessionId = Str::uuid()->toString();
        $request->session()->put('cart_session_id', $sessionId);

        return Cart::create([
            'session_id' => $sessionId,
            'user_id' => $request->user()?->id,
            'expires_at' => now()->addDays(7),
        ]);
    }

    /**
     * Add a variant to the cart (or increment quantity).
     *
     * @return array{item: CartItem, warnings: string[]}
     */
    public function addItem(Cart $cart, int $variantId, int $quantity): array
    {
        $warnings = [];
        $variant = $this->resolveVariant($variantId);

        $quantity = $this->clampQuantity($quantity);

        $existing = $cart->items()->where('variant_id', $variantId)->first();
        $currentQty = $existing !== null ? $existing->quantity : 0;
        $desiredQty = $currentQty + $quantity;

        // Cap at stock and max qty
        $effectiveQty = min($desiredQty, $variant->stock, self::MAX_QTY);

        if ($effectiveQty < $desiredQty) {
            if ($variant->stock < $desiredQty) {
                $warnings[] = "Only {$variant->stock} available. Quantity adjusted.";
            } else {
                $warnings[] = 'Maximum quantity per item is '.self::MAX_QTY.'.';
            }
        }

        if ($effectiveQty <= 0) {
            throw new \DomainException('This variant is out of stock.');
        }

        if ($existing) {
            $existing->update(['quantity' => $effectiveQty]);
            $item = $existing->fresh();
        } else {
            $item = $cart->items()->create([
                'variant_id' => $variantId,
                'quantity' => $effectiveQty,
            ]);
        }

        return ['item' => $item, 'warnings' => $warnings];
    }

    /**
     * Set the quantity for an existing cart item.
     *
     * @return array{item: CartItem|null, warnings: string[], removed: bool}
     */
    public function updateItem(CartItem $cartItem, int $quantity): array
    {
        $warnings = [];

        if ($quantity <= 0) {
            $cartItem->delete();

            return ['item' => null, 'warnings' => [], 'removed' => true];
        }

        $variant = $cartItem->variant;
        $this->assertVariantPurchasable($variant);

        $quantity = $this->clampQuantity($quantity);
        $effectiveQty = min($quantity, $variant->stock, self::MAX_QTY);

        if ($effectiveQty < $quantity) {
            if ($variant->stock < $quantity) {
                $warnings[] = "Only {$variant->stock} available. Quantity adjusted.";
            } else {
                $warnings[] = 'Maximum quantity per item is '.self::MAX_QTY.'.';
            }
        }

        $cartItem->update(['quantity' => $effectiveQty]);

        return ['item' => $cartItem->fresh(), 'warnings' => $warnings, 'removed' => false];
    }

    /**
     * Remove an item from the cart.
     */
    public function removeItem(CartItem $cartItem): void
    {
        $cartItem->delete();
    }

    /**
     * Build a validated cart summary with server-side prices and availability checks.
     *
     * @return array{items: array<int, array<string, mixed>>, subtotal: int, item_count: int, warnings: string[]}
     */
    public function summary(Cart $cart): array
    {
        $cart->load(['items.variant.product.category', 'items.variant.product.images']);

        $items = [];
        $subtotal = 0;
        $itemCount = 0;
        $warnings = [];

        foreach ($cart->items as $cartItem) {
            $variant = $cartItem->variant;
            $product = $variant->product;

            // Check product is still published and variant active
            $available = $product->status === ProductStatus::Published && $variant->active;
            $inStock = $variant->stock > 0;

            // Adjust quantity if stock dropped
            $effectiveQty = $cartItem->quantity;
            if ($available && $inStock && $effectiveQty > $variant->stock) {
                $effectiveQty = $variant->stock;
                $cartItem->update(['quantity' => $effectiveQty]);
                $warnings[] = "{$product->name} ({$variant->label}): quantity reduced to {$effectiveQty} due to stock.";
            }

            $lineTotal = $available && $inStock ? $variant->price_minor * $effectiveQty : 0;
            $subtotal += $lineTotal;
            if ($available && $inStock) {
                $itemCount += $effectiveQty;
            }

            $image = $product->images->sortBy('sort_order')->first();

            $items[] = [
                'id' => $cartItem->id,
                'variant_id' => $variant->id,
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'image' => $image ? '/storage/'.$image->path : null,
                    'category' => $product->category?->name,
                ],
                'variant_label' => $variant->label,
                'price_minor' => $variant->price_minor,
                'quantity' => $effectiveQty,
                'line_total' => $lineTotal,
                'available' => $available,
                'in_stock' => $inStock,
            ];

            if (! $available) {
                $warnings[] = "{$product->name} ({$variant->label}) is no longer available and will not be included in your order.";
            } elseif (! $inStock) {
                $warnings[] = "{$product->name} ({$variant->label}) is out of stock.";
            }
        }

        return [
            'items' => $items,
            'subtotal' => $subtotal,
            'item_count' => $itemCount,
            'warnings' => $warnings,
        ];
    }

    /**
     * Get the total item count for the cart badge.
     */
    public function itemCount(Request $request): int
    {
        $cart = $this->resolveCart($request, createIfMissing: false);
        if (! $cart) {
            return 0;
        }

        return (int) $cart->items()->sum('quantity');
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private function resolveVariant(int $variantId): ProductVariant
    {
        $variant = ProductVariant::with('product')->findOrFail($variantId);
        $this->assertVariantPurchasable($variant);

        return $variant;
    }

    private function assertVariantPurchasable(ProductVariant $variant): void
    {
        $product = $variant->product;

        if ($product->status !== ProductStatus::Published) {
            throw new \DomainException('This product is not available.');
        }

        if (! $variant->active) {
            throw new \DomainException('This variant is not available.');
        }
    }

    private function clampQuantity(int $quantity): int
    {
        return max(1, min($quantity, self::MAX_QTY));
    }
}
