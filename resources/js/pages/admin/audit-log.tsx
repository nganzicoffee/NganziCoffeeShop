import { Head, router } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';

type AuditEntry = {
    event: string;
    actor: string;
    subject: string | null;
    subjectId: number | string | null;
    details: Record<string, unknown> | null;
    createdAt: string | null;
};

type Props = {
    entries: {
        data: AuditEntry[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Audit Log', href: '/admin/audit-log' },
];

export default function AuditLogIndex({ entries }: Props) {
    return (
        <>
            <Head title="Audit Log — Nganzi Coffee" />
            <main className="min-h-full flex-1 space-y-6 bg-white p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-brown">
                        Audit Log
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        System activity log for administrative actions.
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-white text-xs font-semibold text-muted">
                                <tr>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3">Event</th>
                                    <th className="px-5 py-3">Staff</th>
                                    <th className="px-5 py-3">Target</th>
                                    <th className="px-5 py-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {entries.data.map((entry, index) => (
                                    <tr
                                        key={`${entry.createdAt}-${index}`}
                                        className="transition-colors hover:bg-stone-50/50"
                                    >
                                        <td className="px-5 py-3.5 text-xs whitespace-nowrap text-muted">
                                            {entry.createdAt ?? '—'}
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-orange">
                                            {entry.event}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs font-medium text-brown">
                                            {entry.actor}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-muted">
                                            {entry.subject
                                                ? `${entry.subject} #${entry.subjectId ?? '—'}`
                                                : '—'}
                                        </td>
                                        <td className="max-w-md px-5 py-3.5 text-xs text-muted">
                                            {entry.details ? (
                                                <pre className="overflow-x-auto rounded border border-border/60 bg-stone-50 p-2 font-mono text-[11px] leading-relaxed text-brown">
                                                    {JSON.stringify(
                                                        entry.details,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {entries.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-12 text-center text-muted"
                                        >
                                            <p className="font-medium text-brown">
                                                No audit events recorded
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
                    aria-label="Audit pagination"
                    className="flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                    <span className="text-xs text-muted">
                        Page {entries.current_page} of {entries.last_page}
                    </span>
                    <div className="flex gap-1.5">
                        {entries.links.map((link, index) => (
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

AuditLogIndex.layout = { breadcrumbs };
