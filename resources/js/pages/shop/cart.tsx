import { Head, Link, router, usePage } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop/ShopLayout';
import ShopPrice from '@/components/shop/ShopPrice';
import type { CartSummary } from '@/types/shop';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

type Props = {
    cart: CartSummary;
    currency: string;
};

export default function Cart() {
    const { cart, currency } = usePage<{ props: Props }>()
        .props as unknown as Props;

    const hasItems = cart.items.length > 0;
    const availableItems = cart.items.filter((i) => i.available && i.in_stock);
    const unavailableItems = cart.items.filter(
        (i) => !i.available || !i.in_stock,
    );

    return (
        <ShopLayout bodyClassName="!bg-white">
            <Head>
                <title>Your Cart — Nganzi Coffee</title>
            </Head>

            <div className="border-b border-border bg-white pt-[140px] pb-8">
                <div className="container">
                    <h1 className="mb-2 text-brown">
                        Your <span className="script-accent">cart.</span>
                    </h1>
                    <p className="text-muted">
                        Review your selected items before proceeding to
                        checkout.
                    </p>
                </div>
            </div>

            <section className="section-padding bg-white">
                <div className="container max-w-[1060px]">
                    {/* Warnings */}
                    {cart.warnings.length > 0 && (
                        <div className="mb-8 space-y-2">
                            {cart.warnings.map((w, i) => (
                                <div key={i} className="alert rounded-none">
                                    {w}
                                </div>
                            ))}
                        </div>
                    )}

                    {!hasItems ? (
                        <div className="border border-border bg-white p-12 py-16 text-center">
                            <ShoppingCart
                                size={48}
                                className="mx-auto mb-4 text-muted"
                                strokeWidth={1.4}
                            />
                            <p className="mb-6 text-lg text-muted">
                                Your cart is currently empty.
                            </p>
                            <Link
                                href="/shop"
                                className="button button-dark rounded-none"
                            >
                                Browse Coffee
                                <svg
                                    className="arrow-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path d="M7 17 17 7M7 7h10v10" />
                                </svg>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
                            {/* Items */}
                            <div className="space-y-0 divide-y divide-border">
                                {availableItems.map((item) => (
                                    <CartRow
                                        key={item.id}
                                        item={item}
                                        currency={currency}
                                    />
                                ))}
                                {unavailableItems.map((item) => (
                                    <UnavailableRow key={item.id} item={item} />
                                ))}
                            </div>

                            {/* Summary sidebar */}
                            <div className="lg:sticky lg:top-[140px] lg:self-start">
                                <div className="rounded-none border border-border bg-white p-6">
                                    <h2 className="mb-4 font-heading text-xl font-bold text-brown">
                                        Order summary
                                    </h2>
                                    <div className="mb-3 flex justify-between text-sm text-muted">
                                        <span>
                                            Subtotal ({cart.item_count}{' '}
                                            {cart.item_count === 1
                                                ? 'item'
                                                : 'items'}
                                            )
                                        </span>
                                        <span className="font-semibold text-brown">
                                            <ShopPrice
                                                amount={cart.subtotal}
                                                currency={currency}
                                            />
                                        </span>
                                    </div>
                                    <div className="mb-3 flex justify-between text-sm text-muted">
                                        <span>Delivery</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                    <div className="mb-6 flex justify-between border-t border-border pt-3 font-semibold text-brown">
                                        <span>Total</span>
                                        <span>
                                            <ShopPrice
                                                amount={cart.subtotal}
                                                currency={currency}
                                            />
                                        </span>
                                    </div>
                                    <Link
                                        href="/checkout"
                                        className="button button-dark !min-h-[50px] w-full justify-center rounded-none text-center !text-sm"
                                    >
                                        Proceed to checkout
                                        <svg
                                            className="arrow-icon"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <path d="M7 17 17 7M7 7h10v10" />
                                        </svg>
                                    </Link>
                                    <Link
                                        href="/shop"
                                        className="text-link mt-4 flex items-center justify-center gap-2 text-sm text-muted hover:text-orange-hover"
                                    >
                                        Continue shopping
                                        <svg
                                            className="arrow-icon"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <path d="M7 17 17 7M7 7h10v10" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </ShopLayout>
    );
}

function CartRow({
    item,
    currency,
}: {
    item: Props['cart']['items'][number];
    currency: string;
}) {
    const [loading, setLoading] = useState(false);

    function updateQty(newQty: number) {
        setLoading(true);
        router.patch(
            `/cart/${item.id}`,
            { quantity: newQty },
            {
                preserveScroll: true,
                onFinish: () => setLoading(false),
            },
        );
    }

    function remove() {
        setLoading(true);
        router.delete(`/cart/${item.id}`, {
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    }

    return (
        <div
            className={`flex gap-4 py-5 ${loading ? 'pointer-events-none opacity-50' : ''}`}
        >
            {/* Image */}
            <Link
                href={`/shop/${item.product.slug}`}
                className="h-20 w-20 shrink-0 overflow-hidden bg-peach"
            >
                {item.product.image ? (
                    <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">
                        No image
                    </div>
                )}
            </Link>

            {/* Details */}
            <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0">
                    <Link
                        href={`/shop/${item.product.slug}`}
                        className="font-semibold text-brown hover:text-orange-hover"
                    >
                        {item.product.name}
                    </Link>
                    <p className="text-sm text-muted">{item.variant_label}</p>
                    <p className="text-sm font-medium text-brown">
                        <ShopPrice
                            amount={item.price_minor}
                            currency={currency}
                        />
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-0 rounded-none border border-border">
                        <button
                            type="button"
                            onClick={() => updateQty(item.quantity - 1)}
                            disabled={loading}
                            className="grid h-8 w-8 place-items-center text-muted hover:text-brown disabled:opacity-40"
                            aria-label="Decrease quantity"
                        >
                            <Minus size={14} />
                        </button>
                        <span
                            className="grid h-8 w-8 place-items-center text-sm font-medium text-brown"
                            aria-label={`Quantity: ${item.quantity}`}
                        >
                            {item.quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => updateQty(item.quantity + 1)}
                            disabled={loading || item.quantity >= 10}
                            className="grid h-8 w-8 place-items-center text-muted hover:text-brown disabled:opacity-40"
                            aria-label="Increase quantity"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Line total */}
                    <span className="min-w-[80px] text-right text-sm font-semibold text-brown">
                        <ShopPrice
                            amount={item.line_total}
                            currency={currency}
                        />
                    </span>

                    {/* Remove */}
                    <button
                        type="button"
                        onClick={remove}
                        disabled={loading}
                        className="grid h-8 w-8 place-items-center text-muted hover:text-red-600"
                        aria-label={`Remove ${item.product.name}`}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function UnavailableRow({ item }: { item: Props['cart']['items'][number] }) {
    const [loading, setLoading] = useState(false);

    function remove() {
        setLoading(true);
        router.delete(`/cart/${item.id}`, {
            preserveScroll: true,
            onFinish: () => setLoading(false),
        });
    }

    return (
        <div
            className={`flex gap-4 py-5 opacity-60 ${loading ? 'pointer-events-none' : ''}`}
        >
            <div className="h-20 w-20 shrink-0 overflow-hidden bg-peach">
                {item.product.image ? (
                    <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">
                        No image
                    </div>
                )}
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
                <div>
                    <p className="font-semibold text-brown line-through">
                        {item.product.name}
                    </p>
                    <p className="text-sm text-muted">{item.variant_label}</p>
                    <p className="text-sm font-medium text-red-600">
                        {!item.available
                            ? 'No longer available'
                            : 'Out of stock'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={remove}
                    disabled={loading}
                    className="grid h-8 w-8 place-items-center text-muted hover:text-red-600"
                    aria-label={`Remove ${item.product.name}`}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
