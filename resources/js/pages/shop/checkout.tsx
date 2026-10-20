import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import ShopLayout from '@/layouts/shop/ShopLayout';
import ShopPrice from '@/components/shop/ShopPrice';
import { formatPrice as formatBasePrice } from '@/lib/price';
import type { CartSummary } from '@/types/shop';

type CheckoutProps = {
    cart: CartSummary;
    quote: {
        subtotal_minor: number;
        delivery_fee_minor: number;
        tax_minor: number;
        total_minor: number;
    };
    currency: string;
    taxEnabled: boolean;
    deliveryAreas: string[];
    idempotencyKey: string;
};

export default function Checkout() {
    const {
        cart,
        quote,
        currency,
        taxEnabled,
        deliveryAreas,
        idempotencyKey,
        errors: pageErrors,
    } = usePage<CheckoutProps & { errors: Record<string, string> }>().props;
    const form = useForm({
        idempotency_key: idempotencyKey,
        name: '',
        email: '',
        phone: '',
        address_line: '',
        delivery_area: deliveryAreas[0] ?? '',
        postal_code: '',
        delivery_notes: '',
        customer_notes: '',
    });

    const canPlaceOrder =
        cart.items.length > 0 &&
        cart.items.every((item) => item.available && item.in_stock) &&
        cart.warnings.length === 0;

    return (
        <ShopLayout bodyClassName="!bg-white">
            <Head>
                <title>Checkout — Nganzi Coffee</title>
            </Head>

            <div className="border-b border-border bg-white pt-[140px] pb-8">
                <div className="container">
                    <h1 className="mb-2 text-brown">
                        Place your <span className="script-accent">order.</span>
                    </h1>
                </div>
            </div>

            <section className="section-padding bg-white">
                <div className="container max-w-[1060px]">
                    {cart.warnings.length > 0 && (
                        <div className="alert mb-6 rounded-none" role="alert">
                            {cart.warnings.map((warning) => (
                                <p key={warning}>{warning}</p>
                            ))}
                            <Link
                                href="/cart"
                                className="mt-2 inline-block underline"
                            >
                                Review your cart
                            </Link>
                        </div>
                    )}

                    {pageErrors.cart && (
                        <p className="alert mb-6 rounded-none" role="alert">
                            {pageErrors.cart}
                        </p>
                    )}
                    {pageErrors.checkout && (
                        <p className="alert mb-6 rounded-none" role="alert">
                            {pageErrors.checkout}
                        </p>
                    )}

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/checkout', { preserveScroll: true });
                        }}
                        className="grid gap-8 lg:grid-cols-[1fr_340px]"
                    >
                        <div className="space-y-6 rounded-none border border-border bg-white p-6 sm:p-8">
                            <div>
                                <h2 className="mb-4 font-heading text-xl font-bold text-brown">
                                    Contact details
                                </h2>
                                <div className="space-y-4">
                                    <label
                                        className="block space-y-1.5 text-sm font-medium text-brown"
                                        htmlFor="name"
                                    >
                                        Full name *
                                        <Input
                                            id="name"
                                            autoComplete="name"
                                            value={form.data.name}
                                            onChange={(event) =>
                                                form.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.name,
                                            )}
                                            className="rounded-none border-border"
                                        />
                                        <InputError
                                            message={form.errors.name}
                                        />
                                    </label>
                                    <label
                                        className="block space-y-1.5 text-sm font-medium text-brown"
                                        htmlFor="phone"
                                    >
                                        Phone number / WhatsApp *
                                        <Input
                                            id="phone"
                                            type="tel"
                                            autoComplete="tel"
                                            placeholder="+256..."
                                            value={form.data.phone}
                                            onChange={(event) =>
                                                form.setData(
                                                    'phone',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.phone,
                                            )}
                                            className="rounded-none border-border"
                                        />
                                        <InputError
                                            message={form.errors.phone}
                                        />
                                    </label>
                                    <label
                                        className="block space-y-1.5 text-sm font-medium text-brown"
                                        htmlFor="email"
                                    >
                                        Email address{' '}
                                        <span className="font-normal text-muted">
                                            (for order updates)
                                        </span>
                                        <Input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            value={form.data.email}
                                            onChange={(event) =>
                                                form.setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.email,
                                            )}
                                            className="rounded-none border-border"
                                        />
                                        <InputError
                                            message={form.errors.email}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-border pt-6">
                                <h2 className="mb-4 font-heading text-xl font-bold text-brown">
                                    Delivery address
                                </h2>
                                <div className="space-y-4">
                                    <label
                                        className="block space-y-1.5 text-sm font-medium text-brown"
                                        htmlFor="address_line"
                                    >
                                        Street address / Building *
                                        <Input
                                            id="address_line"
                                            autoComplete="street-address"
                                            value={form.data.address_line}
                                            onChange={(event) =>
                                                form.setData(
                                                    'address_line',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.address_line,
                                            )}
                                            className="rounded-none border-border"
                                        />
                                        <InputError
                                            message={form.errors.address_line}
                                        />
                                    </label>
                                    <label
                                        className="block space-y-1.5 text-sm font-medium text-brown"
                                        htmlFor="delivery_area"
                                    >
                                        Town / City / Country *
                                        {deliveryAreas.length > 0 ? (
                                            <select
                                                id="delivery_area"
                                                value={form.data.delivery_area}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'delivery_area',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors.delivery_area,
                                                )}
                                                className="h-10 w-full rounded-none border border-border bg-white px-3 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                            >
                                                {deliveryAreas.map((area) => (
                                                    <option
                                                        key={area}
                                                        value={area}
                                                    >
                                                        {area}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <Input
                                                id="delivery_area"
                                                placeholder="e.g. Kampala, Entebbe, or International city & country"
                                                autoComplete="address-level2"
                                                value={form.data.delivery_area}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'delivery_area',
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors.delivery_area,
                                                )}
                                                className="rounded-none border-border"
                                            />
                                        )}
                                        <InputError
                                            message={form.errors.delivery_area}
                                        />
                                    </label>
                                    <label
                                        className="block space-y-1.5 text-sm font-medium text-brown"
                                        htmlFor="postal_code"
                                    >
                                        Postal code{' '}
                                        <span className="font-normal text-muted">
                                            (optional)
                                        </span>
                                        <Input
                                            id="postal_code"
                                            autoComplete="postal-code"
                                            value={form.data.postal_code}
                                            onChange={(event) =>
                                                form.setData(
                                                    'postal_code',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.postal_code,
                                            )}
                                            className="rounded-none border-border"
                                        />
                                        <InputError
                                            message={form.errors.postal_code}
                                        />
                                    </label>
                                    <label
                                        className="block space-y-1.5 text-sm font-medium text-brown"
                                        htmlFor="delivery_notes"
                                    >
                                        Delivery instructions{' '}
                                        <span className="font-normal text-muted">
                                            (optional)
                                        </span>
                                        <textarea
                                            id="delivery_notes"
                                            rows={3}
                                            value={form.data.delivery_notes}
                                            onChange={(event) =>
                                                form.setData(
                                                    'delivery_notes',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.delivery_notes,
                                            )}
                                            className="w-full rounded-none border border-border bg-white px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        />
                                        <InputError
                                            message={form.errors.delivery_notes}
                                        />
                                    </label>
                                    <label
                                        className="block space-y-1.5 text-sm font-medium text-brown"
                                        htmlFor="customer_notes"
                                    >
                                        Order notes{' '}
                                        <span className="font-normal text-muted">
                                            (optional)
                                        </span>
                                        <textarea
                                            id="customer_notes"
                                            rows={3}
                                            value={form.data.customer_notes}
                                            onChange={(event) =>
                                                form.setData(
                                                    'customer_notes',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.customer_notes,
                                            )}
                                            className="w-full rounded-none border border-border bg-white px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        />
                                        <InputError
                                            message={form.errors.customer_notes}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <aside className="lg:sticky lg:top-[140px] lg:self-start">
                            <div className="rounded-none border border-border bg-white p-6">
                                <h2 className="mb-4 font-heading text-xl font-bold text-brown">
                                    Order summary
                                </h2>
                                <div className="mb-4 space-y-3 border-b border-border pb-4">
                                    {cart.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between gap-3 text-sm"
                                        >
                                            <span className="text-muted">
                                                {item.product.name} ·{' '}
                                                {item.variant_label} ×{' '}
                                                {item.quantity}
                                            </span>
                                            <span className="shrink-0 font-medium text-brown">
                                                <ShopPrice
                                                    amount={item.line_total}
                                                    currency={currency}
                                                />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-3 text-sm">
                                    <SummaryLine
                                        label="Subtotal"
                                        amount={quote.subtotal_minor}
                                        currency={currency}
                                    />
                                    <SummaryLine
                                        label="Delivery"
                                        amount={quote.delivery_fee_minor}
                                        currency={currency}
                                    />
                                    {taxEnabled && (
                                        <SummaryLine
                                            label="Tax"
                                            amount={quote.tax_minor}
                                            currency={currency}
                                        />
                                    )}
                                    <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-brown">
                                        <span>Total</span>
                                        <span>
                                            <ShopPrice
                                                amount={quote.total_minor}
                                                currency={currency}
                                            />
                                        </span>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm font-semibold text-brown">
                                    Order amount:{' '}
                                    {formatBasePrice(
                                        quote.total_minor,
                                        currency,
                                    )}
                                    . USD displays are estimates; this order is
                                    recorded and payable in {currency}.
                                </p>
                                <p className="mt-4 text-xs leading-relaxed text-muted">
                                    Prices and stock are verified at order
                                    placement. Payment will be coordinated
                                    directly upon order confirmation.
                                </p>
                                <button
                                    type="submit"
                                    disabled={form.processing || !canPlaceOrder}
                                    className="button button-dark mt-5 !min-h-[50px] w-full justify-center rounded-none !text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing
                                        ? 'Placing order…'
                                        : 'Place order'}
                                    <svg
                                        className="arrow-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M7 17 17 7M7 7h10v10" />
                                    </svg>
                                </button>
                                <Link
                                    href="/cart"
                                    className="text-link mt-4 flex items-center justify-center gap-2 text-sm text-muted hover:text-orange-hover"
                                >
                                    Return to cart
                                </Link>
                            </div>
                        </aside>
                    </form>
                </div>
            </section>
        </ShopLayout>
    );
}

function SummaryLine({
    label,
    amount,
    currency,
}: {
    label: string;
    amount: number;
    currency: string;
}) {
    return (
        <div className="flex justify-between text-muted">
            <span>{label}</span>
            <span>
                <ShopPrice amount={amount} currency={currency} />
            </span>
        </div>
    );
}
