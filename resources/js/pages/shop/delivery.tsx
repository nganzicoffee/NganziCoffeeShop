import { Head } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop/ShopLayout';

export default function Delivery() {
    return (
        <ShopLayout>
            <Head>
                <title>Delivery & Returns — Nganzi Coffee</title>
                <meta
                    name="description"
                    content="Delivery areas, fees, timelines, and return policy for Nganzi Coffee orders."
                />
            </Head>

            <div className="bg-brown pt-[140px] pb-16">
                <div className="container">
                    <h1 className="text-cream">
                        Delivery &{' '}
                        <span className="script-accent">Returns</span>
                    </h1>
                </div>
            </div>

            <section className="section-padding bg-cream">
                <div className="container max-w-[800px]">
                    <div className="alert mb-10 rounded-none">
                        <strong>Draft content.</strong> Delivery areas, fees,
                        and return policies are being finalised. Please contact
                        us for current delivery information.
                    </div>

                    <h2 className="mb-4">Delivery</h2>
                    <p className="mb-4 text-muted">
                        We aim to deliver your order as quickly as possible.
                        Delivery areas, fees, and estimated timelines will be
                        confirmed here once finalised.
                    </p>
                    <p className="mb-8 text-muted">
                        If you have questions about delivery to your area,
                        please get in touch before placing your order.
                    </p>

                    <h2 className="mb-4">Returns</h2>
                    <p className="mb-4 text-muted">
                        Our returns policy is being finalised. If you receive a
                        damaged or incorrect order, please contact us as soon as
                        possible and we will work to resolve the issue.
                    </p>

                    <h2 className="mb-4">Contact</h2>
                    <p className="text-muted">
                        Phone:{' '}
                        <a
                            href="tel:+256786707449"
                            className="underline hover:text-orange-hover"
                        >
                            +256 786 707449
                        </a>
                        <br />
                        Email:{' '}
                        <a
                            href="mailto:nganzicoffeeug@gmail.com"
                            className="underline hover:text-orange-hover"
                        >
                            nganzicoffeeug@gmail.com
                        </a>
                    </p>
                </div>
            </section>
        </ShopLayout>
    );
}
