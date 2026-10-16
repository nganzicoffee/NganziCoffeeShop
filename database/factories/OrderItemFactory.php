<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    public function definition(): array
    {
        $unitPrice = fake()->numberBetween(10000, 80000);
        $quantity = fake()->numberBetween(1, 3);

        return [
            'order_id' => Order::factory(),
            'variant_id' => ProductVariant::factory(),
            'product_name' => fake()->words(3, true),
            'variant_label' => fake()->randomElement(['100g', '250g', '500g', '1kg']),
            'sku' => strtoupper(Str::random(8)),
            'unit_price_minor' => $unitPrice,
            'quantity' => $quantity,
            'line_total_minor' => $unitPrice * $quantity,
        ];
    }
}
