import { useEffect, useRef } from 'react';
import ShopFooter from '@/components/shop/ShopFooter';
import ShopHeader from '@/components/shop/ShopHeader';

export default function ShopLayout({
    children,
    bodyClassName = '',
}: {
    children: React.ReactNode;
    bodyClassName?: string;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const isWhite = bodyClassName.includes('bg-white');

    useEffect(() => {
        const root = rootRef.current;
        if (!root || typeof IntersectionObserver === 'undefined') return;

        const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
        if (targets.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.14, rootMargin: '0px 0px -40px 0px' },
        );

        targets.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={rootRef}
            className={`nganzi-site flex min-h-screen flex-col ${bodyClassName}`.trim()}
        >
            <ShopHeader />
            <main className={`flex-1 ${isWhite ? '!bg-white' : ''}`.trim()}>
                {children}
            </main>
            <ShopFooter />
        </div>
    );
}
