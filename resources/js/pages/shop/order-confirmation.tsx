import { Head, Link, usePage } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop/ShopLayout';
import { formatPrice } from '@/lib/price';

type OrderConfirmationProps = {
    order: {
        reference: string;
        status: string;
        paymentStatus: string;
        customerName: string;
        items: Array<{
            productName: string;
            variantLabel: string;
            quantity: number;
            lineTotal: number;
        }>;
        subtotal: number;
        deliveryFee: number;
        tax: number;
        total: number;
        currency: string;
        paymentConfirmed: boolean;
    };
};

export default function OrderConfirmation() {
    const { order } = usePage<OrderConfirmationProps>().props;

    return (
        <ShopLayout bodyClassName="!bg-white">
            <Head>
                <title>Order received — Nganzi Coffee</title>
            </Head>

            <div className="border-b border-border bg-white pt-[140px] pb-8">
                <div className="container">
                    <h1 className="mb-2 text-brown">
                        Thank you,{' '}
                        <span className="script-accent">
                            {order.customerName}.
                        </span>
                    </h1>
                    <p className="text-muted">
                        {order.paymentConfirmed
                            ? 'Your order has been received and payment is confirmed.'
                            : 'Your order has been received. Our team will contact you to coordinate delivery.'}
                    </p>
                </div>
            </div>

            <section className="section-padding bg-white">
                <div className="container max-w-[800px]">
                    <div className="rounded-none border border-border bg-white p-6 sm:p-10">
                        <div className="mb-6 rounded-none border border-border bg-cream/40 p-5">
                            <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                                Order reference
                            </p>
                            <p className="text-lg font-bold text-brown">
                                {order.reference}
                            </p>
                            <p className="mt-2 text-sm text-muted">
                                Payment status:{' '}
                                <span className="font-semibold text-brown">
                                    {order.paymentStatus}
                                </span>
                            </p>
                        </div>

                        <h2 className="mb-4 font-heading text-xl font-bold text-brown">
                            Order summary
                        </h2>
                        <div className="space-y-3 border-b border-border pb-4">
                            {order.items.map((item, index) => (
                                <div
                                    key={`${item.productName}-${index}`}
                                    className="flex justify-between gap-3 text-sm"
                                >
                                    <span className="text-muted">
                                        {item.productName} · {item.variantLabel}{' '}
                                        × {item.quantity}
                                    </span>
                                    <span className="shrink-0 font-medium text-brown">
                                        {formatPrice(
                                            item.lineTotal,
                                            order.currency,
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                            <SummaryLine
                                label="Subtotal"
                                amount={order.subtotal}
                                currency={order.currency}
                            />
                            <SummaryLine
                                label="Delivery"
                                amount={order.deliveryFee}
                                currency={order.currency}
                            />
                            {order.tax > 0 && (
                                <SummaryLine
                                    label="Tax"
                                    amount={order.tax}
                                    currency={order.currency}
                                />
                            )}
                            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-brown">
                                <span>Total</span>
                                <span>
                                    {formatPrice(order.total, order.currency)}
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/shop"
                            className="button button-dark mt-8 w-full justify-center rounded-none sm:w-auto"
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
            <span>{formatPrice(amount, currency)}</span>
        </div>
    );
}
