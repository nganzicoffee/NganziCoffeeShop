import { Head, Link } from '@inertiajs/react';
import ShopLayout from '@/layouts/shop/ShopLayout';

export default function About() {
    return (
        <ShopLayout bodyClassName="about-page-body">
            <Head>
                <title>Our Story & Komurubuga Farm | Nganzi Coffee</title>
                <meta
                    name="description"
                    content="Learn about Nganzi Coffee's heritage, Komurubuga Coffee Farm in Mubende and Kibaale districts, and our commitment to sustainable direct trade in Uganda."
                />
                <meta
                    name="keywords"
                    content="nganzi coffee story, komurubuga coffee farm, mubende coffee, kibaale coffee, ugandan women farmers, direct trade coffee uganda"
                />
                <link rel="canonical" href="/about" />
                <meta property="og:type" content="article" />
                <meta
                    property="og:title"
                    content="Our Story & Komurubuga Farm | Nganzi Coffee"
                />
                <meta
                    property="og:description"
                    content="Good coffee starts with people and place. Discover our roots at Komurubuga Farm and our mission to elevate Ugandan coffee."
                />
                <meta
                    property="og:image"
                    content="/assets/images/mount-elgon.webp"
                />
            </Head>

            <section className="about-story-hero">
                <img
                    className="hero-image"
                    src="/assets/images/mount-elgon.webp"
                    alt="The green highlands of Uganda"
                    fetchPriority="high"
                />
                <div className="hero-overlay" />
                <div className="about-story-hero-content container">
                    <h1>
                        Rooted in Uganda.
                        <br />
                        Growing <span className="script-accent">together.</span>
                    </h1>
                    <a className="button button-light" href="#our-roots">
                        Meet Nganzi
                        <svg
                            className="arrow-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path d="M12 4v15m-6-6 6 6 6-6" />
                        </svg>
                    </a>
                </div>
            </section>

            <section className="story-origin section-padding" id="our-roots">
                <div className="story-origin-grid container">
                    <div className="story-origin-image">
                        <img
                            src="/assets/images/coffee-arial.jpg"
                            alt="Fresh green coffee beans before roasting"
                            loading="lazy"
                        />
                    </div>
                    <div className="story-origin-copy">
                        <h2>
                            Good coffee starts with people and{' '}
                            <span className="script-accent">place.</span>
                        </h2>
                        <p>
                            Nganzi Quality Investments Ltd, trading as Nganzi
                            Coffee, has been growing and processing Arabica and
                            Robusta since December 2020. Our work spans
                            approximately 50 acres of farmland across Mubende
                            and Kibaale districts. Our coffee is grown at
                            Komurubuga Coffee Farm.
                        </p>
                        <p>
                            “Nganzi” is a Lutooro word meaning “beloved” or
                            “something great.” It reflects our ambition to bring
                            quality Ugandan coffee to more people while creating
                            value for the communities behind every cup.
                        </p>
                        <div
                            className="story-product-sizes"
                            aria-label="Available pack sizes"
                        >
                            <span>100g</span>
                            <span>250g</span>
                            <span>500g</span>
                            <span>1kg</span>
                        </div>
                        <Link className="text-link" href="/coffee">
                            Explore our coffee
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
            </section>

            <section className="story-export section-padding" id="our-journey">
                <div className="container">
                    <div className="story-export-heading">
                        <div>
                            <h2>Nganzi Quality Investments Ltd</h2>
                            <p className="script-accent">
                                African coffee. Connected from origin to cup.
                            </p>
                        </div>
                        <p>
                            Founded in 2020, Nganzi is a Ugandan-owned
                            agricultural export company connecting premium
                            Arabica and Robusta from Uganda and the Democratic
                            Republic of Congo with coffee partners and consumers
                            around the world.
                        </p>
                    </div>

                    <div className="story-export-content">
                        <div className="story-export-context">
                            <h3>
                                From farm partnership to{' '}
                                <span className="script-accent">
                                    every cup.
                                </span>
                            </h3>
                            <p>
                                We connect the whole coffee journey: direct
                                partnerships with smallholder farmers lead into
                                aggregation, careful processing, quality
                                assurance, traceability, and export logistics.
                            </p>
                            <p>
                                Roasted and packaged coffee carries that same
                                journey forward to cafés, hospitality
                                businesses, retailers, foodservice teams, and
                                everyday drinkers.
                            </p>
                            <aside className="story-vision">
                                <h3 className="mb-2 font-heading text-lg font-bold text-brown">
                                    Our vision
                                </h3>
                                <p>
                                    To become one of Africa’s most trusted
                                    coffee exporters by investing in farmers,
                                    value-added processing, technology, and
                                    strong international partnerships.
                                </p>
                            </aside>
                        </div>

                        <ol className="export-journey">
                            <li>
                                <span>01</span>
                                <h3>Farmer partnerships</h3>
                                <p>
                                    Direct relationships with the people who
                                    grow the coffee.
                                </p>
                            </li>
                            <li>
                                <span>02</span>
                                <h3>Careful processing</h3>
                                <p>
                                    Aggregation, processing, and quality
                                    assurance that protect each harvest.
                                </p>
                            </li>
                            <li>
                                <span>03</span>
                                <h3>Traceable origins</h3>
                                <p>
                                    Clear connections between each coffee, its
                                    origin, and its journey.
                                </p>
                            </li>
                            <li>
                                <span>04</span>
                                <h3>Ready for the world</h3>
                                <p>
                                    Export logistics and value-added coffee for
                                    international partners.
                                </p>
                            </li>
                        </ol>

                        <div
                            className="story-export-images"
                            aria-label="Nganzi coffee production"
                        >
                            <img
                                src="/assets/images/coffee-origin.jpg"
                                alt="Nganzi coffee beside the roaster"
                                loading="lazy"
                            />
                            <img
                                src="/assets/images/green beans.jpeg"
                                alt="Green coffee beans ready for processing"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="story-women" id="our-people">
                <div className="story-women-grid container">
                    <div className="story-women-copy">
                        <h2>
                            Meet the
                            <span className="script-accent">founder</span>
                        </h2>
                        <p>
                            Founded by Angella Nyakato, Nganzi Coffee is a
                            Ugandan business built on a belief that great coffee
                            can create lasting value. Her vision brings quality,
                            strong partnerships, and opportunity for rural
                            communities together.
                        </p>
                        <p>
                            From the people who grow the coffee to the partners
                            who share it with the world, Nganzi is working to
                            build a more connected coffee journey from origin to
                            cup.
                        </p>
                        <Link className="text-link" href="/contact">
                            Get to know Nganzi
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
                    <figure className="story-women-image founder-image">
                        <img
                            src="/assets/images/angellah.png"
                            alt="Angella, founder of Nganzi Coffee"
                            loading="lazy"
                        />
                        <figcaption>
                            <strong>Angella</strong>
                        </figcaption>
                    </figure>
                </div>
            </section>

            <section
                className="story-women story-women-farmers"
                id="women-farmers"
            >
                <div className="story-women-grid container">
                    <div className="story-women-copy">
                        <h2>
                            When women farmers thrive,{' '}
                            <span className="script-accent">
                                communities grow.
                            </span>
                        </h2>
                        <p>
                            Women’s economic empowerment is central to Nganzi’s
                            mission. We employ at least 50 rural women, creating
                            income-generating opportunities that help strengthen
                            livelihoods and support families.
                        </p>
                        <p>
                            We also work with women as contracted outgrowers and
                            support local farmers with training in coffee
                            cultivation, post-harvest handling, and good
                            agronomic practices. It’s one way we help more
                            people participate in and benefit from the coffee
                            value chain.
                        </p>
                        <Link className="text-link" href="/contact">
                            Start a conversation
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
                    <figure className="story-women-image">
                        <img
                            src="/assets/images/woman-in-coffee-farm.webp"
                            alt="A woman tending coffee plants on a farm"
                            loading="lazy"
                        />
                    </figure>
                </div>
            </section>

            <section
                className="story-processing section-padding"
                id="coffee-journey"
            >
                <div className="container">
                    <div className="story-processing-heading">
                        <h2>
                            From green bean to{' '}
                            <span className="script-accent">roast.</span>
                        </h2>
                        <p>
                            We bring Uganda’s Arabica and Robusta to life in a
                            range of roasts and formats. Every step is an
                            opportunity to honour the people and care behind the
                            coffee.
                        </p>
                    </div>
                    <div className="roaster-gallery">
                        <figure>
                            <img
                                src="/assets/images/roaster 1.png"
                                alt="Coffee roasting equipment"
                                loading="lazy"
                            />
                        </figure>
                        <figure>
                            <img
                                src="/assets/images/roaster 2.png"
                                alt="A closer look at the coffee roaster"
                                loading="lazy"
                            />
                        </figure>
                        <figure>
                            <img
                                src="/assets/images/roaster 3.png"
                                alt="Coffee being prepared for roasting"
                                loading="lazy"
                            />
                        </figure>
                        <figure>
                            <img
                                src="/assets/images/roaster.png"
                                alt="Coffee roaster at work"
                                loading="lazy"
                            />
                        </figure>
                    </div>
                </div>
            </section>

            <section className="story-cta">
                <div className="story-cta-inner container">
                    <div>
                        <h2>
                            Good coffee brings us{' '}
                            <span className="script-accent">closer.</span>
                        </h2>
                        <p>
                            Discover our roasts or get in touch to learn more
                            about Nganzi.
                        </p>
                    </div>
                    <Link className="button button-dark" href="/coffee">
                        Explore our coffee
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
            </section>
        </ShopLayout>
    );
}
