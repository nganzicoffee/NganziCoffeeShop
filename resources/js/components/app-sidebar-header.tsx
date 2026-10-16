import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-white px-6">
            <SidebarTrigger className="-ml-1 size-8 text-brown hover:bg-stone-100 hover:text-orange" />
            <Breadcrumbs breadcrumbs={breadcrumbs} />
        </header>
    );
}
