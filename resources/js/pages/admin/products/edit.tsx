import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { formatPrice } from '@/lib/price';
import type {
    BreadcrumbItem,
    Category,
    Product,
    ProductVariant,
    StatusOption,
} from '@/types';
import ProductForm from './_ProductForm';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Products', href: '/admin/products' },
    { title: 'Edit Product', href: '/admin/products' },
];

type Props = {
    product: Product;
    categories: Category[];
    statuses: StatusOption[];
    lowStockThreshold: number;
    currency?: string;
};

export default function ProductEdit({
    product,
    categories,
    statuses,
    lowStockThreshold,
    currency = 'UGX',
}: Props) {
    return (
        <>
            <Head title={`Edit ${product.name} — Nganzi Coffee`} />

            <main className="min-h-full flex-1 space-y-6 bg-white p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <Link
                            href="/admin/products"
                            className="text-xs font-medium text-muted hover:text-orange"
                        >
                            ← Products
                        </Link>
                        <div className="mt-1.5 flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-brown">
                                {product.name}
                            </h1>
                            <span
                                className={`inline-block rounded border px-2 py-0.5 text-xs font-medium capitalize ${
                                    product.status === 'published'
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        : product.status === 'archived'
                                          ? 'border-rose-200 bg-rose-50 text-rose-800'
                                          : 'border-stone-200 bg-stone-100 text-stone-700'
                                }`}
                            >
                                {product.status}
                            </span>
                        </div>
                    </div>

                    {product.status === 'published' && (
                        <a
                            href={`/shop/${product.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-border bg-white px-3.5 py-2 text-xs font-semibold text-brown transition-colors hover:border-orange hover:text-orange"
                        >
                            View in Shop ↗
                        </a>
                    )}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                    <div className="space-y-6">
                        {/* Product details */}
                        <section className="rounded-xl border border-border bg-white p-6">
                            <h2 className="mb-4 text-sm font-bold text-brown">
                                Product Details
                            </h2>
                            <ProductForm
                                product={product}
                                categories={categories}
                                statuses={statuses}
                                action={`/admin/products/${product.id}`}
                                method="put"
                            />
                        </section>

                        {/* Variants */}
                        <section className="rounded-xl border border-border bg-white p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-brown">
                                        Pack Variants & Stock
                                    </h2>
                                    <p className="text-xs text-muted">
                                        Manage sizes (e.g. 250g, 500g, 1kg), SKU
                                        codes, prices in {currency}, and
                                        inventory.
                                    </p>
                                </div>
                            </div>
                            <VariantList
                                product={product}
                                lowStockThreshold={lowStockThreshold}
                                currency={currency}
                            />
                        </section>
                    </div>

                    <div className="space-y-6">
                        {/* Images */}
                        <section className="rounded-xl border border-border bg-white p-6">
                            <h2 className="mb-4 text-sm font-bold text-brown">
                                Product Images
                            </h2>
                            <ImagePanel product={product} />
                        </section>

                        {/* Danger zone */}
                        <section className="rounded-xl border border-rose-200 bg-white p-6">
                            <h2 className="mb-1.5 text-sm font-bold text-rose-700">
                                Delete Product
                            </h2>
                            <p className="mb-4 text-xs text-muted">
                                Permanently delete this product and all
                                associated variants.
                            </p>
                            <button
                                type="button"
                                className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                                onClick={() => {
                                    if (
                                        confirm(
                                            `Delete "${product.name}"? This cannot be undone.`,
                                        )
                                    ) {
                                        router.delete(
                                            `/admin/products/${product.id}`,
                                        );
                                    }
                                }}
                            >
                                Delete Product
                            </button>
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}

ProductEdit.layout = { breadcrumbs };

/* ── Variants ─────────────────────────────────────────────────────── */

function VariantList({
    product,
    lowStockThreshold,
    currency,
}: {
    product: Product;
    lowStockThreshold: number;
    currency: string;
}) {
    const [addingVariant, setAddingVariant] = useState(false);
    const [adjustingVariant, setAdjustingVariant] = useState<number | null>(
        null,
    );

    return (
        <div className="space-y-3">
            {product.variants.length === 0 && !addingVariant && (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
                    No variants added yet. Add at least one pack size to sell
                    this product.
                </p>
            )}

            {product.variants.map((v) => (
                <VariantRow
                    key={v.id}
                    product={product}
                    variant={v}
                    lowStockThreshold={lowStockThreshold}
                    currency={currency}
                    adjusting={adjustingVariant === v.id}
                    onToggleAdjust={() =>
                        setAdjustingVariant(
                            adjustingVariant === v.id ? null : v.id,
                        )
                    }
                />
            ))}

            {addingVariant ? (
                <AddVariantForm
                    productId={product.id}
                    currency={currency}
                    onDone={() => setAddingVariant(false)}
                />
            ) : (
                <button
                    type="button"
                    className="rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-brown transition-colors hover:border-orange hover:text-orange"
                    onClick={() => setAddingVariant(true)}
                >
                    + Add Variant
                </button>
            )}
        </div>
    );
}

function VariantRow({
    product,
    variant,
    lowStockThreshold,
    currency,
    adjusting,
    onToggleAdjust,
}: {
    product: Product;
    variant: ProductVariant;
    lowStockThreshold: number;
    currency: string;
    adjusting: boolean;
    onToggleAdjust: () => void;
}) {
    const { data, setData, put, processing, errors } = useForm({
        label: variant.label,
        sku: variant.sku ?? '',
        price_minor: String(variant.price_minor),
        active: variant.active,
    });

    const isLow =
        variant.active &&
        variant.stock > 0 &&
        variant.stock <= lowStockThreshold;
    const isOut = variant.active && variant.stock === 0;

    return (
        <div className="rounded-xl border border-border bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px_130px_auto] sm:items-end">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-brown">
                        Pack Label
                    </label>
                    <input
                        className="nganzi-input h-9 w-full text-xs"
                        placeholder="e.g. 250g"
                        value={data.label}
                        onChange={(e) => setData('label', e.target.value)}
                    />
                    {errors.label && (
                        <p className="mt-0.5 text-xs text-red-600">
                            {errors.label}
                        </p>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-brown">
                        SKU
                    </label>
                    <input
                        className="nganzi-input h-9 w-full font-mono text-xs"
                        placeholder="Optional SKU"
                        value={data.sku}
                        onChange={(e) => setData('sku', e.target.value)}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-brown">
                        Price ({currency})
                    </label>
                    <input
                        type="number"
                        min="0"
                        className="nganzi-input h-9 w-full text-xs"
                        value={data.price_minor}
                        onChange={(e) => setData('price_minor', e.target.value)}
                    />
                    <p className="mt-0.5 text-[11px] text-muted">
                        {formatPrice(Number(data.price_minor) || 0, currency)}
                    </p>
                    {errors.price_minor && (
                        <p className="mt-0.5 text-xs text-red-600">
                            {errors.price_minor}
                        </p>
                    )}
                </div>

                <div className="flex flex-col justify-between pb-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-brown">
                            Stock: {variant.stock}
                        </span>
                        {isOut ? (
                            <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                                Out
                            </span>
                        ) : isLow ? (
                            <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                                Low
                            </span>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        className="mt-1 text-left text-xs font-semibold text-orange hover:underline"
                        onClick={onToggleAdjust}
                    >
                        {adjusting ? 'Close adjust' : 'Adjust stock'}
                    </button>
                </div>

                <div className="flex flex-col items-end justify-between gap-2 pb-1">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-brown">
                        <input
                            type="checkbox"
                            checked={data.active}
                            onChange={(e) =>
                                setData('active', e.target.checked)
                            }
                            className="size-3.5 accent-orange"
                        />
                        Active
                    </label>
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            className="rounded bg-orange px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-50"
                            disabled={processing}
                            onClick={() =>
                                put(
                                    `/admin/products/${product.id}/variants/${variant.id}`,
                                    {
                                        preserveScroll: true,
                                    },
                                )
                            }
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className="text-xs font-medium text-rose-600 hover:underline"
                            onClick={() => {
                                if (
                                    confirm(
                                        `Remove variant "${variant.label}"?`,
                                    )
                                ) {
                                    router.delete(
                                        `/admin/products/${product.id}/variants/${variant.id}`,
                                        {
                                            preserveScroll: true,
                                        },
                                    );
                                }
                            }}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>

            {adjusting && (
                <div className="mt-4 border-t border-border pt-4">
                    <InventoryAdjustForm
                        productId={product.id}
                        variantId={variant.id}
                        onDone={onToggleAdjust}
                    />
                </div>
            )}
        </div>
    );
}

function AddVariantForm({
    productId,
    currency,
    onDone,
}: {
    productId: number;
    currency: string;
    onDone: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        label: '',
        sku: '',
        price_minor: '0',
        stock: '0',
        active: true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/admin/products/${productId}/variants`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-border bg-white p-4"
        >
            <p className="mb-3 text-xs font-bold tracking-wider text-brown uppercase">
                New Pack Variant
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-brown">
                        Pack Label *
                    </label>
                    <input
                        required
                        placeholder="e.g. 250g"
                        className="nganzi-input h-9 w-full text-xs"
                        value={data.label}
                        onChange={(e) => setData('label', e.target.value)}
                    />
                    {errors.label && (
                        <p className="mt-0.5 text-xs text-red-600">
                            {errors.label}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-brown">
                        SKU
                    </label>
                    <input
                        placeholder="Optional SKU"
                        className="nganzi-input h-9 w-full font-mono text-xs"
                        value={data.sku}
                        onChange={(e) => setData('sku', e.target.value)}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-brown">
                        Price ({currency}) *
                    </label>
                    <input
                        type="number"
                        min="0"
                        required
                        className="nganzi-input h-9 w-full text-xs"
                        value={data.price_minor}
                        onChange={(e) => setData('price_minor', e.target.value)}
                    />
                    {errors.price_minor && (
                        <p className="mt-0.5 text-xs text-red-600">
                            {errors.price_minor}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-brown">
                        Initial Stock *
                    </label>
                    <input
                        type="number"
                        min="0"
                        required
                        className="nganzi-input h-9 w-full text-xs"
                        value={data.stock}
                        onChange={(e) => setData('stock', e.target.value)}
                    />
                    {errors.stock && (
                        <p className="mt-0.5 text-xs text-red-600">
                            {errors.stock}
                        </p>
                    )}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-orange px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-50"
                >
                    {processing ? 'Adding…' : 'Add Variant'}
                </button>
                <button
                    type="button"
                    className="rounded-lg border border-border bg-white px-3.5 py-2 text-xs font-semibold text-brown hover:border-orange"
                    onClick={onDone}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

/* ── Inventory adjustment ─────────────────────────────────────────── */

const REASONS = [
    { value: 'stock_in', label: 'Stock received' },
    { value: 'adjustment', label: 'Manual adjustment' },
    { value: 'damaged', label: 'Damaged / written off' },
    { value: 'lost', label: 'Lost' },
];

function InventoryAdjustForm({
    productId,
    variantId,
    onDone,
}: {
    productId: number;
    variantId: number;
    onDone: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        delta: '',
        reason: 'stock_in',
        note: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/admin/products/${productId}/variants/${variantId}/inventory`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs font-bold text-brown">
                Record Stock Adjustment
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">
                        Quantity Change (+ add / − remove) *
                    </label>
                    <input
                        type="number"
                        required
                        className="nganzi-input h-9 w-full text-xs"
                        placeholder="e.g. 10 or -3"
                        value={data.delta}
                        onChange={(e) => setData('delta', e.target.value)}
                    />
                    {errors.delta && (
                        <p className="mt-0.5 text-xs text-red-600">
                            {errors.delta}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">
                        Reason *
                    </label>
                    <select
                        className="nganzi-input h-9 w-full text-xs"
                        value={data.reason}
                        onChange={(e) => setData('reason', e.target.value)}
                    >
                        {REASONS.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                    {errors.reason && (
                        <p className="mt-0.5 text-xs text-red-600">
                            {errors.reason}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">
                        Note
                    </label>
                    <input
                        className="nganzi-input h-9 w-full text-xs"
                        placeholder="Batch number or reason…"
                        value={data.note}
                        onChange={(e) => setData('note', e.target.value)}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-orange px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-50"
                >
                    {processing ? 'Saving…' : 'Save Adjustment'}
                </button>
                <button
                    type="button"
                    className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-brown hover:border-orange"
                    onClick={onDone}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

/* ── Images ───────────────────────────────────────────────────────── */

function ImagePanel({ product }: { product: Product }) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        image: File | null;
        alt: string;
    }>({
        image: null,
        alt: '',
    });

    function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        post(`/admin/products/${product.id}/images`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <div className="space-y-4">
            {product.images.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
                    No product images uploaded yet.
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {product.images.map((img) => (
                        <div
                            key={img.id}
                            className="group relative overflow-hidden rounded-lg border border-border bg-white"
                        >
                            <img
                                src={`/storage/${img.path}`}
                                alt={img.alt ?? product.name}
                                className="aspect-square w-full object-cover"
                            />
                            <button
                                type="button"
                                className="absolute top-1.5 right-1.5 rounded bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
                                onClick={() => {
                                    if (confirm('Remove this image?')) {
                                        router.delete(
                                            `/admin/products/${product.id}/images/${img.id}`,
                                            {
                                                preserveScroll: true,
                                            },
                                        );
                                    }
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <form
                onSubmit={handleUpload}
                className="space-y-3 border-t border-border pt-4"
            >
                <div>
                    <label className="mb-1 block text-xs font-semibold text-brown">
                        Upload Image (JPG, PNG, WebP — max 4MB)
                    </label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brown hover:file:border-orange"
                        onChange={(e) =>
                            setData('image', e.target.files?.[0] ?? null)
                        }
                    />
                    {errors.image && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.image}
                        </p>
                    )}
                </div>
                <div>
                    <input
                        className="nganzi-input h-9 w-full text-xs"
                        placeholder="Alt text description (optional)"
                        value={data.alt}
                        onChange={(e) => setData('alt', e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={processing || !data.image}
                    className="w-full rounded-lg bg-orange py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-50"
                >
                    {processing ? 'Uploading…' : 'Upload Image'}
                </button>
            </form>
        </div>
    );
}
