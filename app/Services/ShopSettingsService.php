<?php

namespace App\Services;

use App\Models\StoreSetting;

class ShopSettingsService
{
    public function deliveryFee(int $subtotal): int
    {
        $freeAbove = $this->integer('free_delivery_above', (int) config('shop.delivery.free_above', 0));

        return $freeAbove > 0 && $subtotal >= $freeAbove
            ? 0
            : max(0, $this->integer('delivery_flat_fee', (int) config('shop.delivery.flat_fee', 0)));
    }

    public function reservationHours(): int
    {
        return max(1, $this->integer('reservation_hours', (int) config('shop.delivery.reservation_hours', 24)));
    }

    public function taxEnabled(): bool
    {
        return $this->boolean('tax_enabled', (bool) config('shop.tax.enabled', false));
    }

    public function taxRate(): float
    {
        return max(0, $this->decimal('tax_rate', (float) config('shop.tax.rate', 0)));
    }

    public function taxInclusive(): bool
    {
        return $this->boolean('tax_inclusive', (bool) config('shop.tax.inclusive', true));
    }

    public function integer(string $key, int $default): int
    {
        $value = StoreSetting::get($key);

        return $value === null ? $default : (int) $value;
    }

    public function decimal(string $key, float $default): float
    {
        $value = StoreSetting::get($key);

        return $value === null ? $default : (float) $value;
    }

    public function boolean(string $key, bool $default): bool
    {
        $value = StoreSetting::get($key);

        return $value === null ? $default : filter_var($value, FILTER_VALIDATE_BOOL);
    }

    /**
     * @param  list<string>  $default
     * @return list<string>
     */
    public function areas(array $default): array
    {
        $value = StoreSetting::get('delivery_areas');

        return $value === null
            ? $default
            : array_values(array_filter(array_map('trim', explode(',', $value))));
    }
}
