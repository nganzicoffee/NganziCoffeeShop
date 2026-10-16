import { Head, Link } from '@inertiajs/react';
import type { BreadcrumbItem, Category, StatusOption } from '@/types';
import ProductForm from './_ProductForm';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Products', href: '/admin/products' },
    { title: 'New Product', href: '/admin/products/create' },
];

type Props = {
    categories: Category[];
    statuses: StatusOption[];
};

export default function ProductCreate({ categories, statuses }: Props) {
    return (
        <>
            <Head title="New Product — Nganzi Coffee" />

            <main className="min-h-full flex-1 space-y-6 bg-white p-6 md:p-8">
                <div className="border-b border-border pb-5">
                    <Link
                        href="/admin/products"
                        className="text-xs font-medium text-muted hover:text-orange"
                    >
                        ← Products
                    </Link>
                    <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-brown">
                        New Product
                    </h1>
                    <p className="mt-1 text-xs text-muted">
                        Create the product details first, then add pack variants
                        and images on the next screen.
                    </p>
                </div>

                <div className="max-w-2xl rounded-xl border border-border bg-white p-6">
                    <ProductForm
                        categories={categories}
                        statuses={statuses}
                        action="/admin/products"
                        method="post"
                    />
                </div>
            </main>
        </>
    );
}

ProductCreate.layout = { breadcrumbs };
