import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-white p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex items-center justify-center transition-transform hover:scale-[1.02]"
                            aria-label="Nganzi Coffee Home"
                        >
                            <img
                                src="/assets/images/logo.svg"
                                alt="Nganzi Coffee"
                                className="h-16 w-auto object-contain sm:h-20"
                            />
                        </Link>

                        <div className="space-y-1.5 text-center">
                            <h1 className="text-xl font-bold tracking-tight text-brown">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-center text-xs text-muted">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
