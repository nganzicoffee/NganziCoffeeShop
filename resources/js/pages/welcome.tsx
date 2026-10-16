import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import ShopLayout from '@/layouts/shop/ShopLayout';

export default function Welcome() {
    const gridRef = useRef<HTMLDivElement>(null);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(true);

    const updateCarouselState = () => {
        const el = gridRef.current;
        if (!el) return;
        const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
        setCanScrollPrev(el.scrollLeft > 8);
        setCanScrollNext(el.scrollLeft < maxScrollLeft - 8);
    };

    useEffect(() => {
        updateCarouselState();
        const el = gridRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateCarouselState, { passive: true });
        window.addEventListener('resize', updateCarouselState);
        return () => {
            el.removeEventListener('scroll', updateCarouselState);
            window.removeEventListener('resize', updateCarouselState);
        };
    }, []);

    const scrollCarousel = (direction: -1 | 1) => {
        const el = gridRef.current;
        if (!el) return;
        const firstCard = el.querySelector<HTMLElement>('.product-card');
        const step = firstCard
            ? firstCard.getBoundingClientRect().width + 26
            : el.clientWidth * 0.8;
        el.scrollBy({ left: direction * step, behavior: 'smooth' });
    };

    return (
        <ShopLayout>
            <Head>
                <title>
                    Nganzi Coffee — Single-Origin Ugandan Coffee & Artisanal
                    Roasts
                </title>
                <meta
                    name="description"
                    content="Discover bold, aromatic single-origin coffee from Uganda's volcanic highlands. Hand-picked at Komurubuga Farm and small-batch roasted in Kampala. Shop Light, Medium, Dark roasts and raw green beans online."
                />
                <meta
                    name="keywords"
                    content="ugandan coffee, single origin coffee, specialty coffee uganda, robusta coffee, arabica coffee, buy coffee online uganda, nganzi coffee, kampala coffee roasters"
                />
                <link rel="canonical" href="/" />
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="Nganzi Coffee — Single-Origin Ugandan Coffee & Artisanal Roasts"
                />
                <meta
                    property="og:description"
                    content="Discover bold, aromatic single-origin coffee from Uganda's volcanic highlands. Hand-picked at Komurubuga Farm and small-batch roasted in Kampala."
                />
                <meta
                    property="og:image"
                    content="/assets/images/coffee-bag.webp"
                />
            </Head>

            {/* 1. HERO */}
            <section className="hero" id="home">
                <img
                    className="hero-image"
                    src="/assets/images/hero-2.webp"
                    alt="Coffee growing in the Ugandan highlands"
                    fetchPriority="high"
                />

                <div className="hero-overlay" />

                <div className="hero-content container">
                    <h1>
                        Roasted coffee.
                        <br />
                        With African{' '}
                        <span className="script-accent">soul.</span>
                    </h1>

                    <p className="hero-description">
                        Discover bold, aromatic coffee inspired by African
                        heritage and crafted for your everyday rituals.
                    </p>

                    <Link href="/coffee" className="button button-light">
                        Explore Our Coffee
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

                <div className="hero-bottom container">
                    <p className="hero-social-label">Follow our journey</p>
                    <nav
                        className="hero-social-links"
                        aria-label="Nganzi Coffee social media"
                    >
                        <a
                            href="https://x.com/nganzicoffee"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Nganzi Coffee on X"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-7.4L5.5 22H2.4l7.3-8.4L1.9 2h6.5l4.4 6.9L18.9 2Zm-1.1 18h1.7L7.4 3.9H5.6L17.8 20Z" />
                            </svg>
                        </a>
                        <a
                            href="https://www.instagram.com/nganzicoffee/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Nganzi Coffee on Instagram"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="5"
                                />
                                <circle cx="12" cy="12" r="4" />
                                <circle
                                    className="social-icon-fill"
                                    cx="17.5"
                                    cy="6.8"
                                    r="1"
                                />
                            </svg>
                        </a>
                        <a
                            href="https://www.tiktok.com/@nganzicoffee"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Nganzi Coffee on TikTok"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M14 3v11.2a4.2 4.2 0 1 1-3.6-4.1v3.2a1.2 1.2 0 1 0 .6 1V3h3c.2 2.2 1.5 3.7 4 4v3.1A8 8 0 0 1 14 8.5" />
                            </svg>
                        </a>
                        <a
                            href="https://www.youtube.com/@nganzicoffee"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Nganzi Coffee on YouTube"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M22 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.5a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.5a2.5 2.5 0 0 0 1.8-1.8C22 15.2 22 12 22 12Z" />
                                <path
                                    className="social-icon-cutout"
                                    d="m10 15 5-3-5-3v6Z"
                                />
                            </svg>
                        </a>
                        <a
                            href="https://www.linkedin.com/company/nganzicoffee/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Nganzi Coffee on LinkedIn"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M5.2 8.5H2V22h3.2V8.5ZM3.6 2A1.9 1.9 0 1 0 3.6 5.8 1.9 1.9 0 0 0 3.6 2ZM22 13.8c0-4.1-2.2-6-5.2-6a4.5 4.5 0 0 0-4 2.2V8.5H9.6V22h3.2v-6.7c0-1.8.3-3.6 2.6-3.6s2.4 2.1 2.4 3.7V22H22v-8.2Z" />
                            </svg>
                        </a>
                    </nav>
                </div>
            </section>

            {/* 2. ABOUT US */}
            <section className="about section-padding" id="about">
                <div className="about-grid container">
                    <div className="about-label" aria-hidden="true" />

                    <div className="about-copy">
                        <h2>
                            From Uganda’s highlands, every cup carries a{' '}
                            <span className="script-accent">story.</span>
                        </h2>

                        <p>
                            Our journey begins in the high-altitude terrain of
                            Western Uganda. Here, coffee is cultural memory,
                            daily warmth, and shared energy.
                        </p>
                    </div>

                    <div className="about-image-wrap">
                        <p className="about-image-label">Rooted in Uganda</p>
                        <img
                            src="/assets/images/coffee-origin.webp"
                            alt="Coffee cherries and the coffee-growing landscape"
                            loading="lazy"
                        />
                    </div>

                    <p className="about-note">
                        Discover the people, inspiration and passion behind
                        every Nganzi Coffee experience.
                    </p>
                    <div className="about-rule" aria-hidden="true" />
                    <Link href="/about" className="text-link about-link">
                        Learn More
                        <svg
                            className="arrow-icon arrow-right"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path d="M4 12h15m-6-6 6 6-6 6" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* 3. FEATURED COFFEE */}
            <section className="coffee-section section-padding" id="coffee">
                <div className="container">
                    <div className="section-heading">
                        <div>
                            <h2>Explore coffee for every ritual.</h2>
                        </div>

                        <Link href="/coffee" className="text-link desktop-link">
                            All Coffee
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

                    <div className="product-carousel" data-product-carousel>
                        <button
                            className="product-carousel-arrow product-carousel-arrow-previous"
                            type="button"
                            aria-label="Scroll to previous coffee"
                            aria-controls="featured-coffee-products"
                            disabled={!canScrollPrev}
                            onClick={() => scrollCarousel(-1)}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>
                        <div
                            ref={gridRef}
                            className="product-grid"
                            id="featured-coffee-products"
                            tabIndex={0}
                            aria-label="Featured coffee products"
                        >
                            <article className="product-card">
                                <Link
                                    href="/coffee#light-roast"
                                    className="product-image"
                                >
                                    <img
                                        src="/assets/images/light-roast.webp"
                                        alt="Nganzi Light Roast coffee"
                                        loading="lazy"
                                    />
                                </Link>
                                <div className="product-info">
                                    <h3>Light Roast</h3>
                                    <p>A bright and delicate everyday brew.</p>
                                    <Link
                                        href="/coffee#light-roast"
                                        className="text-link"
                                    >
                                        View Coffee
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
                            </article>

                            <article className="product-card">
                                <Link
                                    href="/coffee#medium-roast"
                                    className="product-image"
                                >
                                    <img
                                        src="/assets/images/medium-roast.webp"
                                        alt="Nganzi Medium Roast coffee"
                                        loading="lazy"
                                    />
                                </Link>
                                <div className="product-info">
                                    <h3>Medium Roast</h3>
                                    <p>A balanced cup for everyday rituals.</p>
                                    <Link
                                        href="/coffee#medium-roast"
                                        className="text-link"
                                    >
                                        View Coffee
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
                            </article>

                            <article className="product-card">
                                <Link
                                    href="/coffee#dark-roast"
                                    className="product-image"
                                >
                                    <img
                                        src="/assets/images/dark-roast.webp"
                                        alt="Nganzi Dark Roast coffee"
                                        loading="lazy"
                                    />
                                </Link>
                                <div className="product-info">
                                    <h3>Dark Roast</h3>
                                    <p>
                                        A bold flavour for a richer experience.
                                    </p>
                                    <Link
                                        href="/coffee#dark-roast"
                                        className="text-link"
                                    >
                                        View Coffee
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
                            </article>

                            <article className="product-card">
                                <Link
                                    href="/coffee#raw-coffee-beans"
                                    className="product-image"
                                >
                                    <img
                                        src="/assets/images/raw-beans.webp"
                                        alt="Bag of raw green coffee beans"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </Link>
                                <div className="product-info">
                                    <h3>Raw Coffee Beans</h3>
                                    <p>
                                        Available in Robusta and Arabica
                                        varieties.
                                    </p>
                                    <Link
                                        href="/coffee#raw-coffee-beans"
                                        className="text-link"
                                    >
                                        Explore Green Coffee
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
                            </article>
                        </div>
                        <button
                            className="product-carousel-arrow product-carousel-arrow-next"
                            type="button"
                            aria-label="Scroll to next coffee"
                            aria-controls="featured-coffee-products"
                            disabled={!canScrollNext}
                            onClick={() => scrollCarousel(1)}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* 4. SHOP CTA */}
            <section className="shop-cta">
                <div className="shop-cta-inner container">
                    <div className="shop-cta-content">
                        <h2>
                            Find your kind of{' '}
                            <span className="script-accent">coffee.</span>
                        </h2>
                        <p>
                            Discover our coffee, merchandise and gift bundles.
                        </p>

                        <Link href="/shop" className="button button-dark">
                            Shop Nganzi
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

                    <img
                        className="shop-cta-illustration"
                        src="/assets/illustrations/coffee-package.webp"
                        alt="Nganzi coffee package"
                        decoding="async"
                    />
                </div>
            </section>
        </ShopLayout>
    );
}
