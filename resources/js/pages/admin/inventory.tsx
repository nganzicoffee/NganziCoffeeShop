import { Head, Link, router, useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';

type VariantStock = {
    id: number;
    product_id: number;
    product_name: string;
    product_status: string;
    label: string;
    sku: string | null;
    stock: number;
    active: boolean;
};

type Movement = {
    product: string;
    variant: string;
    sku: string | null;
    reason: string;
    delta: number;
    stockBefore: number;
    stockAfter: number;
    orderReference: string | null;
    actor: string;
    note: string | null;
    at: string | null;
};

type Props = {
    variants?: VariantStock[];
    lowStockThreshold?: number;
    movements: {
        data: Movement[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
    };
    filters: { search?: string; reason?: string; from?: string; to?: string };
    reasons: Array<{ value: string; label: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Inventory', href: '/admin/inventory' },
];

const ADJUST_REASONS = [
    { value: 'stock_in', label: 'Stock received' },
    { value: 'adjustment', label: 'Manual adjustment' },
    { value: 'damaged', label: 'Damaged / written off' },
    { value: 'lost', label: 'Lost' },
];

export default function InventoryHistoryIndex({
    variants = [],
    lowStockThreshold = 5,
    movements,
    filters,
    reasons,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [stockFilter, setStockFilter] = useState<'all' | 'alerts'>('all');
    const [adjustingVariantId, setAdjustingVariantId] = useState<number | null>(
        null,
    );

    function filter(values: Record<string, string>) {
        router.get(
            '/admin/inventory',
            { ...filters, ...values },
            { preserveState: true, replace: true },
        );
    }

    const activeVariants = variants.filter((v) => v.active);
    const outOfStockCount = activeVariants.filter((v) => v.stock === 0).length;
    const lowStockCount = activeVariants.filter(
        (v) => v.stock > 0 && v.stock <= lowStockThreshold,
    ).length;

    const displayedVariants =
        stockFilter === 'alerts'
            ? variants.filter((v) => v.active && v.stock <= lowStockThreshold)
            : variants;

    return (
        <>
            <Head title="Inventory — Nganzi Coffee" />
            <main className="min-h-full flex-1 space-y-8 bg-white p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-brown">
                            Inventory
                        </h1>
                        <p className="mt-1 text-xs text-muted">
                            Current stock levels, quick adjustments, and
                            movement audit history.
                        </p>
                    </div>
                    <Link
                        href="/admin/products"
                        className="rounded-lg border border-border bg-white px-3.5 py-2 text-xs font-semibold text-brown transition-colors hover:border-orange hover:text-orange"
                    >
                        Manage Products →
                    </Link>
                </div>

                {/* Stock Summary Strip */}
                {variants.length > 0 && (
                    <section
                        aria-label="Inventory summary"
                        className="grid gap-4 sm:grid-cols-3"
                    >
                        <div className="rounded-lg border border-border bg-white p-4">
                            <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                                Active Variants
                            </p>
                            <p className="mt-1.5 text-2xl font-bold text-brown">
                                {activeVariants.length}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border bg-white p-4">
                            <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                                Low Stock (≤ {lowStockThreshold})
                            </p>
                            <p className="mt-1.5 text-2xl font-bold text-amber-800">
                                {lowStockCount}
                            </p>
                        </div>
                        <div className="rounded-lg border border-border bg-white p-4">
                            <p className="text-xs font-semibold tracking-wider text-muted uppercase">
                                Out of Stock
                            </p>
                            <p className="mt-1.5 text-2xl font-bold text-rose-700">
                                {outOfStockCount}
                            </p>
                        </div>
                    </section>
                )}

                {/* Current Variant Stock & Inline Adjust */}
                {variants.length > 0 && (
                    <section className="rounded-xl border border-border bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                            <div>
                                <h2 className="text-sm font-bold text-brown">
                                    Stock Levels
                                </h2>
                                <p className="text-xs text-muted">
                                    Adjust stock directly or open a product to
                                    edit variants.
                                </p>
                            </div>
                            <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
                                <button
                                    type="button"
                                    onClick={() => setStockFilter('all')}
                                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                                        stockFilter === 'all'
                                            ? 'bg-orange text-white'
                                            : 'text-brown hover:bg-peach/50'
                                    }`}
                                >
                                    All ({variants.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStockFilter('alerts')}
                                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                                        stockFilter === 'alerts'
                                            ? 'bg-orange text-white'
                                            : 'text-brown hover:bg-peach/50'
                                    }`}
                                >
                                    Alerts ({lowStockCount + outOfStockCount})
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border bg-white text-xs font-semibold text-muted">
                                    <tr>
                                        <th className="px-5 py-3">Product</th>
                                        <th className="px-5 py-3">Variant</th>
                                        <th className="px-5 py-3">SKU</th>
                                        <th className="px-5 py-3">
                                            Available Stock
                                        </th>
                                        <th className="px-5 py-3 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {displayedVariants.map((v) => {
                                        const isOut = v.active && v.stock === 0;
                                        const isLow =
                                            v.active &&
                                            v.stock > 0 &&
                                            v.stock <= lowStockThreshold;
                                        const isAdjusting =
                                            adjustingVariantId === v.id;

                                        return (
                                            <VariantStockRow
                                                key={v.id}
                                                variant={v}
                                                isOut={isOut}
                                                isLow={isLow}
                                                isAdjusting={isAdjusting}
                                                onToggleAdjust={() =>
                                                    setAdjustingVariantId(
                                                        isAdjusting
                                                            ? null
                                                            : v.id,
                                                    )
                                                }
                                            />
                                        );
                                    })}
                                    {displayedVariants.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-5 py-8 text-center text-xs text-muted"
                                            >
                                                No variants with low or
                                                out-of-stock alerts.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Movement History Section */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-base font-bold text-brown">
                            Movement History
                        </h2>
                        <p className="text-xs text-muted">
                            Audited ledger of stock additions, adjustments,
                            sales, and cancellations.
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
                        <div className="relative min-w-56 flex-1">
                            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                            <input
                                className="nganzi-input h-9 w-full pl-9 text-xs"
                                type="search"
                                aria-label="Search movements"
                                placeholder="Search product, SKU, or order…"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) =>
                                    event.key === 'Enter' && filter({ search })
                                }
                            />
                        </div>
                        <select
                            className="nganzi-input h-9 text-xs"
                            aria-label="Filter by reason"
                            value={filters.reason ?? ''}
                            onChange={(event) =>
                                filter({ reason: event.target.value })
                            }
                        >
                            <option value="">All reasons</option>
                            {reasons.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-1.5">
                            <input
                                id="inventory-from"
                                className="nganzi-input h-9 w-32 text-xs"
                                type="date"
                                value={filters.from ?? ''}
                                onChange={(event) =>
                                    filter({ from: event.target.value })
                                }
                            />
                            <span className="text-xs text-muted">to</span>
                            <input
                                id="inventory-to"
                                className="nganzi-input h-9 w-32 text-xs"
                                type="date"
                                value={filters.to ?? ''}
                                onChange={(event) =>
                                    filter({ to: event.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* Movements Table */}
                    <div className="overflow-hidden rounded-xl border border-border bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border bg-white text-xs font-semibold text-muted">
                                    <tr>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Product</th>
                                        <th className="px-5 py-3">SKU</th>
                                        <th className="px-5 py-3">Reason</th>
                                        <th className="px-5 py-3 text-center">
                                            Change
                                        </th>
                                        <th className="px-5 py-3 text-center">
                                            Stock
                                        </th>
                                        <th className="px-5 py-3">Order</th>
                                        <th className="px-5 py-3">Staff</th>
                                        <th className="px-5 py-3">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {movements.data.map((movement, idx) => (
                                        <tr
                                            key={`${movement.at}-${idx}`}
                                            className="transition-colors hover:bg-stone-50/50"
                                        >
                                            <td className="px-5 py-3.5 text-xs whitespace-nowrap text-muted">
                                                {movement.at ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-brown">
                                                    {movement.product}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {movement.variant}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-xs text-muted">
                                                {movement.sku ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs font-medium text-brown">
                                                {movement.reason}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span
                                                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                                                        movement.delta > 0
                                                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                                            : movement.delta < 0
                                                              ? 'border border-rose-200 bg-rose-50 text-rose-800'
                                                              : 'bg-stone-100 text-stone-700'
                                                    }`}
                                                >
                                                    {movement.delta > 0
                                                        ? `+${movement.delta}`
                                                        : movement.delta}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center font-mono text-xs whitespace-nowrap text-muted">
                                                {movement.stockBefore} →{' '}
                                                <strong className="text-brown">
                                                    {movement.stockAfter}
                                                </strong>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {movement.orderReference ? (
                                                    <Link
                                                        href={`/admin/orders/${encodeURIComponent(movement.orderReference)}`}
                                                        className="font-mono text-xs font-bold text-orange hover:underline"
                                                    >
                                                        {
                                                            movement.orderReference
                                                        }
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-muted">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-brown">
                                                {movement.actor}
                                            </td>
                                            <td
                                                className="max-w-xs truncate px-5 py-3.5 text-xs text-muted"
                                                title={movement.note ?? ''}
                                            >
                                                {movement.note ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {movements.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-5 py-12 text-center text-muted"
                                            >
                                                <p className="font-medium text-brown">
                                                    No inventory movements found
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
                        aria-label="Inventory pages"
                        className="flex flex-wrap items-center justify-between gap-3 text-sm"
                    >
                        <span className="text-xs text-muted">
                            Page {movements.current_page} of{' '}
                            {movements.last_page}
                        </span>
                        <div className="flex gap-1.5">
                            {movements.links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.visit(link.url)
                                    }
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        link.active
                                            ? 'border-orange bg-orange text-white'
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
                </section>
            </main>
        </>
    );
}

InventoryHistoryIndex.layout = { breadcrumbs };

function VariantStockRow({
    variant,
    isOut,
    isLow,
    isAdjusting,
    onToggleAdjust,
}: {
    variant: VariantStock;
    isOut: boolean;
    isLow: boolean;
    isAdjusting: boolean;
    onToggleAdjust: () => void;
}) {
    const form = useForm({
        delta: '',
        reason: 'stock_in',
        note: '',
    });

    function submitAdjust(e: React.FormEvent) {
        e.preventDefault();
        form.post(
            `/admin/products/${variant.product_id}/variants/${variant.id}/inventory`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    onToggleAdjust();
                },
            },
        );
    }

    return (
        <>
            <tr className="transition-colors hover:bg-stone-50/50">
                <td className="px-5 py-3">
                    <Link
                        href={`/admin/products/${variant.product_id}/edit`}
                        className="font-semibold text-brown hover:text-orange"
                    >
                        {variant.product_name}
                    </Link>
                </td>
                <td className="px-5 py-3 text-xs text-brown">
                    {variant.label}
                    {!variant.active && (
                        <span className="ml-1.5 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-muted">
                            Inactive
                        </span>
                    )}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-muted">
                    {variant.sku ?? '—'}
                </td>
                <td className="px-5 py-3 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-brown">
                            {variant.stock}
                        </span>
                        {isOut ? (
                            <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                                Out of stock
                            </span>
                        ) : isLow ? (
                            <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                                Low stock
                            </span>
                        ) : null}
                    </div>
                </td>
                <td className="px-5 py-3 text-right">
                    <button
                        type="button"
                        onClick={onToggleAdjust}
                        className="text-xs font-semibold text-orange hover:underline"
                    >
                        {isAdjusting ? 'Cancel' : 'Adjust'}
                    </button>
                </td>
            </tr>
            {isAdjusting && (
                <tr className="bg-white">
                    <td colSpan={5} className="px-5 py-3.5">
                        <form
                            onSubmit={submitAdjust}
                            className="flex flex-wrap items-end gap-2.5"
                        >
                            <label className="grid gap-1 text-xs font-medium text-muted">
                                Quantity (+ add / − remove)
                                <input
                                    type="number"
                                    required
                                    placeholder="e.g. 15 or -2"
                                    className="nganzi-input h-8 w-36 text-xs"
                                    value={form.data.delta}
                                    onChange={(e) =>
                                        form.setData('delta', e.target.value)
                                    }
                                />
                            </label>
                            <label className="grid gap-1 text-xs font-medium text-muted">
                                Reason
                                <select
                                    className="nganzi-input h-8 text-xs"
                                    value={form.data.reason}
                                    onChange={(e) =>
                                        form.setData('reason', e.target.value)
                                    }
                                >
                                    {ADJUST_REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid min-w-48 flex-1 gap-1 text-xs font-medium text-muted">
                                Note
                                <input
                                    placeholder="Optional batch or reason note…"
                                    className="nganzi-input h-8 text-xs"
                                    value={form.data.note}
                                    onChange={(e) =>
                                        form.setData('note', e.target.value)
                                    }
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={form.processing || !form.data.delta}
                                className="h-8 rounded-lg bg-orange px-3.5 text-xs font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-50"
                            >
                                {form.processing ? 'Saving…' : 'Save'}
                            </button>
                        </form>
                    </td>
                </tr>
            )}
        </>
    );
}
