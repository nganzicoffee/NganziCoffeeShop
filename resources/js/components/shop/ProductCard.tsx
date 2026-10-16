import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { formatPrice } from '@/lib/price';
import type { Product, ProductVariant, ShopSharedProps } from '@/types';

type Props = {
    product: Product;
};

export default function ProductCard({ product }: Props) {
    const { shop } = usePage<{ props: ShopSharedProps }>()
        .props as unknown as ShopSharedProps;
    const currency = shop?.currency ?? 'UGX';

    const activeVariants = product.variants.filter((v) => v.active);
    const inStock = activeVariants.some((v) => v.stock > 0);
    const [selectedVariantId, setSelectedVariantId] = useState<number>(
        activeVariants.find((v) => v.stock > 0)?.id ??
            activeVariants[0]?.id ??
            0,
    );
    const [isAdding, setIsAdding] = useState(false);

    const currentVariant: ProductVariant | undefined =
        activeVariants.find((v) => v.id === selectedVariantId) ??
        activeVariants[0];

    const currentPrice = currentVariant ? currentVariant.price_minor : null;
    const currentVariantInStock = currentVariant
        ? currentVariant.stock > 0
        : false;
    const image = product.images?.[0];

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentVariant || !currentVariantInStock || isAdding) return;

        setIsAdding(true);
        router.post(
            '/cart',
            { variant_id: currentVariant.id, quantity: 1 },
            {
                preserveScroll: true,
                onFinish: () => setIsAdding(false),
            },
        );
    };

    return (
        <article className="shop-roast-card flex flex-col justify-between">
            <div>
                <Link
                    href={`/shop/${product.slug}`}
                    className="shop-roast-image group block"
                    aria-label={`View ${product.name}`}
                >
                    {image ? (
                        <img
                            src={`/storage/${image.path}`}
                            alt={image.alt ?? product.name}
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-[320px] w-full items-center justify-center bg-cream">
                            <span className="text-xs text-muted">No image</span>
                        </div>
                    )}
                </Link>

                <div className="shop-roast-copy">
                    <h3>
                        <Link
                            href={`/shop/${product.slug}`}
                            className="hover:text-orange-hover"
                        >
                            {product.name}
                        </Link>
                    </h3>

                    {/* Variant pack size options */}
                    {activeVariants.length > 0 && (
                        <div className="mt-3 mb-4">
                            <p className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                                Select Size
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {activeVariants.map((v) => {
                                    const selected =
                                        v.id === currentVariant?.id;
                                    const outOfStock = v.stock <= 0;
                                    return (
                                        <button
                                            key={v.id}
                                            type="button"
                                            disabled={outOfStock}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedVariantId(v.id);
                                            }}
                                            className={`rounded-none border px-3 py-1.5 text-xs font-bold transition-all ${
                                                selected
                                                    ? 'border-orange bg-orange text-brown'
                                                    : outOfStock
                                                      ? 'cursor-not-allowed border-border/60 bg-cream/50 text-muted/50 line-through'
                                                      : 'border-border bg-white text-brown hover:border-orange'
                                            }`}
                                        >
                                            {v.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border/70 pt-3">
                        <span className="price text-[1.15rem]">
                            {currentPrice !== null
                                ? formatPrice(currentPrice, currency)
                                : 'Price on request'}
                        </span>
                        {!inStock && (
                            <span className="badge rounded-none text-[0.65rem] text-muted">
                                Out of stock
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t border-border/80 p-4 pt-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={!currentVariantInStock || isAdding}
                        onClick={handleAddToCart}
                        className="button button-dark !min-h-[46px] w-full !gap-2 rounded-none !py-2.5 !text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isAdding
                            ? 'Adding…'
                            : currentVariantInStock
                              ? 'Add to cart'
                              : 'Sold out'}
                        <svg
                            className="arrow-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path d="M7 17 17 7M7 7h10v10" />
                        </svg>
                    </button>
                    <Link
                        href={`/shop/${product.slug}`}
                        className="inline-flex h-[46px] shrink-0 items-center justify-center rounded-none border border-border px-3.5 text-xs font-bold text-brown transition-colors hover:border-orange hover:bg-peach"
                        aria-label={`View details for ${product.name}`}
                    >
                        Details
                    </Link>
                </div>
            </div>
        </article>
    );
}
