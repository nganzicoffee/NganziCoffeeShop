import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    type ClipboardEvent,
    type FormEvent,
    type KeyboardEvent,
    useRef,
    useState,
} from 'react';
import ShopLayout from '@/layouts/shop/ShopLayout';
import ShopPrice from '@/components/shop/ShopPrice';

type Order = {
    reference: string;
    status: string;
    statusLabel: string;
    category: 'active' | 'completed' | 'cancelled';
    paymentStatus: string;
    createdAt: string | null;
    items: Array<{
        productName: string;
        variantLabel: string;
        quantity: number;
    }>;
    total: number;
    currency: string;
};

type LookupPageProps = {
    step: 'email' | 'code' | 'orders';
    email: string | null;
    emailHint?: string | null;
    notice?: string | null;
    orders: Order[];
};

const tabs = [
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'all', label: 'All orders' },
] as const;

type OrderTab = (typeof tabs)[number]['id'];

export default function OrderLookup() {
    const { step, email, emailHint, notice, orders } =
        usePage<LookupPageProps>().props;
    const emailForm = useForm({ email: email ?? '' });
    const codeForm = useForm({ code: '' });
    const codeInputs = useRef<Array<HTMLInputElement | null>>([]);
    const [activeTab, setActiveTab] = useState<OrderTab>('active');

    function requestCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        emailForm.post('/track-orders/code', { preserveScroll: true });
    }

    function verifyCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        codeForm.post('/track-orders/verify', { preserveScroll: true });
    }

    function updateCode(index: number, rawValue: string) {
        const digits = rawValue.replace(/\D/g, '');

        if (digits.length > 1) {
            const next = digits.slice(0, 6);
            codeForm.setData('code', next);
            codeInputs.current[Math.min(next.length, 5)]?.focus();
            return;
        }

        const next = codeForm.data.code.split('');
        next[index] = digits.slice(-1);
        codeForm.setData('code', next.join('').slice(0, 6));

        if (digits && index < 5) {
            codeInputs.current[index + 1]?.focus();
        }
    }

    function pasteCode(event: ClipboardEvent<HTMLInputElement>) {
        const digits = event.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);

        if (digits) {
            event.preventDefault();
            codeForm.setData('code', digits);
            codeInputs.current[Math.min(digits.length, 5)]?.focus();
        }
    }

    function moveBackOnDelete(
        index: number,
        event: KeyboardEvent<HTMLInputElement>,
    ) {
        if (
            event.key === 'Backspace' &&
            !codeForm.data.code[index] &&
            index > 0
        ) {
            codeInputs.current[index - 1]?.focus();
        }
    }

    const visibleOrders =
        activeTab === 'all'
            ? orders
            : orders.filter((order) => order.category === activeTab);

    return (
        <ShopLayout bodyClassName="!bg-white">
            <Head>
                <title>Track your orders | Nganzi Coffee</title>
                <meta
                    name="description"
                    content="Securely view the status of your Nganzi Coffee orders without creating an account."
                />
            </Head>

            <section className="border-b border-border bg-cream/40 pt-[140px] pb-12">
                <div className="container max-w-5xl">
                    <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-orange uppercase">
                        Guest order access
                    </p>
                    <h1 className="mb-4 text-brown">
                        Track your <span className="script-accent">orders.</span>
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-muted">
                        Use the email from checkout to securely see your order
                        history and the latest status. No account needed.
                    </p>
                </div>
            </section>

            <section className="section-padding bg-white">
                <div className="container max-w-5xl">
                    {notice && (
                        <div
                            role="status"
                            className="mb-6 border border-border bg-cream/40 px-5 py-4 text-sm text-brown"
                        >
                            {notice}
                        </div>
                    )}

                    {step === 'email' && (
                        <div className="grid gap-10 rounded-none border border-border p-6 sm:grid-cols-[1fr_0.8fr] sm:p-10">
                            <div>
                                <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                                    Step 1 of 2
                                </p>
                                <h2 className="mb-3 font-heading text-2xl font-bold text-brown">
                                    Start with your email
                                </h2>
                                <p className="mb-7 max-w-lg leading-7 text-muted">
                                    We’ll email you a one-time code. Enter it
                                    here to see orders placed with this address.
                                </p>
                                <form onSubmit={requestCode} className="space-y-4">
                                    <label
                                        htmlFor="lookup-email"
                                        className="block text-sm font-semibold text-brown"
                                    >
                                        Checkout email
                                    </label>
                                    <input
                                        id="lookup-email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={emailForm.data.email}
                                        onChange={(event) =>
                                            emailForm.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="you@example.com"
                                        className="min-h-12 w-full border border-border bg-white px-4 text-brown outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
                                    />
                                    {emailForm.errors.email && (
                                        <p className="text-sm text-red-700">
                                            {emailForm.errors.email}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={emailForm.processing}
                                        className="button button-dark min-h-12 w-full justify-center rounded-none disabled:opacity-60 sm:w-auto"
                                    >
                                        {emailForm.processing
                                            ? 'Sending code…'
                                            : 'Email me a code'}
                                    </button>
                                </form>
                            </div>
                            <aside className="flex flex-col justify-center border-t border-border pt-7 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-9">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream text-brown">
                                    <svg
                                        className="h-6 w-6"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            x="3"
                                            y="5"
                                            width="18"
                                            height="14"
                                            rx="2"
                                        />
                                        <path d="m3 7 9 6 9-6" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 font-heading text-lg font-bold text-brown">
                                    Private to your inbox
                                </h3>
                                <p className="text-sm leading-6 text-muted">
                                    The code verifies access to the email used
                                    for checkout. It expires after 10 minutes
                                    and can only be used once.
                                </p>
                            </aside>
                        </div>
                    )}

                    {step === 'code' && (
                        <div className="mx-auto max-w-xl rounded-none border border-border p-6 sm:p-10">
                            <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                                Step 2 of 2
                            </p>
                            <h2 className="mb-3 font-heading text-2xl font-bold text-brown">
                                Check your email
                            </h2>
                            <p className="mb-7 leading-7 text-muted">
                                Enter the six-digit code sent to{' '}
                                <span className="font-semibold text-brown">
                                    {emailHint}
                                </span>
                                . If an order is associated with that address,
                                the code will arrive shortly.
                            </p>
                            <form onSubmit={verifyCode} className="space-y-6">
                                <fieldset>
                                    <legend className="mb-3 text-sm font-semibold text-brown">
                                        Email verification code
                                    </legend>
                                    <div className="mx-auto grid max-w-[22rem] grid-cols-6 gap-2 sm:gap-3">
                                        {Array.from({ length: 6 }, (_, index) => (
                                            <input
                                                key={index}
                                                ref={(element) => {
                                                    codeInputs.current[index] =
                                                        element;
                                                }}
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete={
                                                    index === 0
                                                        ? 'one-time-code'
                                                        : 'off'
                                                }
                                                aria-label={'Code digit ' + (index + 1)}
                                                maxLength={index === 0 ? 6 : 1}
                                                value={
                                                    codeForm.data.code[index] ??
                                                    ''
                                                }
                                                onChange={(event) =>
                                                    updateCode(
                                                        index,
                                                        event.target.value,
                                                    )
                                                }
                                                onPaste={pasteCode}
                                                onKeyDown={(event) =>
                                                    moveBackOnDelete(
                                                        index,
                                                        event,
                                                    )
                                                }
                                                className="h-12 w-full min-w-0 px-0 border border-border bg-white text-center font-mono text-xl font-semibold text-brown outline-none focus:border-orange focus:ring-2 focus:ring-orange/20"
                                            />
                                        ))}
                                    </div>
                                    {codeForm.errors.code && (
                                        <p
                                            role="alert"
                                            className="mt-3 text-sm text-red-700"
                                        >
                                            {codeForm.errors.code}
                                        </p>
                                    )}
                                </fieldset>
                                <button
                                    type="submit"
                                    disabled={
                                        codeForm.processing ||
                                        codeForm.data.code.length !== 6
                                    }
                                    className="button button-dark min-h-12 w-full justify-center rounded-none disabled:opacity-60"
                                >
                                    {codeForm.processing
                                        ? 'Checking code…'
                                        : 'View my orders'}
                                </button>
                            </form>
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-sm">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post('/track-orders/forget')
                                    }
                                    className="text-brown underline underline-offset-4"
                                >
                                    Use a different email
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post(
                                            '/track-orders/code',
                                            { email: email ?? '' },
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="text-brown underline underline-offset-4"
                                >
                                    Send a new code
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'orders' && (
                        <div>
                            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                                        Orders for {email}
                                    </p>
                                    <h2 className="font-heading text-2xl font-bold text-brown">
                                        Your order history
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post('/track-orders/forget')
                                    }
                                    className="text-sm font-semibold text-brown underline underline-offset-4"
                                >
                                    Use another email
                                </button>
                            </div>

                            <div
                                className="mb-7 flex flex-wrap gap-2 border-b border-border"
                                role="tablist"
                                aria-label="Filter orders"
                            >
                                {tabs.map((tab) => {
                                    const count =
                                        tab.id === 'all'
                                            ? orders.length
                                            : orders.filter(
                                                  (order) =>
                                                      order.category ===
                                                      tab.id,
                                              ).length;

                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={
                                                activeTab === tab.id
                                            }
                                            onClick={() =>
                                                setActiveTab(tab.id)
                                            }
                                            className={[
                                                'border-b-2 px-3 py-3 text-sm font-semibold transition',
                                                activeTab === tab.id
                                                    ? 'border-orange text-brown'
                                                    : 'border-transparent text-muted hover:text-brown',
                                            ].join(' ')}
                                        >
                                            {tab.label}{' '}
                                            <span className="ml-1 text-xs text-muted">
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {visibleOrders.length === 0 ? (
                                <div className="border border-border px-6 py-12 text-center">
                                    <h3 className="mb-2 font-heading text-xl font-bold text-brown">
                                        {orders.length === 0
                                            ? 'No orders found for this email'
                                            : 'No orders in this category'}
                                    </h3>
                                    <p className="mb-6 text-muted">
                                        Check that you used the same email at
                                        checkout, or start a new order.
                                    </p>
                                    <Link
                                        href="/shop"
                                        className="button button-dark inline-flex justify-center rounded-none"
                                    >
                                        Browse the shop
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {visibleOrders.map((order) => (
                                        <article
                                            key={order.reference}
                                            className="border border-border p-5 sm:p-7"
                                        >
                                            <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                                                <div>
                                                    <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                                                        Order reference
                                                    </p>
                                                    <p className="mt-1 font-semibold text-brown">
                                                        {order.reference}
                                                    </p>
                                                    {order.createdAt && (
                                                        <p className="mt-1 text-sm text-muted">
                                                            Placed{' '}
                                                            {new Intl.DateTimeFormat(
                                                                undefined,
                                                                {
                                                                    dateStyle:
                                                                        'medium',
                                                                    timeStyle:
                                                                        'short',
                                                                },
                                                            ).format(
                                                                new Date(
                                                                    order.createdAt,
                                                                ),
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-flex border border-border bg-cream/50 px-3 py-1.5 text-sm font-semibold text-brown">
                                                        {order.statusLabel}
                                                    </span>
                                                    <p className="mt-2 text-sm text-muted">
                                                        Payment:{' '}
                                                        {order.paymentStatus}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {order.items.map(
                                                    (item, index) => (
                                                        <div
                                                            key={
                                                                order.reference +
                                                                '-' +
                                                                index
                                                            }
                                                            className="flex justify-between gap-4 text-sm"
                                                        >
                                                            <span className="text-muted">
                                                                {
                                                                    item.productName
                                                                }{' '}
                                                                ·{' '}
                                                                {
                                                                    item.variantLabel
                                                                }{' '}
                                                                ×{' '}
                                                                {item.quantity}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                                                <p className="text-sm text-muted">
                                                    Latest order status:{' '}
                                                    <span className="font-semibold text-brown">
                                                        {order.statusLabel}
                                                    </span>
                                                </p>
                                                <p className="font-semibold text-brown">
                                                    Total:{' '}
                                                    <ShopPrice
                                                        amount={order.total}
                                                        currency={order.currency}
                                                    />
                                                </p>
                                            </div>
                                            {order.category === 'active' && (
                                                <p className="mt-4 text-sm text-muted">
                                                    Need to change this order?{' '}
                                                    <Link
                                                        href="/contact"
                                                        className="font-semibold text-brown underline underline-offset-4"
                                                    >
                                                        Contact the shop
                                                    </Link>
                                                </p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </ShopLayout>
    );
}
