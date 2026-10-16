import { Link } from '@inertiajs/react';

export default function ShopFooter() {
    return (
        <footer className="site-footer" id="contact">
            <div className="footer-grid container">
                <div className="footer-brand">
                    <Link href="/" className="footer-logo">
                        <img
                            src="/assets/images/logo.svg"
                            alt="Nganzi Coffee"
                        />
                    </Link>

                    <div className="footer-divider" aria-hidden="true" />

                    <p className="footer-story">
                        Our journey begins in the high-altitude terrain of
                        Western Uganda. Here, coffee is a story of culture,
                        warmth and connection — shared one cup at a time.
                    </p>

                    <Link href="/shop" className="button button-light">
                        Shop Coffee
                        <svg
                            className="arrow-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path d="M7 17 17 7M7 7h10v10" />
                        </svg>
                    </Link>

                    <nav className="social-links" aria-label="Social media">
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

                <nav className="footer-nav" aria-label="Footer navigation">
                    <Link href="/about">About Us</Link>
                    <Link href="/coffee">Coffee</Link>
                    <Link href="/shop">Shop</Link>
                    <a href="tel:+256773211079">+256 773 211079</a>
                    <a href="mailto:nganzicoffeeug@gmail.com">
                        nganzicoffeeug@gmail.com
                    </a>
                    <Link href="/contact">
                        Contact Us
                        <svg
                            className="arrow-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path d="M7 17 17 7M7 7h10v10" />
                        </svg>
                    </Link>
                </nav>
            </div>

            <div className="footer-bottom container">
                <p>© 2026 Nganzi Coffee. All rights reserved.</p>
                <Link href="/policies/privacy-policy">Privacy Policy</Link>
            </div>
        </footer>
    );
}
