import { Head, Link } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop/ShopLayout';

export default function Terms() {
    return (
        <ShopLayout>
            <Head>
                <title>Terms & Conditions — Nganzi Coffee</title>
                <meta
                    name="description"
                    content="Terms and conditions for purchasing from Nganzi Coffee."
                />
            </Head>

            <div className="bg-brown pt-[140px] pb-16">
                <div className="container">
                    <h1 className="text-cream">
                        Terms &{' '}
                        <span className="script-accent">Conditions</span>
                    </h1>
                </div>
            </div>

            <section className="section-padding bg-cream">
                <div className="container max-w-[800px]">
                    <div className="alert mb-10 rounded-none">
                        <strong>Draft content.</strong> These terms are a
                        placeholder and must be reviewed and approved by the
                        business before publication.
                    </div>

                    <h2 className="mb-4">Orders</h2>
                    <p className="mb-8 text-muted">
                        By placing an order through our shop, you agree to
                        provide accurate contact and delivery information. All
                        orders are subject to product availability and payment
                        confirmation.
                    </p>

                    <h2 className="mb-4">Pricing</h2>
                    <p className="mb-8 text-muted">
                        All prices are displayed in the currency shown at
                        checkout. We reserve the right to correct pricing
                        errors. If a price changes after you place an order, we
                        will contact you before processing.
                    </p>

                    <h2 className="mb-4">Delivery</h2>
                    <p className="mb-8 text-muted">
                        Delivery areas, fees, and estimated timelines are
                        outlined on our{' '}
                        <Link
                            href="/delivery"
                            className="underline hover:text-orange-hover"
                        >
                            delivery page
                        </Link>
                        . We are not responsible for delays caused by
                        circumstances beyond our control.
                    </p>

                    <h2 className="mb-4">Returns & refunds</h2>
                    <p className="mb-8 text-muted">
                        Our returns and refund policy is being finalised. If you
                        receive a damaged or incorrect product, please contact
                        us promptly so we can resolve the issue.
                    </p>

                    <h2 className="mb-4">Limitation of liability</h2>
                    <p className="mb-8 text-muted">
                        Nganzi Coffee is not liable for indirect or
                        consequential losses arising from the use of this
                        website or the purchase of our products, to the extent
                        permitted by applicable law.
                    </p>

                    <h2 className="mb-4">Contact</h2>
                    <p className="text-muted">
                        Questions about these terms? Email{' '}
                        <a
                            href="mailto:nganzicoffeeug@gmail.com"
                            className="underline hover:text-orange-hover"
                        >
                            nganzicoffeeug@gmail.com
                        </a>
                        .
                    </p>
                </div>
            </section>
        </ShopLayout>
    );
}
