<?php

namespace Database\Factories;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        /** @var list<string> $words */
        $words = fake()->unique()->words(3);
        $name = implode(' ', $words);

        return [
            'category_id' => Category::factory(),
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'description' => fake()->paragraph(),
            'status' => ProductStatus::Draft,
            'featured' => false,
            'seo_title' => null,
            'seo_description' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => ['status' => ProductStatus::Published]);
    }

    public function featured(): static
    {
        return $this->state(fn () => [
            'status' => ProductStatus::Published,
            'featured' => true,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => ProductStatus::Archived]);
    }
}
