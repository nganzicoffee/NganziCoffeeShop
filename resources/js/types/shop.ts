import type {
    Category,
    Product,
    ProductVariant,
    PaginatedProducts,
} from './admin';

export type { Category, Product, ProductVariant, PaginatedProducts };

export type ShopSharedProps = {
    shop: { currency: string; usdExchangeRate?: number };
    cartCount: number;
    flash: { toast?: { type: string; message: string } | null };
};

export type ShopProduct = Product & {
    lowestPrice: number | null;
};

export type CartItemData = {
    id: number;
    variant_id: number;
    product: {
        id: number;
        name: string;
        slug: string;
        image: string | null;
        category: string | null;
    };
    variant_label: string;
    price_minor: number;
    quantity: number;
    line_total: number;
    available: boolean;
    in_stock: boolean;
};

export type CartSummary = {
    items: CartItemData[];
    subtotal: number;
    item_count: number;
    warnings: string[];
};
