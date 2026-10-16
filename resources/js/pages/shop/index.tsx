import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ShopLayout from '@/layouts/shop/ShopLayout';
import ProductCard from '@/components/shop/ProductCard';
import type { Product, Category, ShopSharedProps } from '@/types/shop';

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    products: {
        data: Product[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
    categories: (Category & { products_count: number })[];
    activeCategory: string | null;
    filters: { search?: string; category?: string };
};

export default function ShopIndex() {
    const { products, categories, activeCategory, filters } = usePage<{
        props: Props;
    }>().props as unknown as Props;
    const { cartCount } = usePage<{ props: ShopSharedProps }>()
        .props as unknown as ShopSharedProps;
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(params: Record<string, string | undefined>) {
        const merged: Record<string, string> = {};
        for (const [k, v] of Object.entries({ ...filters, ...params })) {
            if (v !== undefined && k !== 'page') merged[k] = v;
        }
        router.get('/shop', merged, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter({ search: search || undefined });
    }

    const activeCategoryName = activeCategory
        ? categories.find((c) => c.slug === activeCategory)?.name
        : null;

    return (
        <ShopLayout bodyClassName="shop-page-body">
            <Head>
                <title>
                    {activeCategoryName
                        ? `${activeCategoryName} — Shop Nganzi Coffee`
                        : 'Shop Single-Origin Coffee & Merchandise | Nganzi Coffee'}
                </title>
                <meta
                    name="description"
                    content="Order freshly roasted single-origin Ugandan coffee online directly from our farm. No account required — simply enter your details at checkout. Also available on Made in Uganda."
                />
                <meta
                    name="keywords"
                    content="buy coffee uganda, ugandan coffee roaster, light roast, medium roast, dark roast, green coffee beans, kampala coffee delivery"
                />
                <link rel="canonical" href="/shop" />
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content={
                        activeCategoryName
                            ? `${activeCategoryName} — Shop Nganzi Coffee`
                            : 'Shop Single-Origin Coffee | Nganzi Coffee'
                    }
                />
                <meta
                    property="og:description"
                    content="Order fresh roasted Ugandan Arabica, Robusta and green coffee beans online with local doorstep delivery."
                />
                <meta
                    property="og:image"
                    content="/assets/images/crested-crane.webp"
                />
            </Head>

            {/* 1. SHOP HERO */}
            <section className="shop-page-hero">
                <img
                    className="hero-image"
                    src="/assets/images/crested-crane.webp"
                    alt="Ugandan Crested Crane over coffee highlands"
                    fetchPriority="high"
                />
                <div className="hero-overlay" />
                <div className="shop-page-intro container">
                    <h1>
                        Good coffee,{' '}
                        <span className="script-accent">from Uganda.</span>
                    </h1>
                    <div className="shop-page-actions">
                        <a className="button button-dark" href="#catalogue">
                            Order Online Below
                            <svg
                                className="arrow-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path d="M12 4v15m-6-6 6 6 6-6" />
                            </svg>
                        </a>
                        <a
                            className="button button-light"
                            href="tel:+256786707449"
                        >
                            Call to order: +256 786 707449
                        </a>
                        <a
                            className="shop-marketplace-logo"
                            href="https://www.miu.ug/shopView/575"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Visit Nganzi Coffee on Made in Uganda"
                        >
                            <img
                                src="/assets/images/logo-MIU.svg"
                                alt="Made in Uganda"
                                width={560}
                                height={226}
                            />
                        </a>
                    </div>
                </div>
            </section>

            {/* 2. ORDER ONLINE CATALOGUE SECTION */}
            <section
                className="shop-roasts section-padding"
                id="catalogue"
                aria-labelledby="shop-roasts-heading"
            >
                <div className="container">
                    <div className="section-heading">
                        <div>
                            <h2 id="shop-roasts-heading">
                                Coffee for every{' '}
                                <span className="script-accent">ritual.</span>
                            </h2>
                            <p className="mt-2 text-muted">
                                Select a pack size and click &ldquo;Add to
                                cart&rdquo; to place your order directly through
                                our store. No login or password required.
                            </p>
                        </div>

                        {cartCount > 0 && (
                            <Link
                                href="/cart"
                                className="button button-dark desktop-link !min-h-[46px] rounded-none !py-2.5"
                            >
                                View Cart ({cartCount})
                                <svg
                                    className="arrow-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path d="M7 17 17 7M7 7h10v10" />
                                </svg>
                            </Link>
                        )}
                    </div>

                    {/* Filters & Search Bar */}
                    <div className="mb-10 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
                        <nav
                            className="flex flex-wrap gap-2"
                            aria-label="Filter by category"
                        >
                            <Link
                                href="/shop"
                                className={`rounded-none border px-4 py-2 text-sm font-semibold transition-all ${
                                    !activeCategory
                                        ? 'border-orange bg-orange text-brown'
                                        : 'border-border bg-white text-brown hover:border-orange hover:bg-cream'
                                }`}
                                preserveState
                                preserveScroll
                            >
                                All Coffee
                            </Link>
                            {categories
                                .filter((c) => c.products_count > 0)
                                .map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/shop?category=${cat.slug}`}
                                        className={`rounded-none border px-4 py-2 text-sm font-semibold transition-all ${
                                            activeCategory === cat.slug
                                                ? 'border-orange bg-orange text-brown'
                                                : 'border-border bg-white text-brown hover:border-orange hover:bg-cream'
                                        }`}
                                        preserveState
                                        preserveScroll
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                        </nav>

                        <form
                            onSubmit={handleSearch}
                            className="flex w-full flex-wrap gap-2 md:w-auto"
                        >
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search roasts…"
                                className="nganzi-input min-w-0 flex-1 rounded-none text-sm md:w-[220px] md:flex-none"
                                aria-label="Search products"
                            />
                            <button
                                type="submit"
                                className="button button-dark !min-h-[46px] rounded-none !px-5 !py-2.5 !text-sm"
                            >
                                Search
                            </button>
                            {(filters.search || activeCategory) && (
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center justify-center rounded-none border border-border bg-white px-4 py-2.5 text-sm font-semibold text-brown transition-colors hover:border-orange hover:bg-cream"
                                    preserveScroll
                                >
                                    Reset
                                </Link>
                            )}
                        </form>
                    </div>

                    {/* Live Product Grid */}
                    {products.data.length > 0 ? (
                        <div>
                            <div className="shop-roast-grid">
                                {products.data.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </div>

                            {products.last_page > 1 && (
                                <nav
                                    className="mt-14 flex flex-wrap items-center justify-center gap-2"
                                    aria-label="Pagination"
                                >
                                    {products.links.map((link, i) => (
                                        <PaginationButton key={i} link={link} />
                                    ))}
                                </nav>
                            )}
                        </div>
                    ) : (
                        <div className="border border-border bg-cream/50 py-16 text-center">
                            <p className="mb-2 text-lg font-semibold text-brown">
                                No matching products found
                            </p>
                            <p className="text-muted">
                                {filters.search
                                    ? `No results for "${filters.search}". Try a different search term.`
                                    : 'There are no published products in this category right now.'}
                            </p>
                            <Link
                                href="/shop"
                                className="button button-dark mt-6"
                            >
                                View all coffee
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* 3. MULTI-AVENUE ORDERING & INTERNATIONAL SECTION */}
            <section className="shop-order-options" aria-label="How to order">
                <div className="shop-order-grid container">
                    {/* Within Uganda Avenue */}
                    <article className="shop-order-card">
                        <img
                            className="shop-order-card-image"
                            src="/assets/images/coffee-origin.webp"
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                        />
                        <h2>
                            Ordering within{' '}
                            <span className="script-accent">Uganda?</span>
                        </h2>
                        <p>
                            Order directly through this website above with
                            hassle-free guest checkout, purchase through our
                            verified Made in Uganda store, or call our team
                            directly.
                        </p>
                        <div className="shop-order-actions">
                            <a
                                className="button button-dark rounded-none"
                                href="#catalogue"
                            >
                                Order directly online
                                <svg
                                    className="arrow-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path d="M7 17 17 7M7 7h10v10" />
                                </svg>
                            </a>
                            <a
                                className="button button-light rounded-none"
                                href="https://www.miu.ug/shopView/575"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Made in Uganda
                                <svg
                                    className="arrow-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path d="M7 17 17 7M7 7h10v10" />
                                </svg>
                            </a>
                            <a className="text-link" href="tel:+256786707449">
                                Call +256 786 707449
                            </a>
                        </div>
                    </article>

                    {/* Outside Uganda / International Avenue */}
                    <article className="shop-order-card shop-international-card">
                        <img
                            className="shop-order-card-image"
                            src="/assets/images/overseas.webp"
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                        />
                        <h2>
                            Ordering from{' '}
                            <span className="script-accent">abroad?</span>
                        </h2>
                        <p>
                            You can place an order directly through our website
                            above by providing your destination country and
                            contact details. Our team will coordinate
                            international delivery with you. You can also reach
                            out to us by email.
                        </p>
                        <div className="shop-order-actions">
                            <a
                                className="button button-dark rounded-none"
                                href="#catalogue"
                            >
                                Place order above
                                <svg
                                    className="arrow-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path d="M7 17 17 7M7 7h10v10" />
                                </svg>
                            </a>
                            <a
                                className="button button-light rounded-none"
                                href="mailto:nganzicoffeeug@gmail.com?subject=International%20coffee%20order"
                            >
                                Email us directly
                                <svg
                                    className="arrow-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path d="M7 17 17 7M7 7h10v10" />
                                </svg>
                            </a>
                        </div>
                    </article>
                </div>
            </section>

            {/* Sticky Floating Cart Indicator on Mobile / Tablet if Cart Has Items */}
            {cartCount > 0 && (
                <div className="fixed right-6 bottom-6 z-40">
                    <Link
                        href="/cart"
                        className="button button-dark flex items-center gap-3 rounded-none border border-brown/20 shadow-2xl transition-transform hover:scale-105"
                    >
                        <span>Cart</span>
                        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-none bg-white px-1.5 text-xs font-bold text-brown">
                            {cartCount}
                        </span>
                        <span>Checkout</span>
                        <svg
                            className="arrow-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path d="M7 17 17 7M7 7h10v10" />
                        </svg>
                    </Link>
                </div>
            )}
        </ShopLayout>
    );
}

function PaginationButton({ link }: { link: PaginationLink }) {
    if (!link.url) {
        return (
            <span
                className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-none px-3 text-sm text-muted"
                dangerouslySetInnerHTML={{ __html: link.label }}
            />
        );
    }

    return (
        <Link
            href={link.url}
            className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-none px-3 text-sm font-medium transition-colors ${
                link.active
                    ? 'bg-orange text-brown'
                    : 'border border-border text-brown hover:bg-peach'
            }`}
            preserveState
            dangerouslySetInnerHTML={{ __html: link.label }}
        />
    );
}
