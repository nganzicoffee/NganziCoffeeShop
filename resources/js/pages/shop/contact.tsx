import { Head } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop/ShopLayout';

export default function Contact() {
    return (
        <ShopLayout bodyClassName="contact-page-body">
            <Head>
                <title>Contact Us & Wholesale Inquiries | Nganzi Coffee</title>
                <meta
                    name="description"
                    content="Get in touch with Nganzi Coffee for orders, cafe partnerships, corporate gifting, or wholesale export inquiries in Kampala, Uganda."
                />
                <meta
                    name="keywords"
                    content="contact nganzi coffee, uganda coffee suppliers, buy wholesale coffee uganda, coffee cafe orders kampala"
                />
                <link rel="canonical" href="/contact" />
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="Contact Us & Wholesale Inquiries | Nganzi Coffee"
                />
                <meta
                    property="og:description"
                    content="Reach out to the Nganzi Coffee team for orders, collaborations, and export inquiries."
                />
                <meta
                    property="og:image"
                    content="/assets/images/coffee-bag.webp"
                />
            </Head>

            <div className="contact-page-main">
                <section className="contact-hero contact-social-layout">
                    <div className="contact-intro">
                        <h1>
                            Contact <span className="script-accent">us.</span>
                        </h1>
                        <p className="contact-lead">
                            We’re here to help with your coffee questions,
                            tasting enquiries, and custom orders.
                        </p>

                        <ul
                            className="contact-points"
                            aria-label="Contact details"
                        >
                            <li>
                                <span
                                    className="contact-icon"
                                    aria-hidden="true"
                                >
                                    ☎
                                </span>
                                <a href="tel:+256773211079">
                                    +256 (0) 773 211079
                                </a>
                            </li>
                            <li>
                                <span
                                    className="contact-icon"
                                    aria-hidden="true"
                                >
                                    ✉
                                </span>
                                <a href="mailto:nganzicoffeeug@gmail.com">
                                    nganzicoffeeug@gmail.com
                                </a>
                            </li>
                        </ul>

                        <div className="contact-social-panel">
                            <h2>Our Socials</h2>
                            <div className="social-link-list">
                                <a
                                    href="https://www.linkedin.com/company/nganzicoffee/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    LinkedIn
                                    <svg
                                        className="social-arrow"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M7 17 17 7M7 7h10v10" />
                                    </svg>
                                </a>
                                <a
                                    href="https://x.com/nganzicoffee"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    X (Formerly Twitter)
                                    <svg
                                        className="social-arrow"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M7 17 17 7M7 7h10v10" />
                                    </svg>
                                </a>
                                <a
                                    href="https://www.instagram.com/nganzicoffee/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Instagram
                                    <svg
                                        className="social-arrow"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M7 17 17 7M7 7h10v10" />
                                    </svg>
                                </a>
                                <a
                                    href="https://www.tiktok.com/@nganzicoffee"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    TikTok
                                    <svg
                                        className="social-arrow"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path d="M7 17 17 7M7 7h10v10" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="contact-visual-panel">
                        <img
                            src="/assets/images/woman-in-coffee-farm.webp"
                            alt="Woman working among coffee plants"
                            loading="lazy"
                        />
                    </div>
                </section>
            </div>

            <section
                className="location-section"
                aria-label="Location and hours"
            >
                <div
                    className="map-card"
                    aria-label="Map showing Nganzi Coffee location"
                >
                    <div className="map-badge">Open in Maps</div>
                    <iframe
                        title="Kabanyoro Agricultural Research Institute location"
                        src="https://www.google.com/maps?q=Kabanyoro%20Agricultural%20Research%20Institute%20Gayaza%20Zirobwe%20Road&z=13&output=embed"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                    />
                </div>

                <div className="location-copy">
                    <h2>
                        Our <span className="script-accent">location.</span>
                    </h2>
                    <h3>Connecting Near and Far</h3>
                    <ul className="location-details">
                        <li>
                            <span className="detail-label">Address</span>
                            <span>
                                Kabanyoro Agricultural Research Institute,
                                Gayaza - Zirobwe Road, Uganda
                            </span>
                        </li>
                        <li>
                            <span className="detail-label">Email</span>
                            <a href="mailto:nganzicoffeeug@gmail.com">
                                nganzicoffeeug@gmail.com
                            </a>
                        </li>
                        <li>
                            <span className="detail-label">Hours</span>
                            <span>Open: Monday – Friday (9am – 5pm)</span>
                        </li>
                    </ul>
                </div>
            </section>
        </ShopLayout>
    );
}
