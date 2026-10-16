/**
 * Format a minor-unit integer price for display.
 * Currency is passed from the server via shared Inertia props.
 */
export function formatPrice(minorUnits: number, currency: string): string {
    // UGX has no decimal places; most others have 2.
    const noDecimals = [
        'UGX',
        'JPY',
        'KRW',
        'VND',
        'CLP',
        'GNF',
        'IDR',
        'KMF',
        'MGA',
        'PYG',
        'RWF',
        'XAF',
        'XOF',
    ];
    const decimals = noDecimals.includes(currency) ? 0 : 2;
    const amount = decimals === 0 ? minorUnits : minorUnits / 100;

    try {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toLocaleString()}`;
    }
}
