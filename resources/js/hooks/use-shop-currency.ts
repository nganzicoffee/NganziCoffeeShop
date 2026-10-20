import { usePage } from '@inertiajs/react';
import { useSyncExternalStore } from 'react';
import { formatDisplayPrice } from '@/lib/price';

const preferenceKey = 'nganzi-display-currency';
const changeEvent = 'nganzi-currency-change';
let sessionPreference = 'UGX';

function snapshot(): string {
    try {
        return window.localStorage.getItem(preferenceKey) === 'USD'
            ? 'USD'
            : 'UGX';
    } catch {
        return sessionPreference;
    }
}

function subscribe(callback: () => void) {
    window.addEventListener('storage', callback);
    window.addEventListener(changeEvent, callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(changeEvent, callback);
    };
}

export function useShopCurrency() {
    const { shop } = usePage<{
        shop: { currency: string; usdExchangeRate?: number };
    }>().props;
    const preference = useSyncExternalStore(subscribe, snapshot, () => 'UGX');
    const rate = Number(shop?.usdExchangeRate ?? 0);
    const canShowUsd =
        Number.isFinite(rate) && rate > 0 && shop?.currency === 'UGX';
    const currency =
        canShowUsd && preference === 'USD' ? 'USD' : (shop?.currency ?? 'UGX');

    return {
        currency,
        canShowUsd,
        setCurrency: (value: string) => {
            sessionPreference = value === 'USD' ? 'USD' : 'UGX';
            try {
                window.localStorage.setItem(preferenceKey, sessionPreference);
            } catch {
                // The selector still works for this page when storage is blocked.
            }
            window.dispatchEvent(new Event(changeEvent));
        },
        formatPrice: (minorUnits: number, sourceCurrency: string) => {
            return formatDisplayPrice(
                minorUnits,
                sourceCurrency,
                currency,
                rate,
            );
        },
    };
}
