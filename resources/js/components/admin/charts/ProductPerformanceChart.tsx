import { formatPrice } from '@/lib/price';

export type ProductPerformanceItem = {
    product_name: string;
    variant_label: string;
    sku: string | null;
    units_sold: number;
    revenue_minor: number;
};

type Props = {
    items: ProductPerformanceItem[];
    currency: string;
    canExport?: boolean;
    dateRangeLabel?: string;
    exportUrl?: string;
};

export function ProductPerformanceChart({
    items,
    currency,
    canExport = false,
    dateRangeLabel,
    exportUrl,
}: Props) {
    const maxRevenue = items.reduce(
        (max, item) => Math.max(max, item.revenue_minor),
        0,
    );

    return (
        <section className="rounded-lg border border-border bg-white p-6">
            <div className="mb-5 flex items-center justify-between border-b border-border/70 pb-4">
                <div>
                    <h2 className="text-sm font-bold text-brown">
                        Top Products
                    </h2>
                    <p className="text-xs text-muted">
                        Sales breakdown{' '}
                        {dateRangeLabel ? `(${dateRangeLabel})` : ''}
                    </p>
                </div>

                {canExport && exportUrl && (
                    <a
                        href={exportUrl}
                        className="rounded border border-border bg-white px-2.5 py-1 text-xs font-semibold text-brown transition-colors hover:border-orange hover:text-orange"
                    >
                        Export CSV
                    </a>
                )}
            </div>

            {items.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted">
                    No product sales recorded in this date range.
                </p>
            ) : (
                <div className="space-y-4">
                    {items.map((row, idx) => {
                        const pct =
                            maxRevenue > 0
                                ? Math.round(
                                      (row.revenue_minor / maxRevenue) * 100,
                                  )
                                : 0;
                        return (
                            <div
                                key={`${row.product_name}-${row.variant_label}-${idx}`}
                                className="group"
                            >
                                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                                    <div className="truncate pr-3">
                                        <span className="font-semibold text-brown">
                                            {row.product_name}
                                        </span>
                                        <span className="ml-1.5 text-muted">
                                            · {row.variant_label}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-4 text-right">
                                        <span className="text-[11px] text-muted">
                                            {row.units_sold} sold
                                        </span>
                                        <span className="min-w-[70px] font-bold text-brown">
                                            {formatPrice(
                                                row.revenue_minor,
                                                currency,
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {/* Minimalist graph bar */}
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                                    <div
                                        className="h-full rounded-full bg-orange transition-all duration-300 group-hover:bg-orange-hover"
                                        style={{
                                            width: `${Math.max(pct, 2)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
