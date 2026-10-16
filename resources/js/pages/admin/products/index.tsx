import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/price';
import type { BreadcrumbItem, Category, PaginatedProducts } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Products', href: '/admin/products' },
];

type Props = {
    products: PaginatedProducts & {
        current_page?: number;
        last_page?: number;
    };
    categories: Category[];
    filters: { search?: string; status?: string; category?: string };
    lowStockThreshold: number;
    currency?: string;
};

export default function ProductsIndex({
    products,
    categories,
    filters,
    lowStockThreshold,
    currency = 'UGX',
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(params: Record<string, string>) {
        router.get(
            '/admin/products',
            { ...filters, ...params },
            { preserveState: true, replace: true },
        );
    }

    const lastPage = products.meta?.last_page ?? products.last_page ?? 1;
    const currentPage =
        products.meta?.current_page ?? products.current_page ?? 1;

    return (
        <>
            <Head title="Products — Nganzi Coffee" />

            <main className="min-h-full flex-1 space-y-6 bg-white p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-brown">
                            Products
                        </h1>
                        <p className="mt-1 text-xs text-muted">
                            Catalogue items, pack sizes, pricing, and
                            availability.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/admin/inventory"
                            className="rounded-lg border border-border bg-white px-3.5 py-2 text-xs font-semibold text-brown transition-colors hover:border-orange hover:text-orange"
                        >
                            Inventory
                        </Link>
                        <Link
                            href="/admin/products/create"
                            className="rounded-lg bg-orange px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-hover"
                        >
                            + Add Product
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
                    <div className="relative min-w-60 flex-1">
                        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                        <input
                            type="search"
                            aria-label="Search products"
                            placeholder="Search product name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && applyFilter({ search })
                            }
                            className="nganzi-input h-9 w-full pl-9 text-xs"
                        />
                    </div>
                    <select
                        aria-label="Status filter"
                        className="nganzi-input h-9 w-40 text-xs"
                        value={filters.status ?? ''}
                        onChange={(e) =>
                            applyFilter({ status: e.target.value })
                        }
                    >
                        <option value="">All statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                    <select
                        aria-label="Category filter"
                        className="nganzi-input h-9 w-44 text-xs"
                        value={filters.category ?? ''}
                        onChange={(e) =>
                            applyFilter({ category: e.target.value })
                        }
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {(filters.search || filters.status || filters.category) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                router.get(
                                    '/admin/products',
                                    {},
                                    { preserveState: true, replace: true },
                                );
                            }}
                            className="px-2 text-xs font-medium text-muted hover:text-orange"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Products Table */}
                <div className="overflow-hidden rounded-xl border border-border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-white text-xs font-semibold text-muted">
                                <tr>
                                    <th className="px-5 py-3">Product</th>
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">
                                        Variants & Price
                                    </th>
                                    <th className="px-5 py-3">Stock</th>
                                    <th className="px-5 py-3 text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {products.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-xs text-muted"
                                        >
                                            No products match the current
                                            filters.
                                        </td>
                                    </tr>
                                )}
                                {products.data.map((product) => {
                                    const activeVariants =
                                        product.variants.filter(
                                            (v) => v.active,
                                        );
                                    const totalStock = product.variants.reduce(
                                        (sum, v) => sum + v.stock,
                                        0,
                                    );
                                    const hasLowStock = activeVariants.some(
                                        (v) =>
                                            v.stock > 0 &&
                                            v.stock <= lowStockThreshold,
                                    );
                                    const hasOutOfStock = activeVariants.some(
                                        (v) => v.stock === 0,
                                    );
                                    const minPrice =
                                        product.variants.length > 0
                                            ? Math.min(
                                                  ...product.variants.map(
                                                      (v) => v.price_minor,
                                                  ),
                                              )
                                            : null;

                                    return (
                                        <tr
                                            key={product.id}
                                            className="transition-colors hover:bg-stone-50/50"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/admin/products/${product.id}/edit`}
                                                        className="font-semibold text-brown hover:text-orange"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    {product.featured && (
                                                        <span className="rounded border border-orange/30 bg-orange/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange">
                                                            Featured
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-mono text-[11px] text-muted">
                                                    {product.slug}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-muted">
                                                {product.category?.name ?? '—'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <StatusBadge
                                                    status={product.status}
                                                />
                                            </td>
                                            <td className="px-5 py-3.5 text-xs">
                                                {product.variants.length > 0 ? (
                                                    <div>
                                                        <p className="font-semibold text-brown">
                                                            {minPrice !== null
                                                                ? `From ${formatPrice(minPrice, currency)}`
                                                                : '—'}
                                                        </p>
                                                        <p className="text-muted">
                                                            {product.variants
                                                                .map(
                                                                    (v) =>
                                                                        v.label,
                                                                )
                                                                .join(', ')}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-amber-700">
                                                        No variants
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-brown">
                                                        {totalStock}
                                                    </span>
                                                    {hasOutOfStock ? (
                                                        <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                                                            Out of stock
                                                        </span>
                                                    ) : hasLowStock ? (
                                                        <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                                                            Low stock
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Link
                                                    href={`/admin/products/${product.id}/edit`}
                                                    className="text-xs font-semibold text-orange hover:underline"
                                                >
                                                    Edit →
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                    <nav
                        aria-label="Product pages"
                        className="flex flex-wrap items-center justify-between gap-3 text-sm"
                    >
                        <span className="text-xs text-muted">
                            Page {currentPage} of {lastPage}
                        </span>
                        <div className="flex gap-1.5">
                            {products.links.map((link, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.get(link.url)
                                    }
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        link.active
                                            ? 'border-orange bg-orange text-white'
                                            : 'border-border bg-white text-brown hover:border-orange hover:text-orange disabled:opacity-40'
                                    }`}
                                >
                                    {link.label
                                        .replace(/<[^>]*>/g, '')
                                        .replace(/&laquo;/g, '«')
                                        .replace(/&raquo;/g, '»')}
                                </button>
                            ))}
                        </div>
                    </nav>
                )}
            </main>
        </>
    );
}

ProductsIndex.layout = { breadcrumbs };

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        published: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        draft: 'bg-stone-100 text-stone-700 border border-stone-200',
        archived: 'bg-rose-50 text-rose-800 border border-rose-200',
    };
    const labels: Record<string, string> = {
        published: 'Published',
        draft: 'Draft',
        archived: 'Archived',
    };
    return (
        <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-stone-100 text-stone-600'}`}
        >
            {labels[status] ?? status}
        </span>
    );
}
