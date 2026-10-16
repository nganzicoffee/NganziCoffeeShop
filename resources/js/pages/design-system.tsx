import { Head } from '@inertiajs/react';

/**
 * Design-system reference page — development only.
 * Route: GET /design-system  (registered only when APP_ENV=local)
 * Shows every reusable brand component in one place.
 */
export default function DesignSystem() {
    return (
        <>
            <Head title="Design System" />

            <div className="nganzi-container space-y-20 py-20">
                <header>
                    <h1 className="text-brown">Nganzi Design System</h1>
                    <p className="mt-3 max-w-[55ch] text-muted">
                        Brand tokens, components, and patterns used across the
                        shop. This page is only accessible in local development.
                    </p>
                </header>

                {/* ── Typography ─────────────────────────────────── */}
                <Section title="Typography">
                    <h1>Heading 1 — DM Sans Bold</h1>
                    <h2>Heading 2 — DM Sans Bold</h2>
                    <h3>Heading 3 — DM Sans Bold</h3>
                    <p className="mt-4 text-[1.125rem] text-text">
                        Body text — Manrope 400. The quick brown fox jumps over
                        the lazy dog.
                    </p>
                    <p className="mt-2 text-muted">
                        Muted text — used for secondary copy and captions.
                    </p>
                    <p className="script-accent mt-4 text-[2rem]">
                        Script accent — Caveat
                    </p>
                </Section>

                {/* ── Colour palette ─────────────────────────────── */}
                <Section title="Colour palette">
                    <div className="flex flex-wrap gap-3">
                        {SWATCHES.map(({ name, bg, text }) => (
                            <div
                                key={name}
                                className={`flex h-20 w-36 flex-col justify-end border border-border p-3 ${bg}`}
                            >
                                <span
                                    className={`text-[0.7rem] font-bold ${text}`}
                                >
                                    {name}
                                </span>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── Buttons ────────────────────────────────────── */}
                <Section title="Buttons">
                    <div className="flex flex-wrap items-center gap-4">
                        <button className="btn btn-primary">
                            Primary <ArrowIcon />
                        </button>
                        <button className="btn btn-outline">Outline</button>
                        <button className="btn btn-ghost">Ghost</button>
                        <button className="btn btn-white border border-border">
                            White
                        </button>
                        <button className="btn btn-primary btn-pill">
                            Pill <ArrowIcon />
                        </button>
                    </div>
                </Section>

                {/* ── Badges ─────────────────────────────────────── */}
                <Section title="Badges">
                    <div className="flex flex-wrap gap-3">
                        <span className="badge">Default</span>
                        <span className="badge badge-orange">Featured</span>
                        <span className="badge badge-cream">Light Roast</span>
                    </div>
                </Section>

                {/* ── Alerts ─────────────────────────────────────── */}
                <Section title="Alerts">
                    <div className="max-w-lg space-y-3">
                        <div className="alert" role="status">
                            Info — your order has been received and is being
                            processed.
                        </div>
                        <div className="alert alert-success" role="status">
                            Success — payment confirmed. Your order is on its
                            way.
                        </div>
                        <div className="alert alert-error" role="alert">
                            Error — this item is no longer available in the
                            selected quantity.
                        </div>
                    </div>
                </Section>

                {/* ── Form inputs ────────────────────────────────── */}
                <Section title="Form inputs">
                    <div className="max-w-sm space-y-4">
                        <div>
                            <label htmlFor="ds-name" className="nganzi-label">
                                Full name
                            </label>
                            <input
                                id="ds-name"
                                type="text"
                                className="nganzi-input"
                                placeholder="e.g. Amara Nakato"
                            />
                        </div>
                        <div>
                            <label htmlFor="ds-email" className="nganzi-label">
                                Email address
                            </label>
                            <input
                                id="ds-email"
                                type="email"
                                className="nganzi-input"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="ds-invalid"
                                className="nganzi-label"
                            >
                                Invalid state
                            </label>
                            <input
                                id="ds-invalid"
                                type="text"
                                className="nganzi-input"
                                aria-invalid="true"
                                defaultValue="bad value"
                            />
                            <p className="mt-1 text-[0.8rem] text-destructive">
                                This field is required.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* ── Product card ───────────────────────────────── */}
                <Section title="Product card">
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        <div className="product-card">
                            <div className="product-card-image">
                                <img
                                    src="/images/brand/medium-roast.webp"
                                    alt="Medium roast coffee"
                                />
                            </div>
                            <div className="product-card-body">
                                <span className="badge badge-orange mb-2">
                                    Featured
                                </span>
                                <p className="font-heading font-bold text-brown">
                                    Medium Roast
                                </p>
                                <p className="mt-0.5 text-[0.85rem] text-muted">
                                    Arabica · 250g
                                </p>
                                <p className="price mt-2 text-[1.05rem]">
                                    UGX —
                                </p>
                            </div>
                        </div>
                        <div className="product-card opacity-60">
                            <div className="product-card-image bg-[#e9dfd1]" />
                            <div className="product-card-body">
                                <p className="font-heading font-bold text-brown">
                                    Out of stock
                                </p>
                                <p className="mt-0.5 text-[0.85rem] text-muted">
                                    Dark Roast · 500g
                                </p>
                                <p className="price mt-2 text-[1.05rem]">
                                    UGX —
                                </p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* ── Price display ──────────────────────────────── */}
                <Section title="Price display">
                    <div className="flex flex-wrap items-baseline gap-6">
                        <span className="price text-[1.5rem]">UGX 45,000</span>
                        <span className="price text-[1.1rem]">UGX 22,500</span>
                        <span className="price-muted text-[1.1rem]">
                            UGX 50,000
                        </span>
                    </div>
                </Section>

                {/* ── Skeleton loader ────────────────────────────── */}
                <Section title="Skeleton loader">
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="product-card">
                                <div className="product-card-image skeleton" />
                                <div className="product-card-body space-y-2">
                                    <div className="skeleton h-4 w-3/4" />
                                    <div className="skeleton h-4 w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── Text link ──────────────────────────────────── */}
                <Section title="Text link">
                    <a href="#" className="text-link">
                        Read our full story <ArrowIcon />
                    </a>
                </Section>
            </div>
        </>
    );
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h3 className="mb-6 border-b border-border pb-3 text-brown">
                {title}
            </h3>
            {children}
        </section>
    );
}

function ArrowIcon() {
    return (
        <svg
            className="h-[1.15em] w-[1.15em] shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M7 17 17 7M7 7h10v10" />
        </svg>
    );
}

const SWATCHES = [
    { name: 'Orange #F29520', bg: 'bg-orange', text: 'text-brown' },
    { name: 'Brown #38261E', bg: 'bg-brown', text: 'text-cream' },
    { name: 'Brown-light #624638', bg: 'bg-[#624638]', text: 'text-cream' },
    { name: 'Cream #FFF8EE', bg: 'bg-cream', text: 'text-brown' },
    { name: 'Peach #FCECDD', bg: 'bg-peach', text: 'text-brown' },
    { name: 'Paper #FFFFFF', bg: 'bg-paper', text: 'text-brown' },
];
