import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/price';
import type { BreadcrumbItem } from '@/types';

type Option = { value: string; label: string };
type Props = {
    orders: {
        data: Array<{
            reference: string;
            customer_name: string;
            customer_email: string | null;
            customer_phone: string;
            status: string;
            payment_status: string;
            total_minor: number;
            currency: string;
            items_count: number;
            created_at: string;
        }>;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        status?: string;
        payment_status?: string;
        from?: string;
        to?: string;
    };
    canExport?: boolean;
    statuses: Option[];
    paymentStatuses: Option[];
    exportFrom: string;
    exportTo: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Orders', href: '/admin/orders' },
];

export default function OrdersIndex({
    orders,
    filters,
    canExport = true,
    statuses,
    paymentStatuses,
    exportFrom,
    exportTo,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function filter(values: Record<string, string>) {
        router.get(
            '/admin/orders',
            { ...filters, ...values },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Orders — Nganzi Coffee" />
            <main className="min-h-full flex-1 space-y-6 bg-white p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-brown">
                            Orders
                        </h1>
                        <p className="mt-1 text-sm text-muted">
                            Manage customer orders, track payments, and update
                            fulfilment.
                        </p>
                    </div>
                    {canExport && (
                        <a
                            href={`/admin/orders/export?from=${filters.from ?? exportFrom}&to=${filters.to ?? exportTo}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-brown shadow-sm transition-colors hover:border-orange hover:text-orange"
                        >
                            <span>Export CSV</span>
                        </a>
                    )}
                </div>

                {/* Filters Bar */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
                    <div className="relative min-w-60 flex-1">
                        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                        <input
                            className="nganzi-input h-9 w-full pl-9 text-xs"
                            type="search"
                            aria-label="Search orders"
                            placeholder="Search reference, customer, email, phone…"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) =>
                                event.key === 'Enter' && filter({ search })
                            }
                        />
                    </div>
                    <select
                        className="nganzi-input h-9 text-xs"
                        aria-label="Fulfilment status"
                        value={filters.status ?? ''}
                        onChange={(event) =>
                            filter({ status: event.target.value })
                        }
                    >
                        <option value="">All fulfilment statuses</option>
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    <select
                        className="nganzi-input h-9 text-xs"
                        aria-label="Payment status"
                        value={filters.payment_status ?? ''}
                        onChange={(event) =>
                            filter({ payment_status: event.target.value })
                        }
                    >
                        <option value="">All payment statuses</option>
                        {paymentStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                        <input
                            id="orders-from"
                            className="nganzi-input h-9 w-32 text-xs"
                            type="date"
                            value={filters.from ?? ''}
                            onChange={(event) =>
                                filter({ from: event.target.value })
                            }
                        />
                        <span className="text-xs text-muted">to</span>
                        <input
                            id="orders-to"
                            className="nganzi-input h-9 w-32 text-xs"
                            type="date"
                            value={filters.to ?? ''}
                            onChange={(event) =>
                                filter({ to: event.target.value })
                            }
                        />
                    </div>
                </div>

                {/* Orders Table */}
                <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-white text-xs font-semibold text-muted">
                                <tr>
                                    <th className="px-5 py-3">Order</th>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Fulfilment</th>
                                    <th className="px-5 py-3">Payment</th>
                                    <th className="px-5 py-3 text-right">
                                        Items
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Total
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {orders.data.map((order) => (
                                    <tr
                                        key={order.reference}
                                        className="transition-colors hover:bg-stone-50/50"
                                    >
                                        <td className="px-5 py-3.5">
                                            <Link
                                                href={`/admin/orders/${encodeURIComponent(order.reference)}`}
                                                className="font-mono text-xs font-bold text-orange hover:underline"
                                            >
                                                {order.reference}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-semibold text-brown">
                                                {order.customer_name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {order.customer_phone}
                                                {order.customer_email
                                                    ? ` · ${order.customer_email}`
                                                    : ''}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge
                                                status={order.status}
                                            />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <PaymentBadge
                                                status={order.payment_status}
                                            />
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-xs text-muted">
                                            {order.items_count}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-semibold text-brown">
                                            {formatPrice(
                                                order.total_minor,
                                                order.currency,
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-xs text-muted">
                                            {new Date(
                                                order.created_at,
                                            ).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                                {orders.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center text-muted"
                                        >
                                            <p className="font-medium text-brown">
                                                No orders found
                                            </p>
                                            <p className="mt-1 text-xs text-muted">
                                                Try clearing search filters.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <nav
                    aria-label="Order pages"
                    className="flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                    <span className="text-xs text-muted">
                        Page {orders.current_page} of {orders.last_page}
                    </span>
                    <div className="flex gap-1.5">
                        {orders.links.map((link, index) => (
                            <button
                                key={`${link.label}-${index}`}
                                type="button"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url && router.visit(link.url)
                                }
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    link.active
                                        ? 'border-orange bg-orange text-white shadow-sm'
                                        : 'border-border bg-white text-brown hover:border-orange hover:text-orange'
                                } disabled:opacity-40`}
                            >
                                {link.label
                                    .replace(/<[^>]*>/g, '')
                                    .replace(/&laquo;/g, '«')
                                    .replace(/&raquo;/g, '»')}
                            </button>
                        ))}
                    </div>
                </nav>
            </main>
        </>
    );
}

OrdersIndex.layout = { breadcrumbs };

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
            {status.replaceAll('_', ' ')}
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
            {status.replaceAll('_', ' ')}
        </span>
    );
}
