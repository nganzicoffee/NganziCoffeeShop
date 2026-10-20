import { useShopCurrency } from '@/hooks/use-shop-currency';

export default function ShopPrice({
    amount,
    currency,
}: {
    amount: number;
    currency: string;
}) {
    const display = useShopCurrency();
    return <>{display.formatPrice(amount, currency)}</>;
}
