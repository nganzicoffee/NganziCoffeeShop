import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative grid min-h-svh w-full bg-white lg:grid-cols-2">
            {/* Left: Centered Login Form with Big Logo */}
            <div className="flex min-h-svh flex-col items-center justify-center bg-white p-6 sm:p-10 lg:p-14">
                <div className="flex w-full max-w-sm flex-col items-center">
                    {/* Big Centered Nganzi Logo */}
                    <Link
                        href={home()}
                        className="mb-8 flex items-center justify-center transition-transform hover:scale-[1.02]"
                        aria-label="Nganzi Coffee Home"
                    >
                        <img
                            src="/assets/images/logo-clean.svg"
                            alt="Nganzi Coffee"
                            className="h-20 w-auto object-contain sm:h-24 md:h-28"
                        />
                    </Link>

                    {/* Centered Heading */}
                    <div className="mb-6 w-full space-y-1.5 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-brown sm:text-3xl">
                            {title || 'Store & Staff Login'}
                        </h1>
                        {description && (
                            <p className="text-xs text-muted">{description}</p>
                        )}
                    </div>

                    {/* Form Component */}
                    <div className="w-full">{children}</div>

                    {/* Return link */}
                    <div className="mt-8 w-full text-center">
                        <Link
                            href={home()}
                            className="text-xs font-semibold text-muted transition-colors hover:text-orange"
                        >
                            ← Return to shop
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right: Coffee Image (Full detail, bright & clear, no text overlay) */}
            <div className="relative hidden h-full min-h-svh w-full overflow-hidden bg-stone-100 lg:block">
                <img
                    src="/assets/images/closeup-coffee.webp"
                    alt="Freshly brewed Nganzi coffee with roasted beans"
                    className="h-full w-full object-cover object-center"
                    fetchPriority="high"
                />
            </div>
        </div>
    );
}
