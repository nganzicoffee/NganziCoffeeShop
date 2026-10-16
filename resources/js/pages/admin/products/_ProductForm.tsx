import { useForm } from '@inertiajs/react';
import type { Category, Product, StatusOption } from '@/types';

type FormData = {
    name: string;
    slug: string;
    category_id: string;
    description: string;
    status: string;
    featured: boolean;
    seo_title: string;
    seo_description: string;
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
        description: product?.description ?? '',
        status: product?.status ?? 'draft',
        featured: product?.featured ?? false,
        seo_title: product?.seo_title ?? '',
        seo_description: product?.seo_description ?? '',
    });

    function autoSlug(name: string) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        submit(method, action, { preserveScroll: true });
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
