export type Category = {
    id: number;
    name: string;
    slug: string;
};

export type StatusOption = {
    value: string;
    label: string;
};

export type ProductImage = {
    id: number;
    path: string;
    url?: string;
    alt: string | null;
    sort_order: number;
};

export type ProductVariant = {
    id: number;
    label: string;
    sku: string | null;
    price_minor: number;
    stock: number;
    active: boolean;
};

export type Product = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    featured: boolean;
    seo_title: string | null;
    seo_description: string | null;
    category_id: number;
    category: Category | null;
    variants: ProductVariant[];
    images: ProductImage[];
};

export type PaginatedProducts = {
    data: Product[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
};
