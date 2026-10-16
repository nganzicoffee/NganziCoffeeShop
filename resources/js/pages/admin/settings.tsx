import { Head, useForm } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';

type SettingsData = {
    delivery_fee: number;
    free_delivery_above: number;
    delivery_areas: string;
    reservation_hours: number;
    tax_enabled: boolean;
    tax_rate: number;
    tax_inclusive: boolean;
};

type Props = {
    currency: string;
    settings: SettingsData;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Store Settings', href: '/admin/settings' },
];

export default function StoreSettings({ currency, settings }: Props) {
    const form = useForm<SettingsData>({
        delivery_fee: settings.delivery_fee,
        free_delivery_above: settings.free_delivery_above,
        delivery_areas: settings.delivery_areas,
        reservation_hours: settings.reservation_hours,
        tax_enabled: settings.tax_enabled,
        tax_rate: settings.tax_rate,
        tax_inclusive: settings.tax_inclusive,
    });

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/admin/settings', { preserveScroll: true });
    }

    return (
        <>
            <Head title="Store Settings — Nganzi Coffee" />
            <main className="min-h-full flex-1 space-y-6 bg-white p-6 md:p-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-brown">
                        Store Settings
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        Delivery rules, stock reservation timeout, and tax
                        configuration.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl space-y-6 rounded-xl border border-border bg-white p-6"
                >
                    {/* Delivery Section */}
                    <section className="space-y-4">
                        <h2 className="border-b border-border pb-2.5 text-sm font-bold text-brown">
                            Delivery
                        </h2>

                        <div className="grid gap-1.5">
                            <label
                                className="text-xs font-semibold text-brown"
                                htmlFor="delivery_fee"
                            >
                                Standard Delivery Fee ({currency})
                            </label>
                            <input
                                id="delivery_fee"
                                type="number"
                                min="0"
                                className="nganzi-input h-9 text-sm"
                                value={form.data.delivery_fee}
                                onChange={(e) =>
                                    form.setData(
                                        'delivery_fee',
                                        Number(e.target.value),
                                    )
                                }
                                required
                            />
                            {form.errors.delivery_fee && (
                                <p className="text-xs text-red-600">
                                    {form.errors.delivery_fee}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <label
                                className="text-xs font-semibold text-brown"
                                htmlFor="free_delivery_above"
                            >
                                Free Delivery Threshold ({currency})
                            </label>
                            <input
                                id="free_delivery_above"
                                type="number"
                                min="0"
                                className="nganzi-input h-9 text-sm"
                                value={form.data.free_delivery_above}
                                onChange={(e) =>
                                    form.setData(
                                        'free_delivery_above',
                                        Number(e.target.value),
                                    )
                                }
                                required
                            />
                            <p className="text-xs text-muted">
                                0 disables free delivery.
                            </p>
                            {form.errors.free_delivery_above && (
                                <p className="text-xs text-red-600">
                                    {form.errors.free_delivery_above}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <label
                                className="text-xs font-semibold text-brown"
                                htmlFor="delivery_areas"
                            >
                                Delivery Areas
                            </label>
                            <textarea
                                id="delivery_areas"
                                rows={3}
                                className="nganzi-input w-full text-sm"
                                value={form.data.delivery_areas}
                                onChange={(e) =>
                                    form.setData(
                                        'delivery_areas',
                                        e.target.value,
                                    )
                                }
                                placeholder="Kampala Central, Nakawa, Makindye, Entebbe…"
                            />
                            <p className="text-xs text-muted">
                                Comma-separated delivery zones.
                            </p>
                            {form.errors.delivery_areas && (
                                <p className="text-xs text-red-600">
                                    {form.errors.delivery_areas}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <label
                                className="text-xs font-semibold text-brown"
                                htmlFor="reservation_hours"
                            >
                                Stock Reservation Duration (Hours)
                            </label>
                            <input
                                id="reservation_hours"
                                type="number"
                                min="1"
                                max="720"
                                className="nganzi-input h-9 text-sm"
                                value={form.data.reservation_hours}
                                onChange={(e) =>
                                    form.setData(
                                        'reservation_hours',
                                        Number(e.target.value),
                                    )
                                }
                                required
                            />
                            {form.errors.reservation_hours && (
                                <p className="text-xs text-red-600">
                                    {form.errors.reservation_hours}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Tax Section */}
                    <section className="space-y-4 border-t border-border pt-5">
                        <h2 className="border-b border-border pb-2.5 text-sm font-bold text-brown">
                            Tax
                        </h2>

                        <div className="flex items-center gap-2.5">
                            <input
                                id="tax_enabled"
                                type="checkbox"
                                className="size-4 rounded border-border text-orange focus:ring-orange"
                                checked={form.data.tax_enabled}
                                onChange={(e) =>
                                    form.setData(
                                        'tax_enabled',
                                        e.target.checked,
                                    )
                                }
                            />
                            <label
                                className="cursor-pointer text-xs font-semibold text-brown"
                                htmlFor="tax_enabled"
                            >
                                Enable tax calculation at checkout
                            </label>
                        </div>

                        <div className="grid gap-1.5">
                            <label
                                className="text-xs font-semibold text-brown"
                                htmlFor="tax_rate"
                            >
                                Tax Rate (%)
                            </label>
                            <input
                                id="tax_rate"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                className="nganzi-input h-9 text-sm"
                                value={form.data.tax_rate}
                                onChange={(e) =>
                                    form.setData(
                                        'tax_rate',
                                        Number(e.target.value),
                                    )
                                }
                                required
                            />
                            {form.errors.tax_rate && (
                                <p className="text-xs text-red-600">
                                    {form.errors.tax_rate}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5">
                            <input
                                id="tax_inclusive"
                                type="checkbox"
                                className="size-4 rounded border-border text-orange focus:ring-orange"
                                checked={form.data.tax_inclusive}
                                onChange={(e) =>
                                    form.setData(
                                        'tax_inclusive',
                                        e.target.checked,
                                    )
                                }
                            />
                            <label
                                className="cursor-pointer text-xs font-semibold text-brown"
                                htmlFor="tax_inclusive"
                            >
                                Product prices are tax-inclusive
                            </label>
                        </div>
                    </section>

                    <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                        {form.recentlySuccessful && (
                            <span className="text-xs font-medium text-emerald-700">
                                Saved.
                            </span>
                        )}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-lg bg-orange px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-hover disabled:opacity-50"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </main>
        </>
    );
}

StoreSettings.layout = { breadcrumbs };
