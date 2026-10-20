import { Head, Link, router, usePage } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop/ShopLayout';
import ProductCard from '@/components/shop/ProductCard';
import ShopPrice from '@/components/shop/ShopPrice';
import type { Product, ProductVariant, ShopSharedProps } from '@/types/shop';
import { useState } from 'react';

type Props = {
    product: Product;
    related: Product[];
};

export default function ProductShow() {
    const { product, related } = usePage<{ props: Props }>()
        .props as unknown as Props;
    const { shop } = usePage<{ props: ShopSharedProps }>()
        .props as unknown as ShopSharedProps;
    const currency = shop?.currency ?? 'UGX';

    const activeVariants = product.variants.filter((v) => v.active);
    const [selectedVariant, setSelectedVariant] =
        useState<ProductVariant | null>(activeVariants[0] ?? null);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);

    const inStock = selectedVariant ? selectedVariant.stock > 0 : false;
    const maxQty = selectedVariant ? Math.min(selectedVariant.stock, 10) : 1;

    const mainImage = product.images?.[0];
    const [activeImage, setActiveImage] = useState(mainImage);

    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description:
            product.description ||
            product.seo_description ||
            'Single-origin Ugandan coffee by Nganzi Coffee.',
        image: product.images?.map((i) => i.url || `/storage/${i.path}`) ?? [],
        brand: {
            '@type': 'Brand',
            name: 'Nganzi Coffee',
        },
        category: product.category?.name,
        offers: selectedVariant
            ? {
                  '@type': 'Offer',
                  priceCurrency: currency,
                  price:
                      currency === 'UGX'
                          ? String(selectedVariant.price_minor)
                          : (selectedVariant.price_minor / 100).toFixed(2),
                  availability: inStock
                      ? 'https://schema.org/InStock'
                      : 'https://schema.org/OutOfStock',
                  url: `/shop/${product.slug}`,
                  itemCondition: 'https://schema.org/NewCondition',
              }
            : undefined,
    };

    return (
        <ShopLayout>
            <Head>
                <title>
                    {product.seo_title ?? product.name} — Nganzi Coffee
                </title>
                {product.seo_description && (
                    <meta
                        name="description"
                        content={product.seo_description}
                    />
                )}
                <link rel="canonical" href={`/shop/${product.slug}`} />
                <meta property="og:type" content="product" />
                <meta
                    property="og:title"
                    content={`${product.seo_title ?? product.name} — Nganzi Coffee`}
                />
                <meta
                    property="og:description"
                    content={
                        product.seo_description ||
                        product.description?.slice(0, 160) ||
                        'Single-origin Ugandan coffee.'
                    }
                />
                {mainImage && (
                    <meta
                        property="og:image"
                        content={mainImage.url || `/storage/${mainImage.path}`}
                    />
                )}
                <script type="application/ld+json">
                    {JSON.stringify(productJsonLd)}
                </script>
            </Head>

            {/* Breadcrumb */}
            <div className="bg-cream pt-[120px]">
                <nav className="nganzi-container" aria-label="Breadcrumb">
                    <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
                        <li>
                            <Link href="/" className="hover:text-orange-hover">
                                Home
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li>
                            <Link
                                href="/shop"
                                className="hover:text-orange-hover"
                            >
                                Shop
                            </Link>
                        </li>
                        {product.category && (
                            <>
                                <li aria-hidden="true">/</li>
                                <li>
                                    <Link
                                        href={`/shop?category=${product.category.slug}`}
                                        className="hover:text-orange-hover"
                                    >
                                        {product.category.name}
                                    </Link>
                                </li>
                            </>
                        )}
                        <li aria-hidden="true">/</li>
                        <li
                            className="font-semibold text-brown"
                            aria-current="page"
                        >
                            {product.name}
                        </li>
                    </ol>
                </nav>
            </div>

            {/* Product detail */}
            <section className="section-padding bg-cream">
                <div className="nganzi-container">
                    <div className="grid items-stretch gap-8 md:grid-cols-2 lg:gap-12">
                        {/* Images */}
                        <div className="flex h-full flex-col justify-between border border-border bg-paper p-6 sm:p-8">
                            <div className="flex h-[320px] w-full items-center justify-center overflow-hidden bg-cream p-6 sm:h-[400px]">
                                {activeImage ? (
                                    <img
                                        src={
                                            activeImage.url ??
                                            `/storage/${activeImage.path}`
                                        }
                                        alt={activeImage.alt ?? product.name}
                                        className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <span className="text-sm text-muted">
                                            No image available
                                        </span>
                                    </div>
                                )}
                            </div>
                            {product.images.length > 1 && (
                                <div className="mt-4 flex gap-3 overflow-x-auto pt-2">
                                    {product.images.map((img) => (
                                        <button
                                            key={img.id}
                                            type="button"
                                            onClick={() => setActiveImage(img)}
                                            className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border-2 bg-cream p-1.5 transition-colors ${
                                                activeImage?.id === img.id
                                                    ? 'border-orange'
                                                    : 'border-border hover:border-orange/60'
                                            }`}
                                            aria-label={`View ${img.alt ?? 'product image'}`}
                                        >
                                            <img
                                                src={
                                                    img.url ??
                                                    `/storage/${img.path}`
                                                }
                                                alt={img.alt ?? product.name}
                                                className="max-h-full max-w-full object-contain mix-blend-multiply"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex h-full flex-col justify-between border border-border bg-paper p-6 sm:p-8">
                            <div>
                                <h1
                                    className="mb-4 text-brown"
                                    style={{
                                        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                                    }}
                                >
                                    {product.name}
                                </h1>

                                {/* Price */}
                                {selectedVariant && (
                                    <p className="price mb-6 text-[1.4rem]">
                                        <ShopPrice
                                            amount={selectedVariant.price_minor}
                                            currency={currency}
                                        />
                                    </p>
                                )}

                                {/* Description */}
                                <div className="mb-8 min-h-[4.5rem] leading-relaxed text-muted">
                                    <p>
                                        {product.description ||
                                            'Single-origin Ugandan coffee roasted for rich aroma and balanced flavour.'}
                                    </p>
                                </div>

                                {/* Variant selector */}
                                {activeVariants.length > 1 && (
                                    <fieldset className="mb-6">
                                        <legend className="nganzi-label">
                                            Size
                                        </legend>
                                        <div className="flex flex-wrap gap-2">
                                            {activeVariants.map((v) => (
                                                <button
                                                    key={v.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedVariant(v);
                                                        setQuantity(1);
                                                    }}
                                                    className={`rounded-none border px-4 py-2 text-sm font-semibold transition-all ${
                                                        selectedVariant?.id ===
                                                        v.id
                                                            ? 'border-orange bg-orange text-brown'
                                                            : 'border-border bg-white text-brown hover:border-orange'
                                                    } ${v.stock <= 0 ? 'line-through opacity-50' : ''}`}
                                                    disabled={v.stock <= 0}
                                                    aria-pressed={
                                                        selectedVariant?.id ===
                                                        v.id
                                                    }
                                                >
                                                    {v.label}
                                                    {v.stock <= 0 &&
                                                        ' — Sold out'}
                                                </button>
                                            ))}
                                        </div>
                                    </fieldset>
                                )}
                            </div>

                            <div className="mt-auto border-t border-border pt-6">
                                {/* Quantity + Add to cart */}
                                {selectedVariant && inStock && (
                                    <div className="mb-6 flex flex-wrap items-end gap-4">
                                        <div>
                                            <label
                                                htmlFor="qty"
                                                className="nganzi-label"
                                            >
                                                Quantity
                                            </label>
                                            <select
                                                id="qty"
                                                value={quantity}
                                                onChange={(e) =>
                                                    setQuantity(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="nganzi-input w-20 rounded-none text-sm"
                                            >
                                                {Array.from(
                                                    { length: maxQty },
                                                    (_, i) => i + 1,
                                                ).map((n) => (
                                                    <option key={n} value={n}>
                                                        {n}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            className="button button-dark !min-h-[48px] rounded-none !px-8 !py-3 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={!inStock || adding}
                                            onClick={() => {
                                                if (!selectedVariant) return;
                                                setAdding(true);
                                                router.post(
                                                    '/cart',
                                                    {
                                                        variant_id:
                                                            selectedVariant.id,
                                                        quantity,
                                                    },
                                                    {
                                                        preserveScroll: true,
                                                        onFinish: () =>
                                                            setAdding(false),
                                                    },
                                                );
                                            }}
                                        >
                                            {adding ? 'Adding…' : 'Add to cart'}
                                            <svg
                                                className="arrow-icon"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                aria-hidden="true"
                                            >
                                                <path d="M7 17 17 7M7 7h10v10" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Stock status */}
                                {selectedVariant && !inStock && (
                                    <div className="alert mb-6 rounded-none">
                                        This variant is currently out of stock.
                                    </div>
                                )}

                                {activeVariants.length === 0 && (
                                    <div className="alert mb-6 rounded-none">
                                        This product is currently unavailable.
                                    </div>
                                )}

                                {/* Delivery note */}
                                <p className="text-sm text-muted">
                                    <Link
                                        href="/delivery"
                                        className="underline hover:text-orange-hover"
                                    >
                                        Delivery information
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related products */}
            {related.length > 0 && (
                <section className="section-padding bg-peach">
                    <div className="container">
                        <div className="section-heading mb-10">
                            <div>
                                <h2>
                                    You might also{' '}
                                    <span className="script-accent">like.</span>
                                </h2>
                            </div>
                        </div>
                        <div className="shop-roast-grid">
                            {related.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </ShopLayout>
    );
}
