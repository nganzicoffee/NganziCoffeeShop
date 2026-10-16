<?php

namespace Database\Factories;

use App\Enums\InventoryReason;
use App\Models\InventoryMovement;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryMovement>
 */
class InventoryMovementFactory extends Factory
{
    public function definition(): array
    {
        $before = fake()->numberBetween(0, 100);
        $delta = fake()->numberBetween(1, 20);

        return [
            'variant_id' => ProductVariant::factory(),
            'actor_id' => null,
            'order_id' => null,
            'reason' => InventoryReason::Adjustment,
            'delta' => $delta,
            'stock_before' => $before,
            'stock_after' => $before + $delta,
            'note' => null,
        ];
    }

    public function sale(): static
    {
        return $this->state(function () {
            $before = fake()->numberBetween(1, 50);
            $delta = -fake()->numberBetween(1, $before);

            return [
                'reason' => InventoryReason::Sale,
                'delta' => $delta,
                'stock_before' => $before,
                'stock_after' => $before + $delta,
            ];
        });
    }
}
