import { Head, Link, router, useForm } from '@inertiajs/react';
import { formatPrice } from '@/lib/price';
import type { BreadcrumbItem } from '@/types';

type Option = { value: string; label: string };
type NotificationEntry = {
    id: number;
    type: string;
    label: string;
    channel: string;
    recipientHint: string | null;
    status: string;
    attempts: number;
    lastError: string | null;
    sentAt: string | null;
    failedAt: string | null;
};

type OrderView = {
    reference: string;
    status: string;
    statusLabel: string;
    paymentStatus: string;
    isPaid?: boolean;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string;
    deliveryAddress: Record<string, string>;
    deliveryNotes: string | null;
    customerNotes: string | null;
    internalNotes: string | null;
    customerHistory?: Array<{
        reference: string;
        status: string;
        paymentStatus: string;
        total: number;
        currency: string;
        createdAt: string | null;
    }>;
    items: Array<{
        productName: string;
        variantLabel: string;
        sku: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
    }>;
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
    currency: string;
    payments: Array<{
        provider: string;
        reference: string | null;
        amount: number;
        currency: string;
        status: string;
        createdAt: string | null;
    }>;
    notifications?: NotificationEntry[];
    history: Array<{
        from: string;
        to: string;
        actor: string;
        note: string | null;
        at: string | null;
    }>;
    allowedTransitions: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Orders', href: '/admin/orders' },
    { title: 'Order Details', href: '/admin/orders' },
];

export default function OrderShow({
    order,
    canUpdateStatus,
}: {
    order: OrderView;
    canUpdateStatus: boolean;
}) {
    const form = useForm({ status: '', note: '' });
    const paymentForm = useForm({
        provider: 'mobile_money',
        provider_reference: '',
    });
    const notesForm = useForm({ internal_notes: order.internalNotes ?? '' });

    function submitStatus(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (
            form.data.status === 'cancelled' &&
            !window.confirm(
                'Cancel this order and release its reserved stock? This cannot be undone.',
            )
        )
            return;
        form.patch(
            `/admin/orders/${encodeURIComponent(order.reference)}/status`,
            { preserveScroll: true },
        );
    }

    function submitPayment(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        paymentForm.post(
            `/admin/orders/${encodeURIComponent(order.reference)}/payment`,
            {
                preserveScroll: true,
                onSuccess: () => paymentForm.reset('provider_reference'),
            },
        );
    }

    return (
        <>
            <Head title={`Order ${order.reference} — Nganzi Coffee`} />
            <main className="min-h-full flex-1 space-y-6 bg-white p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link
                            href="/admin/orders"
                            className="text-xs font-medium text-muted hover:text-orange"
                        >
                            ← Orders
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-brown">
                                #{order.reference}
                            </h1>
                            <StatusBadge status={order.statusLabel} />
                            <PaymentBadge status={order.paymentStatus} />
                        </div>
                    </div>

                    {/* Transition Form */}
                    {canUpdateStatus && order.allowedTransitions.length > 0 && (
                        <form
                            onSubmit={submitStatus}
                            className="flex flex-wrap items-end gap-2.5"
                        >
                            <label className="grid gap-1 text-xs font-medium text-muted">
                                Status
                                <select
                                    className="nganzi-input h-9 min-w-40 text-xs"
                                    required
                                    value={form.data.status}
                                    onChange={(event) =>
                                        form.setData(
                                            'status',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">Select status…</option>
                                    {order.allowedTransitions.map((status) => (
                                        <option
                                            key={status.value}
                                            value={status.value}
                                        >
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1 text-xs font-medium text-muted">
                                Note
                                <input
                                    className="nganzi-input h-9 min-w-48 text-xs"
                                    placeholder="Optional note…"
                                    value={form.data.note}
                                    onChange={(event) =>
                                        form.setData('note', event.target.value)
                                    }
                                />
                                {form.errors.note && (
                                    <span className="text-xs text-red-600">
                                        {form.errors.note}
                                    </span>
                                )}
                            </label>
                            <button
                                className="h-9 rounded-lg bg-orange px-4 text-xs font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-50"
                                type="submit"
                                disabled={form.processing || !form.data.status}
                            >
                                Update
                            </button>
                            {form.errors.status && (
                                <p className="basis-full text-xs text-red-600">
                                    {form.errors.status}
                                </p>
                            )}
                        </form>
                    )}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                    {/* Left Column: Items, Payments, Notifications, History */}
                    <div className="space-y-6">
                        {/* Items Section */}
                        <section className="rounded-xl border border-border bg-white p-5">
                            <h2 className="mb-4 text-sm font-bold text-brown">
                                Items
                            </h2>
                            <div className="divide-y divide-border/60">
                                {order.items.map((item, index) => (
                                    <div
                                        key={`${item.productName}-${index}`}
                                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-brown">
                                                {item.productName}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {item.variantLabel}
                                                {item.sku
                                                    ? ` · ${item.sku}`
                                                    : ''}{' '}
                                                ·{' '}
                                                {formatPrice(
                                                    item.unitPrice,
                                                    order.currency,
                                                )}{' '}
                                                × {item.quantity}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-brown">
                                            {formatPrice(
                                                item.lineTotal,
                                                order.currency,
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                                <TotalLine
                                    label="Subtotal"
                                    amount={order.subtotal}
                                    currency={order.currency}
                                />
                                <TotalLine
                                    label="Delivery"
                                    amount={order.deliveryFee}
                                    currency={order.currency}
                                />
                                {order.tax > 0 && (
                                    <TotalLine
                                        label="Tax"
                                        amount={order.tax}
                                        currency={order.currency}
                                    />
                                )}
                                <TotalLine
                                    label="Total"
                                    amount={order.total}
                                    currency={order.currency}
                                    strong
                                />
                            </div>
                        </section>

                        {/* Payments Section */}
                        <section className="rounded-xl border border-border bg-white p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-brown">
                                    Payments
                                </h2>
                            </div>
                            {order.payments.length ? (
                                <div className="divide-y divide-border/60">
                                    {order.payments.map((payment, index) => (
                                        <div
                                            key={`${payment.provider}-${index}`}
                                            className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="font-medium text-brown">
                                                    {payment.provider}{' '}
                                                    <span className="text-xs text-muted">
                                                        ({payment.status})
                                                    </span>
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {payment.reference ?? '—'} ·{' '}
                                                    {payment.createdAt ?? '—'}
                                                </p>
                                            </div>
                                            <span className="font-semibold text-brown">
                                                {formatPrice(
                                                    payment.amount,
                                                    payment.currency,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted">
                                    No payments recorded.
                                </p>
                            )}

                            {canUpdateStatus &&
                                !order.isPaid &&
                                order.status !== 'cancelled' && (
                                    <form
                                        onSubmit={submitPayment}
                                        className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4"
                                    >
                                        <label className="grid gap-1 text-xs font-medium text-muted">
                                            Channel
                                            <select
                                                className="nganzi-input h-8 text-xs"
                                                value={
                                                    paymentForm.data.provider
                                                }
                                                onChange={(e) =>
                                                    paymentForm.setData(
                                                        'provider',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="mobile_money">
                                                    Mobile Money
                                                </option>
                                                <option value="card">
                                                    Card
                                                </option>
                                                <option value="bank_transfer">
                                                    Bank Transfer
                                                </option>
                                                <option value="cash_on_delivery">
                                                    Cash
                                                </option>
                                            </select>
                                        </label>
                                        <label className="grid flex-1 gap-1 text-xs font-medium text-muted">
                                            Transaction Reference
                                            <input
                                                className="nganzi-input h-8 text-xs"
                                                required
                                                placeholder="Verified receipt / txn ID"
                                                value={
                                                    paymentForm.data
                                                        .provider_reference
                                                }
                                                onChange={(e) =>
                                                    paymentForm.setData(
                                                        'provider_reference',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={
                                                paymentForm.processing ||
                                                !paymentForm.data
                                                    .provider_reference
                                            }
                                            className="h-8 rounded-lg bg-orange px-3 text-xs font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-50"
                                        >
                                            Confirm Paid
                                        </button>
                                    </form>
                                )}
                        </section>

                        {/* Notifications Log Section */}
                        <section className="rounded-xl border border-border bg-white p-5">
                            <h2 className="mb-3 text-sm font-bold text-brown">
                                Notifications
                            </h2>
                            {order.notifications &&
                            order.notifications.length > 0 ? (
                                <div className="divide-y divide-border/60">
                                    {order.notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="font-semibold text-brown">
                                                    {n.label}{' '}
                                                    <span className="font-normal text-muted uppercase">
                                                        · {n.channel}
                                                    </span>
                                                </p>
                                                <p className="text-muted">
                                                    {n.recipientHint ??
                                                        'No recipient'}{' '}
                                                    · {n.attempts} attempt
                                                    {n.attempts === 1
                                                        ? ''
                                                        : 's'}
                                                    {n.sentAt
                                                        ? ` · Sent ${n.sentAt}`
                                                        : ''}
                                                </p>
                                                {n.lastError && (
                                                    <p className="mt-0.5 text-red-700">
                                                        {n.lastError}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <NotificationBadge
                                                    status={n.status}
                                                />
                                                {canUpdateStatus &&
                                                    n.status === 'failed' && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.post(
                                                                    `/admin/orders/${encodeURIComponent(order.reference)}/notifications/${n.id}/retry`,
                                                                    {},
                                                                    {
                                                                        preserveScroll: true,
                                                                    },
                                                                )
                                                            }
                                                            className="rounded border border-border bg-white px-2 py-1 text-xs font-semibold text-brown hover:border-orange hover:text-orange"
                                                        >
                                                            Retry
                                                        </button>
                                                    )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted">
                                    No notifications recorded.
                                </p>
                            )}
                        </section>

                        {/* Status History Audit Section */}
                        <section className="rounded-xl border border-border bg-white p-5">
                            <h2 className="mb-3 text-sm font-bold text-brown">
                                Timeline
                            </h2>
                            {order.history.length ? (
                                <ol className="space-y-3 border-l border-border pl-4">
                                    {order.history.map((entry, index) => (
                                        <li
                                            key={`${entry.at}-${index}`}
                                            className="text-xs"
                                        >
                                            <p className="font-semibold text-brown">
                                                {entry.from} → {entry.to}
                                            </p>
                                            <p className="text-muted">
                                                {entry.actor} · {entry.at}
                                            </p>
                                            {entry.note && (
                                                <p className="mt-1 text-brown italic">
                                                    "{entry.note}"
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-xs text-muted">
                                    No status changes recorded.
                                </p>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Customer Details, Delivery, Notes */}
                    <aside className="space-y-6">
                        {/* Customer Information */}
                        <section className="rounded-xl border border-border bg-white p-5">
                            <h2 className="mb-3 text-sm font-bold text-brown">
                                Customer
                            </h2>
                            <p className="text-sm font-semibold text-brown">
                                {order.customerName}
                            </p>
                            <p className="mt-1 text-xs">
                                <a
                                    className="text-orange hover:underline"
                                    href={`tel:${order.customerPhone}`}
                                >
                                    {order.customerPhone}
                                </a>
                            </p>
                            {order.customerEmail && (
                                <p className="mt-0.5 text-xs break-all">
                                    <a
                                        className="text-orange hover:underline"
                                        href={`mailto:${order.customerEmail}`}
                                    >
                                        {order.customerEmail}
                                    </a>
                                </p>
                            )}

                            <div className="mt-4 border-t border-border pt-4">
                                <p className="text-xs font-semibold text-muted">
                                    Delivery Address
                                </p>
                                <p className="mt-1 text-sm text-brown">
                                    {Object.values(order.deliveryAddress).join(
                                        ', ',
                                    )}
                                </p>
                                {order.deliveryNotes && (
                                    <p className="mt-2 text-xs text-muted">
                                        <strong className="text-brown">
                                            Delivery note:
                                        </strong>{' '}
                                        {order.deliveryNotes}
                                    </p>
                                )}
                                {order.customerNotes && (
                                    <p className="mt-1 text-xs text-muted">
                                        <strong className="text-brown">
                                            Customer note:
                                        </strong>{' '}
                                        {order.customerNotes}
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Customer Order History */}
                        <section className="rounded-xl border border-border bg-white p-5">
                            <h2 className="mb-3 text-sm font-bold text-brown">
                                Prior Orders
                            </h2>
                            {order.customerHistory &&
                            order.customerHistory.length > 0 ? (
                                <div className="divide-y divide-border/60">
                                    {order.customerHistory.map((prior) => (
                                        <div
                                            key={prior.reference}
                                            className="flex items-center justify-between gap-2 py-2 text-xs first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <Link
                                                    href={`/admin/orders/${encodeURIComponent(prior.reference)}`}
                                                    className="font-mono font-bold text-orange hover:underline"
                                                >
                                                    {prior.reference}
                                                </Link>
                                                <p className="text-muted">
                                                    {prior.status} ·{' '}
                                                    {prior.paymentStatus}
                                                </p>
                                            </div>
                                            <span className="font-semibold text-brown">
                                                {formatPrice(
                                                    prior.total,
                                                    prior.currency,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted">
                                    No prior orders.
                                </p>
                            )}
                        </section>

                        {/* Internal Staff Notes */}
                        <section className="rounded-xl border border-border bg-white p-5">
                            <h2 className="mb-3 text-sm font-bold text-brown">
                                Staff Notes
                            </h2>
                            {canUpdateStatus ? (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        notesForm.patch(
                                            `/admin/orders/${encodeURIComponent(order.reference)}/notes`,
                                            {
                                                preserveScroll: true,
                                            },
                                        );
                                    }}
                                    className="space-y-2.5"
                                >
                                    <textarea
                                        className="nganzi-input min-h-24 w-full text-xs"
                                        aria-label="Internal notes"
                                        placeholder="Add private staff note…"
                                        value={notesForm.data.internal_notes}
                                        onChange={(event) =>
                                            notesForm.setData(
                                                'internal_notes',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {notesForm.errors.internal_notes && (
                                        <p className="text-xs text-red-600">
                                            {notesForm.errors.internal_notes}
                                        </p>
                                    )}
                                    <button
                                        className="w-full rounded-lg border border-border bg-white py-2 text-xs font-semibold text-brown transition-colors hover:border-orange hover:text-orange"
                                        type="submit"
                                        disabled={notesForm.processing}
                                    >
                                        Save Note
                                    </button>
                                </form>
                            ) : (
                                <p className="text-xs whitespace-pre-wrap text-muted">
                                    {order.internalNotes ||
                                        'No internal notes.'}
                                </p>
                            )}
                        </section>
                    </aside>
                </div>
            </main>
        </>
    );
}

OrderShow.layout = { breadcrumbs };

function TotalLine({
    label,
    amount,
    currency,
    strong = false,
}: {
    label: string;
    amount: number;
    currency: string;
    strong?: boolean;
}) {
    return (
        <div
            className={`flex justify-between ${strong ? 'border-t border-border pt-2.5 text-sm font-bold text-brown' : 'text-xs text-muted'}`}
        >
            <span>{label}</span>
            <span
                className={
                    strong
                        ? 'text-base font-bold text-brown'
                        : 'font-medium text-brown'
                }
            >
                {formatPrice(amount, currency)}
            </span>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    let badgeClass = 'text-stone-700 bg-stone-100';

    if (s.includes('pending')) {
        badgeClass = 'text-amber-800 bg-amber-50 border border-amber-200';
    } else if (s.includes('confirmed') || s.includes('processing')) {
        badgeClass = 'text-sky-800 bg-sky-50 border border-sky-200';
    } else if (s.includes('ready') || s.includes('dispatched')) {
        badgeClass = 'text-orange bg-orange/10 border border-orange/30';
    } else if (s.includes('completed')) {
        badgeClass = 'text-emerald-800 bg-emerald-50 border border-emerald-200';
    } else if (s.includes('cancelled')) {
        badgeClass = 'text-rose-800 bg-rose-50 border border-rose-200';
    }

    return (
        <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${badgeClass}`}
        >
            {status}
        </span>
    );
}

function PaymentBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    let badgeClass = 'text-stone-700 bg-stone-100';

    if (s.includes('paid') && !s.includes('unpaid')) {
        badgeClass = 'text-emerald-800 bg-emerald-50 border border-emerald-200';
    } else if (s.includes('pending')) {
        badgeClass = 'text-amber-800 bg-amber-50 border border-amber-200';
    } else if (s.includes('unpaid')) {
        badgeClass = 'text-stone-600 bg-stone-100 border border-stone-200';
    }

    return (
        <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${badgeClass}`}
        >
            {status}
        </span>
    );
}

function NotificationBadge({ status }: { status: string }) {
    let badgeClass = 'text-stone-600 bg-stone-100 border-stone-200';

    if (status === 'sent') {
        badgeClass = 'text-emerald-800 bg-emerald-50 border-emerald-200';
    } else if (status === 'queued') {
        badgeClass = 'text-amber-800 bg-amber-50 border-amber-200';
    } else if (status === 'failed') {
        badgeClass = 'text-rose-800 bg-rose-50 border-rose-200';
    }

    return (
        <span
            className={`inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}
        >
            {status}
        </span>
    );
}
