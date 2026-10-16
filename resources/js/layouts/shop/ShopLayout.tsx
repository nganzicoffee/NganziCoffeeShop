import ShopFooter from '@/components/shop/ShopFooter';
import ShopHeader from '@/components/shop/ShopHeader';

export default function ShopLayout({
    children,
    bodyClassName = '',
}: {
    children: React.ReactNode;
    bodyClassName?: string;
}) {
    const isWhite = bodyClassName.includes('bg-white');
    return (
        <div
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
