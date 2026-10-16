import { Head } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop/ShopLayout';

export default function Privacy() {
    return (
        <ShopLayout bodyClassName="about-page-body">
            <Head>
                <title>Privacy Policy | Nganzi Coffee</title>
                <meta
                    name="description"
                    content="Privacy policy for Nganzi Coffee. Learn how we handle your information and communications."
                />
            </Head>

            <section className="about-story-hero privacy-hero">
                <img
                    className="hero-image"
                    src="/assets/images/privacy-policy.jpg"
                    alt="Coffee fields in Uganda"
                    fetchPriority="high"
                />
                <div className="hero-overlay" />
                <div className="about-story-hero-content container">
                    <h1>
                        Privacy <span className="script-accent">Policy</span>
                    </h1>
                    <p className="hero-description">
                        Your trust matters to us. This page explains how Nganzi
                        Coffee handles information collected through our website
                        and customer communications.
                    </p>
                </div>
            </section>

            <section className="section-padding">
                <div className="policy-copy container">
                    <div className="story-origin-copy">
                        <h2>Information we collect</h2>
                        <p>
                            We may collect personal information you provide
                            directly, such as your name, email address, phone
                            number, order details, and enquiry information.
                        </p>

                        <h2>How we use it</h2>
                        <p>
                            We use your information to process orders, respond
                            to enquiries, improve customer service, and
                            communicate updates related to our coffee, events,
                            and business relationship.
                        </p>

                        <h2>Sharing your information</h2>
                        <p>
                            We do not sell your personal data. We may share
                            limited information with trusted service providers
                            that help us operate our website or fulfil orders,
                            where appropriate and in compliance with applicable
                            privacy laws.
                        </p>

                        <h2>Cookies and analytics</h2>
                        <p>
                            Our site may use cookies or similar technologies to
                            improve browsing experience and understand site
                            usage. You can manage cookie settings in your
                            browser at any time.
                        </p>

                        <h2>Contact</h2>
                        <p>
                            If you have any questions about this privacy policy,
                            please contact us at{' '}
                            <a href="mailto:nganzicoffeeug@gmail.com">
                                nganzicoffeeug@gmail.com
                            </a>{' '}
                            or call{' '}
                            <a href="tel:+256773211079">+256 773 211079</a>.
                        </p>
                    </div>
                </div>
            </section>
        </ShopLayout>
    );
}
