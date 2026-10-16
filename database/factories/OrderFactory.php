<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->numberBetween(20000, 200000);
        $delivery = 5000;
        $tax = 0;

        return [
            'reference' => (string) Str::uuid(),
            'lookup_token' => Str::random(32),
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'customer_phone' => '+256'.fake()->numerify('#########'),
            'delivery_address' => [
                'line1' => fake()->streetAddress(),
                'city' => fake()->city(),
            ],
            'delivery_notes' => null,
            'customer_notes' => null,
            'subtotal_minor' => $subtotal,
            'delivery_fee_minor' => $delivery,
            'tax_minor' => $tax,
            'total_minor' => $subtotal + $delivery + $tax,
            'currency' => config('shop.currency', 'UGX'),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => OrderStatus::Confirmed,
            'payment_status' => PaymentStatus::Paid,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => OrderStatus::Cancelled,
            'payment_status' => PaymentStatus::Unpaid,
        ]);
    }
}
