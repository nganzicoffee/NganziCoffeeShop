import { Link } from '@inertiajs/react';

export type FulfilmentItem = {
    status: string;
    label: string;
    count: number;
};

type Props = {
    items: FulfilmentItem[];
    totalUnfulfilled: number;
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#F59E0B', // Amber
    confirmed: '#0EA5E9', // Sky blue
    processing: '#6366F1', // Indigo
    ready_to_dispatch: '#F29520', // Brand Orange
    dispatched: '#10B981', // Emerald
};

const DEFAULT_COLOR = '#756C64';

export function FulfilmentStatusChart({ items, totalUnfulfilled }: Props) {
    const activeItems = items.filter((item) => item.count > 0);
    const hasBacklog = totalUnfulfilled > 0 && activeItems.length > 0;

    return (
        <section className="rounded-lg border border-border bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-brown">
                    Fulfilment Backlog
                </h2>
                <span className="text-xs font-semibold text-muted">
                    {totalUnfulfilled} open
                </span>
            </div>

            {hasBacklog ? (
                <div>
                    {/* Minimalist segmented distribution bar */}
                    <div className="mb-4 flex h-2 w-full overflow-hidden rounded-full bg-stone-100">
                        {activeItems.map((item) => {
                            const pct = Math.max(
                                2,
                                Math.round(
                                    (item.count / totalUnfulfilled) * 100,
                                ),
                            );
                            return (
                                <div
                                    key={item.status}
                                    style={{
                                        width: `${pct}%`,
                                        backgroundColor:
                                            STATUS_COLORS[item.status] ||
                                            DEFAULT_COLOR,
                                    }}
                                    title={`${item.label}: ${item.count}`}
                                />
                            );
                        })}
                    </div>

                    {/* Status rows */}
                    <div className="divide-y divide-border/60 text-xs">
                        {items.map((item) => {
                            const color =
                                STATUS_COLORS[item.status] || DEFAULT_COLOR;
                            return (
                                <Link
                                    key={item.status}
                                    href={`/admin/orders?status=${item.status}`}
                                    className="flex items-center justify-between py-2 transition-colors first:pt-1 last:pb-0 hover:text-orange"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="size-2 shrink-0 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-brown">
                                            {item.label}
                                        </span>
                                    </div>
                                    <span className="font-bold text-brown">
                                        {item.count}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <p className="py-4 text-xs text-muted">
                    All caught up — no open orders.
                </p>
            )}
        </section>
    );
}
