import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function ShopHeader() {
    const [open, setOpen] = useState(false);
    const { cartCount } = usePage<{ cartCount?: number }>().props;
    const toggleRef = useRef<HTMLButtonElement>(null);
    const linksRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false);
                toggleRef.current?.focus();
            }
        }
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                toggleRef.current &&
                linksRef.current &&
                !toggleRef.current.contains(target) &&
                !linksRef.current.contains(target)
            ) {
                setOpen(false);
            }
        }
        function handleResize() {
            if (window.innerWidth > 640) {
                setOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClickOutside);
        window.addEventListener('resize', handleResize);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClickOutside);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <header className="site-header">
            <nav className="navbar container" aria-label="Main navigation">
                <Link
                    href="/"
                    className="brand"
                    aria-label="Nganzi Coffee homepage"
                >
                    <img src="/assets/images/logo.svg" alt="Nganzi Coffee" />
                </Link>

                <div className="flex items-center gap-2 sm:hidden">
                    <Link
                        href="/cart"
                        className="relative flex items-center justify-center p-2 text-brown transition-colors hover:text-orange"
                        aria-label={`Cart${cartCount ? ` (${cartCount} items)` : ''}`}
                    >
                        <svg
                            className="h-6 w-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="8" cy="21" r="1" />
                            <circle cx="19" cy="21" r="1" />
                            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                        </svg>
                        {typeof cartCount === 'number' && cartCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange px-1 text-[10px] leading-none font-bold text-brown">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    <button
                        ref={toggleRef}
                        type="button"
                        className="menu-toggle"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                        aria-controls="nav-links"
                        onClick={() => setOpen((v) => !v)}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>

                <div
                    ref={linksRef}
                    className={`nav-links ${open ? 'is-open' : ''}`}
                    id="nav-links"
                >
                    <div className="nav-links-header">
                        <span>Explore Nganzi</span>
                        <button
                            className="nav-close"
                            type="button"
                            aria-label="Close navigation menu"
                            onClick={() => {
                                setOpen(false);
                                toggleRef.current?.focus();
                            }}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path d="m6 6 12 12M18 6 6 18" />
                            </svg>
                        </button>
                    </div>
                    <Link href="/about" onClick={() => setOpen(false)}>
                        About Us
                    </Link>
                    <Link href="/coffee" onClick={() => setOpen(false)}>
                        Coffee
                    </Link>
                    <Link href="/contact" onClick={() => setOpen(false)}>
                        Contact
                    </Link>
                    <Link
                        href="/cart"
                        onClick={() => setOpen(false)}
                        className="relative hidden items-center justify-center p-2 text-brown transition-colors hover:text-orange sm:inline-flex"
                        aria-label={`Cart${cartCount ? ` (${cartCount} items)` : ''}`}
                        title="Shopping Cart"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="8" cy="21" r="1" />
                            <circle cx="19" cy="21" r="1" />
                            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                        </svg>
                        {typeof cartCount === 'number' && cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange px-1 text-[10px] leading-none font-bold text-brown">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/cart"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between sm:hidden"
                    >
                        <span>Cart</span>
                        {typeof cartCount === 'number' && cartCount > 0 && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange px-1.5 text-xs font-bold text-brown">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/shop"
                        onClick={() => setOpen(false)}
                        className="button button-small"
                    >
                        Shop
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
            </nav>
        </header>
    );
}
