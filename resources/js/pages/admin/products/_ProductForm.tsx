import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { Category, Product, StatusOption } from '@/types';

type FormData = {
    name: string;
    slug: string;
    category_id: string;
    category_name: string;
    description: string;
    status: string;
    featured: boolean;
    seo_title: string;
    seo_description: string;
    variants: Array<{ label: string; price_minor: string; stock: string }>;
    front_image: File | null;
    back_image: File | null;
};

type Props = {
    product?: Product;
    categories: Category[];
    statuses: StatusOption[];
    action: string;
    method?: 'post' | 'put';
};

export default function ProductForm({
    product,
    categories,
    statuses,
    action,
    method = 'post',
}: Props) {
    const { data, setData, submit, processing, errors } = useForm<FormData>({
        name: product?.name ?? '',
        slug: product?.slug ?? '',
        category_id: String(product?.category_id ?? ''),
        category_name: '',
        description: product?.description ?? '',
        status: product?.status ?? 'draft',
        featured: product?.featured ?? false,
        seo_title: product?.seo_title ?? '',
        seo_description: product?.seo_description ?? '',
        variants: [{ label: '', price_minor: '', stock: '' }],
        front_image: null,
        back_image: null,
    });
    const fieldErrors = errors as Record<string, string | undefined>;

    function autoSlug(name: string) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        submit(method, action, {
            preserveScroll: true,
            forceFormData: !product,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label
                        className="mb-1 block text-xs font-semibold text-brown"
                        htmlFor="name"
                    >
                        Product Name
                    </label>
                    <input
                        id="name"
                        required
                        className="nganzi-input h-9 w-full text-xs"
                        placeholder="e.g. Mt. Elgon Medium Roast"
                        value={data.name}
                        onChange={(e) => {
                            setData('name', e.target.value);
                            if (!product)
                                setData('slug', autoSlug(e.target.value));
                        }}
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        className="mb-1 block text-xs font-semibold text-brown"
                        htmlFor="slug"
                    >
                        URL Slug
                    </label>
                    <input
                        id="slug"
                        required
                        className="nganzi-input h-9 w-full font-mono text-xs"
                        placeholder="mt-elgon-medium-roast"
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                    />
                    {errors.slug && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.slug}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label
                        className="mb-1 block text-xs font-semibold text-brown"
                        htmlFor="category_id"
                    >
                        Category
                    </label>
                    <select
                        id="category_id"
                        className="nganzi-input h-9 w-full text-xs"
                        value={data.category_id}
                        onChange={(e) => setData('category_id', e.target.value)}
                    >
                        <option value="">Select category…</option>
                        {categories.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {errors.category_id && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.category_id}
                        </p>
                    )}
                    {!product && !data.category_id && (
                        <div className="mt-3">
                            <label
                                htmlFor="category_name"
                                className="mb-1 block text-xs font-semibold text-brown"
                            >
                                New category name
                            </label>
                            <input
                                id="category_name"
                                className="nganzi-input w-full"
                                placeholder="e.g. Roasted coffee"
                                required
                                value={data.category_name}
                                onChange={(event) =>
                                    setData('category_name', event.target.value)
                                }
                            />
                            <p className="mt-1 text-xs text-muted">
                                Select an existing category above, or create one
                                here.
                            </p>
                            {errors.category_name && (
                                <p className="text-xs text-red-600">
                                    {errors.category_name}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label
                        className="mb-1 block text-xs font-semibold text-brown"
                        htmlFor="status"
                    >
                        Status
                    </label>
                    <select
                        id="status"
                        className="nganzi-input h-9 w-full text-xs"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                    >
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    {errors.status && (
                        <p className="mt-1 text-xs text-red-600">
                            {errors.status}
                        </p>
                    )}
                </div>
            </div>

            <div>
                <label
                    className="mb-1 block text-xs font-semibold text-brown"
                    htmlFor="description"
                >
                    Description
                </label>
                <textarea
                    id="description"
                    rows={4}
                    className="nganzi-input w-full text-xs"
                    placeholder="Origin notes, roast profile, and brewing guidance…"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                />
                {errors.description && (
                    <p className="mt-1 text-xs text-red-600">
                        {errors.description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 pt-1">
                <input
                    id="featured"
                    type="checkbox"
                    checked={data.featured}
                    onChange={(e) => setData('featured', e.target.checked)}
                    className="size-4 accent-orange"
                />
                <label
                    htmlFor="featured"
                    className="text-xs font-medium text-brown"
                >
                    Feature on storefront homepage
                </label>
            </div>

            {!product && (
                <>
                    <div className="space-y-3">
                        {data.variants.map((variant, index) => (
                            <div key={index} className="space-y-2">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {(
                                        [
                                            'label',
                                            'price_minor',
                                            'stock',
                                        ] as const
                                    ).map((field) => (
                                        <label
                                            key={field}
                                            className="grid gap-1 text-xs font-semibold text-brown"
                                        >
                                            {field === 'label'
                                                ? 'Pack size'
                                                : field === 'price_minor'
                                                  ? 'Price per pack (UGX)'
                                                  : 'Packs in stock'}
                                            <input
                                                className="nganzi-input h-9 w-full text-xs font-normal"
                                                type={
                                                    field === 'label'
                                                        ? 'text'
                                                        : 'number'
                                                }
                                                min="0"
                                                step="1"
                                                required
                                                maxLength={
                                                    field === 'label'
                                                        ? 100
                                                        : undefined
                                                }
                                                placeholder={
                                                    field === 'label'
                                                        ? 'e.g. 250g'
                                                        : field ===
                                                            'price_minor'
                                                          ? '25000'
                                                          : '30'
                                                }
                                                value={variant[field]}
                                                onChange={(event) =>
                                                    setData(
                                                        'variants',
                                                        data.variants.map(
                                                            (row, rowIndex) =>
                                                                rowIndex ===
                                                                index
                                                                    ? {
                                                                          ...row,
                                                                          [field]:
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : row,
                                                        ),
                                                    )
                                                }
                                            />
                                            {fieldErrors[
                                                `variants.${index}.${field}`
                                            ] && (
                                                <span className="text-red-600">
                                                    {
                                                        fieldErrors[
                                                            `variants.${index}.${field}`
                                                        ]
                                                    }
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                {data.variants.length > 1 && (
                                    <button
                                        type="button"
                                        className="text-xs underline"
                                        onClick={() =>
                                            setData(
                                                'variants',
                                                data.variants.filter(
                                                    (_, rowIndex) =>
                                                        rowIndex !== index,
                                                ),
                                            )
                                        }
                                    >
                                        Remove pack size
                                    </button>
                                )}
                            </div>
                        ))}
                        {errors.variants && (
                            <p className="text-xs text-red-600">
                                {errors.variants}
                            </p>
                        )}
                        <button
                            type="button"
                            disabled={data.variants.length >= 20}
                            className="rounded border border-border px-3 py-2 text-xs"
                            onClick={() =>
                                setData('variants', [
                                    ...data.variants,
                                    { label: '', price_minor: '', stock: '' },
                                ])
                            }
                        >
                            + Add pack size
                        </button>
                    </div>
                    <div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <ImageUploadField
                                label="Front / normal image"
                                file={data.front_image}
                                error={errors.front_image}
                                onChange={(file) =>
                                    setData('front_image', file)
                                }
                            />
                            <ImageUploadField
                                label="Back / hover image (optional)"
                                file={data.back_image}
                                error={errors.back_image}
                                onChange={(file) => setData('back_image', file)}
                            />
                        </div>
                    </div>
                </>
            )}

            <details className="rounded-lg border border-border bg-white p-3.5">
                <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-brown">
                    Search Engine Metadata (Optional)
                </summary>
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                    <div>
                        <label
                            className="mb-1 block text-xs font-semibold text-brown"
                            htmlFor="seo_title"
                        >
                            SEO Title
                        </label>
                        <input
                            id="seo_title"
                            className="nganzi-input h-9 w-full text-xs"
                            value={data.seo_title}
                            onChange={(e) =>
                                setData('seo_title', e.target.value)
                            }
                        />
                    </div>
                    <div>
                        <label
                            className="mb-1 block text-xs font-semibold text-brown"
                            htmlFor="seo_description"
                        >
                            SEO Description
                        </label>
                        <textarea
                            id="seo_description"
                            rows={2}
                            className="nganzi-input w-full text-xs"
                            value={data.seo_description}
                            onChange={(e) =>
                                setData('seo_description', e.target.value)
                            }
                        />
                    </div>
                </div>
            </details>

            <div className="flex items-center gap-3 pt-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-orange px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-50"
                >
                    {processing
                        ? 'Saving…'
                        : product
                          ? 'Save Changes'
                          : 'Create Product'}
                </button>
            </div>
        </form>
    );
}

function ImageUploadField({
    label,
    file,
    error,
    onChange,
}: {
    label: string;
    file: File | null;
    error?: string;
    onChange: (file: File | null) => void;
}) {
    const [preview, setPreview] = useState('');
    useEffect(() => {
        if (!file) {
            setPreview('');
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    return (
        <label className="grid content-start gap-1 text-xs font-semibold text-brown">
            {label}
            {preview && (
                <img
                    src={preview}
                    alt={`${label} preview`}
                    className="h-40 w-full bg-cream object-contain"
                />
            )}
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => onChange(event.target.files?.[0] ?? null)}
                className="nganzi-input w-full text-xs font-normal file:mr-3 file:border-0 file:bg-transparent file:text-xs file:text-brown"
            />
            <span className="font-normal text-muted">
                JPG, PNG or WebP; up to 4 MB.
            </span>
            {error && <span className="text-red-600">{error}</span>}
        </label>
    );
}
