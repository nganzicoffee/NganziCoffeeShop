import { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatPrice } from '@/lib/price';

export type SalesTrendPoint = {
    label: string;
    full_date?: string;
    sales_minor: number;
    order_count: number;
    paid_order_count: number;
};

type Props = {
    data: SalesTrendPoint[];
    currency: string;
    periodLabel: string;
};

export function SalesTrendChart({ data, currency, periodLabel }: Props) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const totalSalesMinor = data.reduce((acc, d) => acc + d.sales_minor, 0);
    const hasAnySales = totalSalesMinor > 0;

    return (
        <section
            aria-label="Sales trend"
            className="rounded-lg border border-border bg-white p-6"
        >
            <div className="flex items-baseline justify-between pb-4">
                <div>
                    <h2 className="text-base font-bold text-brown">
                        Sales Trend
                    </h2>
                    <p className="text-xs text-muted">{periodLabel}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium tracking-wider text-muted uppercase">
                        Period Total
                    </p>
                    <p className="text-xl font-bold tracking-tight text-brown">
                        {formatPrice(totalSalesMinor, currency)}
                    </p>
                </div>
            </div>

            <div className="h-60 w-full pt-2">
                {!isMounted ? (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                        Loading...
                    </div>
                ) : !hasAnySales ? (
                    <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-border/80 bg-stone-50/40 text-xs text-muted">
                        No sales recorded for this period.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id="minimalSalesGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#F29520"
                                        stopOpacity={0.28}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#F29520"
                                        stopOpacity={0.0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--color-border)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                stroke="#A39A90"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={24}
                            />
                            <YAxis
                                stroke="#A39A90"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => {
                                    if (val === 0) return '0';
                                    if (val >= 1_000_000)
                                        return `${(val / 1_000_000).toFixed(1)}M`;
                                    if (val >= 1_000)
                                        return `${(val / 1_000).toFixed(0)}k`;
                                    return `${val}`;
                                }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length)
                                        return null;
                                    const point = payload[0]
                                        .payload as SalesTrendPoint;
                                    return (
                                        <div className="rounded border border-border bg-white px-3 py-2 text-xs shadow-sm">
                                            <p className="font-semibold text-brown">
                                                {point.full_date || point.label}
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-orange">
                                                {formatPrice(
                                                    point.sales_minor,
                                                    currency,
                                                )}
                                            </p>
                                            {point.order_count > 0 && (
                                                <p className="text-[11px] text-muted">
                                                    {point.order_count}{' '}
                                                    {point.order_count === 1
                                                        ? 'order'
                                                        : 'orders'}{' '}
                                                    ({point.paid_order_count}{' '}
                                                    paid)
                                                </p>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="sales_minor"
                                stroke="#F29520"
                                strokeWidth={2}
                                fill="url(#minimalSalesGradient)"
                                activeDot={{
                                    r: 4,
                                    stroke: '#F29520',
                                    strokeWidth: 2,
                                    fill: '#FFFFFF',
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
}
