import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';

type UserItem = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    roleLabel: string | null;
    isSelf: boolean;
};

type Props = {
    users: {
        data: UserItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
    };
    search: string;
    roles: Array<{ value: string; label: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Staff', href: '/admin/staff' },
];

export default function StaffIndex({
    users,
    search: initialSearch,
    roles,
}: Props) {
    const [search, setSearch] = useState(initialSearch ?? '');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    function handleSearch(term: string) {
        router.get(
            '/admin/staff',
            { search: term },
            { preserveState: true, replace: true },
        );
    }

    function handleRoleChange(user: UserItem, newRole: string) {
        const roleValue = newRole === '' ? null : newRole;
        const confirmMessage =
            roleValue === null
                ? `Revoke staff access for ${user.name}?`
                : `Change ${user.name}'s role to ${roles.find((r) => r.value === newRole)?.label ?? newRole}?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setUpdatingId(user.id);
        router.patch(
            `/admin/staff/${user.id}/role`,
            { role: roleValue },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingId(null),
            },
        );
    }

    return (
        <>
            <Head title="Staff — Nganzi Coffee" />
            <main className="min-h-full flex-1 space-y-6 bg-white p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-brown">
                        Staff
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        Manage staff accounts and role permissions.
                    </p>
                </div>

                {/* Search */}
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
                    <div className="relative min-w-56 flex-1">
                        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                        <input
                            className="nganzi-input h-9 w-full pl-9 text-xs"
                            type="search"
                            aria-label="Search verified users"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleSearch(search)
                            }
                        />
                    </div>
                    <button
                        type="button"
                        className="h-9 rounded-lg bg-orange px-4 text-xs font-semibold text-white transition-colors hover:bg-orange-hover"
                        onClick={() => handleSearch(search)}
                    >
                        Search
                    </button>
                </div>

                {/* Users Table */}
                <div className="overflow-hidden rounded-xl border border-border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-white text-xs font-semibold text-muted">
                                <tr>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Email</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="transition-colors hover:bg-stone-50/50"
                                    >
                                        <td className="px-5 py-3.5 font-semibold text-brown">
                                            {user.name}
                                            {user.isSelf && (
                                                <span className="ml-2 rounded bg-orange/15 px-2 py-0.5 text-[10px] font-semibold text-orange uppercase">
                                                    You
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-muted">
                                            {user.email}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                                    user.role
                                                        ? 'border border-orange/30 bg-orange/10 text-orange'
                                                        : 'bg-stone-100 text-stone-600'
                                                }`}
                                            >
                                                {user.roleLabel ?? 'Customer'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {user.isSelf ? (
                                                <span className="text-xs text-muted">
                                                    Protected
                                                </span>
                                            ) : (
                                                <select
                                                    className="nganzi-input h-8 text-xs"
                                                    value={user.role ?? ''}
                                                    disabled={
                                                        updatingId === user.id
                                                    }
                                                    onChange={(e) =>
                                                        handleRoleChange(
                                                            user,
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        No staff access
                                                    </option>
                                                    {roles.map((r) => (
                                                        <option
                                                            key={r.value}
                                                            value={r.value}
                                                        >
                                                            {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center text-muted"
                                        >
                                            <p className="font-medium text-brown">
                                                No users found
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <nav
                    aria-label="Staff pagination"
                    className="flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                    <span className="text-xs text-muted">
                        Page {users.current_page} of {users.last_page}
                    </span>
                    <div className="flex gap-1.5">
                        {users.links.map((link, index) => (
                            <button
                                key={`${link.label}-${index}`}
                                type="button"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url && router.visit(link.url)
                                }
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    link.active
                                        ? 'border-orange bg-orange text-white'
                                        : 'border-border bg-white text-brown hover:border-orange hover:text-orange'
                                } disabled:opacity-40`}
                            >
                                {link.label
                                    .replace(/<[^>]*>/g, '')
                                    .replace(/&laquo;/g, '«')
                                    .replace(/&raquo;/g, '»')}
                            </button>
                        ))}
                    </div>
                </nav>
            </main>
        </>
    );
}

StaffIndex.layout = { breadcrumbs };
