import { Link, usePage } from '@inertiajs/react';
import {
    ClipboardList,
    ExternalLink,
    LayoutGrid,
    PackageSearch,
    Settings,
    ShieldCheck,
    ShoppingBag,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';

type NavSection = {
    label: string;
    items: Array<{
        title: string;
        href: string;
        icon: React.ComponentType<{ className?: string }>;
        exact?: boolean;
    }>;
};

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role: string | null } } }>()
        .props;
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const role = auth.user?.role;

    const sections: NavSection[] = [
        {
            label: 'SALES',
            items: [
                {
                    title: 'Dashboard',
                    href: '/admin',
                    icon: LayoutGrid,
                    exact: true,
                },
                { title: 'Orders', href: '/admin/orders', icon: ShoppingBag },
            ],
        },
        {
            label: 'CATALOGUE',
            items: [
                {
                    title: 'Products',
                    href: '/admin/products',
                    icon: PackageSearch,
                },
                ...(role === 'owner' || role === 'inventory_manager'
                    ? [
                          {
                              title: 'Inventory',
                              href: '/admin/inventory',
                              icon: ClipboardList,
                          },
                      ]
                    : []),
            ],
        },
        ...(role === 'owner'
            ? [
                  {
                      label: 'SETTINGS',
                      items: [
                          {
                              title: 'Store Settings',
                              href: '/admin/settings',
                              icon: Settings,
                          },
                          { title: 'Staff', href: '/admin/staff', icon: Users },
                          {
                              title: 'Audit Log',
                              href: '/admin/audit-log',
                              icon: ShieldCheck,
                          },
                      ],
                  },
              ]
            : []),
    ];

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="border-r border-border bg-white"
        >
            {/* Matches AppSidebarHeader exact h-16 height and border-b */}
            <SidebarHeader className="flex h-16 shrink-0 flex-row items-center border-b border-border bg-white px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <Link
                    href="/admin"
                    className="flex items-center outline-none"
                    prefetch
                >
                    <AppLogo />
                </Link>
            </SidebarHeader>

            <SidebarContent className="space-y-6 bg-white px-3 py-4 group-data-[collapsible=icon]:space-y-2 group-data-[collapsible=icon]:px-2">
                {sections.map((section) => (
                    <div key={section.label} className="space-y-1">
                        <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-muted uppercase group-data-[collapsible=icon]:hidden">
                            {section.label}
                        </p>
                        <SidebarMenu>
                            {section.items.map((item) => {
                                const active = item.exact
                                    ? isCurrentUrl(item.href)
                                    : isCurrentOrParentUrl(item.href);

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={item.title}
                                            className={`h-10 rounded-lg px-3.5 text-sm font-medium transition-colors group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! ${
                                                active
                                                    ? 'bg-orange! font-semibold text-white! hover:bg-orange-hover! hover:text-white!'
                                                    : 'text-text hover:bg-stone-100! hover:text-brown!'
                                            }`}
                                        >
                                            <Link href={item.href} prefetch>
                                                <item.icon
                                                    className={`size-4.5 shrink-0 ${
                                                        active
                                                            ? 'text-white'
                                                            : 'text-muted'
                                                    }`}
                                                />
                                                <span className="truncate group-data-[collapsible=icon]:hidden">
                                                    {item.title}
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </div>
                ))}
            </SidebarContent>

            <SidebarFooter className="space-y-2 border-t border-border bg-white p-3 group-data-[collapsible=icon]:p-2">
                <a
                    href="/shop"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View Storefront"
                    className="flex h-9 items-center justify-between rounded-lg border border-border bg-white px-3.5 text-xs font-medium text-brown transition-colors group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:border-orange hover:text-orange"
                >
                    <span className="group-data-[collapsible=icon]:hidden">
                        View Storefront
                    </span>
                    <ExternalLink className="size-4 shrink-0 text-muted" />
                </a>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
