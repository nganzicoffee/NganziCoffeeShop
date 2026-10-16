import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { formatPrice } from '@/lib/price';
import type { BreadcrumbItem } from '@/types';
import {
    SalesTrendChart,
    type SalesTrendPoint,
} from '@/components/admin/charts/SalesTrendChart';
import { ProductPerformanceChart } from '@/components/admin/charts/ProductPerformanceChart';
import { FulfilmentStatusChart } from '@/components/admin/charts/FulfilmentStatusChart';

type Props = {
    filters: { from: string; to: string };
    currency: string;
    canExport?: boolean;
    salesTrend?: SalesTrendPoint[];
    salesDefinition: string;
    definitions?: Record<string, string>;
    metrics: {
        order_count?: number;
        sales_minor: number;
        paid_order_count: number;
        average_order_value_minor: number;
        refunded_count?: number;
        refunded_minor?: number;
        awaiting_action_count: number;
        unfulfilled_count: number;
        low_stock_count: number;
        out_of_stock_count: number;
        failed_notifications_count?: number;
    };
    productPerformance?: Array<{
        product_name: string;
        variant_label: string;
        sku: string | null;
        units_sold: number;
        revenue_minor: number;
    }>;
    fulfilmentBacklog?: Array<{
        status: string;
        label: string;
        count: number;
    }>;
    inventoryExceptions?: Array<{
        product_id: number;
        product_name: string;
        variant_label: string;
        sku: string | null;
        stock: number;
        status: 'out_of_stock' | 'low_stock';
    }>;
    recentOrders: Array<{
        reference: string;
        customer_name: string;
        status: string;
        payment_status: string;
        total_minor: number;
        currency: string;
        items_count: number;
        created_at: string;
    }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Dashboard', href: '/admin' },
];

export default function AdminDashboard({
    filters,
    currency,
    canExport = true,
    salesTrend = [],
    salesDefinition,
    metrics,
    productPerformance = [],
    fulfilmentBacklog = [],
    inventoryExceptions = [],
    recentOrders,
}: Props) {
    const [fromDate, setFromDate] = useState(filters.from);
    const [toDate, setToDate] = useState(filters.to);

    function applyRange(from: string, to: string) {
        setFromDate(from);
        setToDate(to);
        router.get(
            '/admin',
            { from, to },
            { preserveState: true, replace: true },
        );
    }

    function setPreset(days: number) {
        const to = new Date().toISOString().split('T')[0];
        const fromDateObj = new Date();
        fromDateObj.setDate(fromDateObj.getDate() - (days - 1));
        const from = fromDateObj.toISOString().split('T')[0];
        applyRange(from, to);
    }

    function setMonthToDate() {
        const now = new Date();
        const to = now.toISOString().split('T')[0];
        const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        applyRange(from, to);
    }

    return (
        <>
            <Head title="Store Dashboard — Nganzi Coffee" />
            <main className="min-h-full flex-1 space-y-8 bg-white p-6 md:p-8">
                {/* Header with Company Logo & Date Filter */}
                <div className="flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative h-12 w-40 shrink-0 overflow-hidden">
                            <img
                                src="/images/brand/logo.svg"
                                alt="Nganzi Coffee"
                                className="absolute top-1/2 left-0 h-[160px] w-[160px] -translate-y-1/2 object-contain"
                            />
                        </div>
                        <div className="hidden h-8 w-px bg-border sm:block" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-brown">
                                Store Dashboard
                            </h1>
                            <p className="text-xs text-muted">
                                {filters.from} to {filters.to} ·{' '}
                                <span className="font-semibold text-brown">
                                    {currency}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
                            <button
                                type="button"
                                onClick={() => setPreset(1)}
                                className="rounded px-2.5 py-1 text-xs font-medium text-brown transition-colors hover:bg-peach/50"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreset(7)}
                                className="rounded px-2.5 py-1 text-xs font-medium text-brown transition-colors hover:bg-peach/50"
                            >
                                7 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreset(30)}
                                className="rounded px-2.5 py-1 text-xs font-medium text-brown transition-colors hover:bg-peach/50"
                            >
                                30 Days
                            </button>
                            <button
                                type="button"
                                onClick={setMonthToDate}
                                className="rounded px-2.5 py-1 text-xs font-medium text-brown transition-colors hover:bg-peach/50"
                            >
                                This Month
                            </button>
                        </div>

                        <form
                            className="flex items-center gap-1.5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyRange(fromDate, toDate);
                            }}
                        >
                            <input
                                className="nganzi-input h-8 w-32 px-2 py-1 text-xs"
                                type="date"
                                aria-label="From date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                            <span className="text-xs text-muted">—</span>
                            <input
                                className="nganzi-input h-8 w-32 px-2 py-1 text-xs"
                                type="date"
                                aria-label="To date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                            <button
                                className="btn h-8 rounded-lg bg-orange px-3 text-xs font-semibold text-white transition-colors hover:bg-orange-hover"
                                type="submit"
                            >
                                Filter
                            </button>
                        </form>
                    </div>
                </div>

                {/* Minimalist Metrics Cards */}
                <section
                    aria-label="Key store metrics"
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <div className="rounded-lg border border-border bg-white p-5">
                        <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                            Captured Sales
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-brown">
                            {formatPrice(metrics.sales_minor, currency)}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                            {metrics.paid_order_count} paid of{' '}
                            {metrics.order_count ?? metrics.paid_order_count}{' '}
                            orders
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-white p-5">
                        <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                            Average Order Value
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-brown">
                            {formatPrice(
                                metrics.average_order_value_minor,
                                currency,
                            )}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                            Paid orders in period
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-white p-5">
                        <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                            Refunds
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-brown">
                            {formatPrice(metrics.refunded_minor ?? 0, currency)}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                            {metrics.refunded_count ?? 0} refunded in period
                        </p>
                    </div>

                    <Link
                        href="/admin/orders?status=pending"
                        className="rounded-lg border border-border bg-white p-5 transition-colors hover:border-orange"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                                Awaiting Action
                            </p>
                            {metrics.awaiting_action_count > 0 && (
                                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                    Action needed
                                </span>
                            )}
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-brown">
                            {metrics.awaiting_action_count}
                        </p>
                        <p className="mt-1 text-xs text-orange">
                            {metrics.unfulfilled_count} open in backlog →
                        </p>
                    </Link>
                </section>

                {/* Sales & Orders Trends Graph */}
                <SalesTrendChart
                    data={salesTrend}
                    currency={currency}
                    periodLabel={`${filters.from} to ${filters.to}`}
                />

                {(metrics.failed_notifications_count ?? 0) > 0 && (
                    <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white px-4 py-3 text-xs text-red-800">
                        <span>
                            <strong>
                                {metrics.failed_notifications_count}
                            </strong>{' '}
                            order notification(s) failed delivery.
                        </span>
                        <Link
                            href="/admin/orders"
                            className="font-semibold text-orange hover:underline"
                        >
                            Review orders →
                        </Link>
                    </div>
                )}

                <p className="text-[11px] text-muted">{salesDefinition}</p>

                {/* Reporting Grid: Product Performance, Fulfilment Backlog & Stock Exceptions */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Product Performance with Graph & Table switch (2 cols) */}
                    <div className="lg:col-span-2">
                        <ProductPerformanceChart
                            items={productPerformance}
                            currency={currency}
                            canExport={canExport}
                            dateRangeLabel={`${filters.from} – ${filters.to}`}
                            exportUrl={`/admin/orders/export?from=${filters.from}&to=${filters.to}`}
                        />
                    </div>

                    {/* Fulfilment Backlog Donut & Inventory Exceptions (1 col) */}
                    <div className="space-y-6">
                        <FulfilmentStatusChart
                            items={fulfilmentBacklog}
                            totalUnfulfilled={metrics.unfulfilled_count}
                        />

                        <section className="rounded-lg border border-border bg-white p-5 shadow-xs">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-brown">
                                    Inventory Exceptions
                                </h2>
                                <Link
                                    href="/admin/inventory"
                                    className="text-xs font-semibold text-orange hover:underline"
                                >
                                    Inventory →
                                </Link>
                            </div>
                            <p className="mb-3 text-xs text-muted">
                                {metrics.low_stock_count} low ·{' '}
                                {metrics.out_of_stock_count} out of stock
                            </p>
                            {inventoryExceptions.length > 0 ? (
                                <div className="divide-y divide-border/60 text-xs">
                                    {inventoryExceptions
                                        .slice(0, 6)
                                        .map((item, idx) => (
                                            <div
                                                key={`${item.product_id}-${item.sku ?? idx}`}
                                                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                                            >
                                                <div>
                                                    <p className="font-medium text-brown">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="text-muted">
                                                        {item.variant_label}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`rounded px-2 py-0.5 font-semibold ${
                                                        item.stock === 0
                                                            ? 'bg-red-50 text-red-800'
                                                            : 'bg-amber-50 text-amber-900'
                                                    }`}
                                                >
                                                    {item.stock} left
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted">
                                    All active variants above threshold.
                                </p>
                            )}
                        </section>
                    </div>
                </div>

                {/* Recent Orders Section */}
                <section className="rounded-lg border border-border bg-white">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <h2 className="text-base font-bold text-brown">
                            Recent Orders
                        </h2>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/admin/products/create"
                                className="rounded bg-orange px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-hover"
                            >
                                + Add Product
                            </Link>
                            <Link
                                href="/admin/orders"
                                className="text-xs font-semibold text-orange hover:underline"
                            >
                                View all orders →
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-white text-xs font-semibold text-muted">
                                <tr>
                                    <th className="px-5 py-3">Reference</th>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Fulfilment</th>
                                    <th className="px-5 py-3">Payment</th>
                                    <th className="px-5 py-3 text-right">
                                        Items
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentOrders.map((order) => (
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
                                            <p className="text-[11px] text-muted">
                                                {new Date(
                                                    order.created_at,
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    },
                                                )}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3.5 font-medium text-brown">
                                            {order.customer_name}
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
                                        <td className="px-5 py-3.5 text-right font-bold text-brown">
                                            {formatPrice(
                                                order.total_minor,
                                                order.currency,
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-8 text-center text-xs text-muted"
                                        >
                                            No orders placed yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </>
    );
}

AdminDashboard.layout = { breadcrumbs };

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    let badgeClass = 'bg-stone-100 text-stone-700 border-stone-200';

    if (s.includes('pending')) {
        badgeClass = 'bg-amber-50 text-amber-900 border-amber-200';
    } else if (s.includes('confirmed')) {
        badgeClass = 'bg-sky-50 text-sky-900 border-sky-200';
    } else if (s.includes('processing')) {
        badgeClass = 'bg-indigo-50 text-indigo-900 border-indigo-200';
    } else if (s.includes('ready') || s.includes('dispatched')) {
        badgeClass = 'bg-peach text-brown font-semibold border-orange/40';
    } else if (s.includes('completed')) {
        badgeClass = 'bg-emerald-50 text-emerald-900 border-emerald-200';
    } else if (s.includes('cancelled')) {
        badgeClass = 'bg-red-50 text-red-900 border-red-200';
    }

    return (
        <span
            className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
        >
            {status}
        </span>
    );
}

function PaymentBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    let badgeClass = 'bg-stone-100 text-stone-700';

    if (s.includes('paid') && !s.includes('unpaid')) {
        badgeClass = 'bg-emerald-100 text-emerald-900 font-semibold';
    } else if (s.includes('pending')) {
        badgeClass = 'bg-amber-100 text-amber-900 font-semibold';
    } else if (s.includes('unpaid')) {
        badgeClass = 'bg-stone-100 text-stone-600 font-medium';
    } else if (s.includes('refund')) {
        badgeClass = 'bg-purple-100 text-purple-900 font-semibold';
    }

    return (
        <span
            className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${badgeClass}`}
        >
            {status}
        </span>
    );
}
