import { Head, Link } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop/ShopLayout';

export default function CoffeeGuide() {
    return (
        <ShopLayout bodyClassName="coffee-page-body">
            <Head>
                <title>
                    Ugandan Coffee Roast Guide & Green Beans | Nganzi Coffee
                </title>
                <meta
                    name="description"
                    content="Explore Nganzi Coffee roast profiles: Light, Medium, Dark roasts and raw green beans from Komurubuga Farm. Discover tasting notes and ideal brew methods."
                />
                <meta
                    name="keywords"
                    content="coffee roast guide, ugandan arabica, ugandan robusta, green coffee beans, light roast coffee, medium roast, dark roast, specialty coffee uganda"
                />
                <link rel="canonical" href="/coffee" />
                <meta property="og:type" content="article" />
                <meta
                    property="og:title"
                    content="Ugandan Coffee Roast Guide & Green Beans | Nganzi Coffee"
                />
                <meta
                    property="og:description"
                    content="Discover our roast spectrum: Light, Medium, Dark roasts and green beans from Komurubuga Farm. Learn the tasting notes and best brewing rituals."
                />
                <meta
                    property="og:image"
                    content="/assets/images/coffee-bag.webp"
                />
            </Head>

            <section className="coffee-guide-hero">
                <img
                    className="hero-image"
                    src="/assets/images/coffee-bag.webp"
                    alt=""
                    fetchPriority="high"
                />
                <div className="hero-overlay" />
                <div className="coffee-guide-intro container">
                    <h1>
                        Roasted coffee and raw beans from{' '}
                        <span className="script-accent">Uganda.</span>
                    </h1>
                    <p>
                        Explore our Light, Medium, and Dark roasts, or ask us
                        about raw coffee beans available in Robusta and Arabica
                        varieties.
                    </p>
                </div>
            </section>

            <section className="roast-guide" aria-label="Explore our coffee">
                <article
                    className="roast-profile roast-profile-light"
                    id="light-roast"
                >
                    <div className="roast-profile-inner container">
                        <div className="roast-image">
                            <img
                                src="/assets/images/light-roast.webp"
                                alt="Nganzi Light Roast coffee bag"
                                loading="lazy"
                            />
                        </div>
                        <div className="roast-copy">
                            <h2>Light Roast</h2>
                            <p className="roast-description">
                                A lively roast that preserves the bean’s floral
                                character and fruit-forward acidity. Best for
                                slow mornings, pour-over rituals, and drinkers
                                who enjoy a delicate, layered cup.
                            </p>
                            <div className="tasting-notes">
                                <h3>Tasting Notes</h3>
                                <ul>
                                    <li>Honey</li>
                                    <li>Red berry</li>
                                    <li>Jasmine</li>
                                </ul>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <Link
                                    className="text-link"
                                    href="/shop?category=light-roast"
                                >
                                    Shop Light Roast
                                    <svg
                                        className="arrow-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 12h15m-6-6 6 6-6 6" />
                                    </svg>
                                </Link>
                                <Link className="text-link" href="/contact">
                                    Ask about Light Roast
                                    <svg
                                        className="arrow-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 12h15m-6-6 6 6-6 6" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </article>

                <article
                    className="roast-profile roast-profile-medium"
                    id="medium-roast"
                >
                    <div className="roast-profile-inner roast-profile-reverse container">
                        <div className="roast-image">
                            <img
                                src="/assets/images/medium-roast.webp"
                                alt="Nganzi Medium Roast coffee bag"
                                loading="lazy"
                            />
                        </div>
                        <div className="roast-copy">
                            <h2>Medium Roast</h2>
                            <p className="roast-description">
                                Our most versatile roast balances caramel
                                sweetness, citrus brightness, and a clean cocoa
                                finish. Smooth enough for everyday brewing and
                                expressive enough to drink black.
                            </p>
                            <div className="tasting-notes">
                                <h3>Tasting Notes</h3>
                                <ul>
                                    <li>Caramel</li>
                                    <li>Orange zest</li>
                                    <li>Cocoa</li>
                                </ul>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <Link
                                    className="text-link"
                                    href="/shop?category=medium-roast"
                                >
                                    Shop Medium Roast
                                    <svg
                                        className="arrow-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 12h15m-6-6 6 6-6 6" />
                                    </svg>
                                </Link>
                                <Link className="text-link" href="/contact">
                                    Ask about Medium Roast
                                    <svg
                                        className="arrow-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 12h15m-6-6 6 6-6 6" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </article>

                <article
                    className="roast-profile roast-profile-dark"
                    id="dark-roast"
                >
                    <div className="roast-profile-inner container">
                        <div className="roast-image">
                            <img
                                src="/assets/images/dark-roast.webp"
                                alt="Nganzi Dark Roast coffee bag"
                                loading="lazy"
                            />
                        </div>
                        <div className="roast-copy">
                            <h2>Dark Roast</h2>
                            <p className="roast-description">
                                A deep, slow roast with a rich body and
                                lingering smoky finish. It stands up beautifully
                                to milk and delivers the intensity espresso and
                                French press drinkers love.
                            </p>
                            <div className="tasting-notes">
                                <h3>Tasting Notes</h3>
                                <ul>
                                    <li>Dark chocolate</li>
                                    <li>Molasses</li>
                                    <li>Toasted almond</li>
                                </ul>
                            </div>
                            <div className="flex flex-wrap items-center gap-6">
                                <Link
                                    className="text-link"
                                    href="/shop?category=dark-roast"
                                >
                                    Shop Dark Roast
                                    <svg
                                        className="arrow-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 12h15m-6-6 6 6-6 6" />
                                    </svg>
                                </Link>
                                <Link className="text-link" href="/contact">
                                    Ask about Dark Roast
                                    <svg
                                        className="arrow-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 12h15m-6-6 6 6-6 6" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </article>

                <article
                    className="roast-profile roast-profile-raw"
                    id="raw-coffee-beans"
                >
                    <div className="roast-profile-inner roast-profile-reverse container">
                        <div className="roast-image">
                            <img
                                src="/assets/images/raw-beans.webp"
                                alt="Bag of raw green coffee beans"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                        <div className="roast-copy">
                            <h2>Raw Coffee Beans</h2>
                            <p className="roast-description">
                                Raw coffee beans are available in both Robusta
                                and Arabica varieties. Get in touch to ask about
                                the options.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center gap-6">
                                <Link
                                    className="text-link"
                                    href="/shop?category=raw-beans"
                                >
                                    Shop Raw Coffee Beans
                                    <svg
                                        className="arrow-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 12h15m-6-6 6 6-6 6" />
                                    </svg>
                                </Link>
                                <Link className="text-link" href="/contact">
                                    Ask about Raw Coffee Beans
                                    <svg
                                        className="arrow-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 12h15m-6-6 6 6-6 6" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <section className="roast-cta">
                <div className="roast-cta-inner container">
                    <div>
                        <h2>
                            Ready to choose your{' '}
                            <span className="script-accent">coffee?</span>
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Link className="button button-dark" href="/shop">
                            Shop Online
                            <svg
                                className="arrow-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path d="M7 17 17 7M7 7h10v10" />
                            </svg>
                        </Link>
                        <Link className="button button-light" href="/contact">
                            Get in touch
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
                </div>
            </section>
        </ShopLayout>
    );
}
