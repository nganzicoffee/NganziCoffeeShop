<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    public function definition(): array
    {
        $label = fake()->randomElement(['100g', '250g', '500g', '1kg']);

        return [
            'product_id' => Product::factory(),
            'label' => $label,
            'sku' => strtoupper(Str::random(8)),
            'price_minor' => fake()->numberBetween(10000, 80000), // UGX range placeholder
            'stock' => fake()->numberBetween(5, 50),
            'active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['active' => false]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn () => ['stock' => 0]);
    }
}
