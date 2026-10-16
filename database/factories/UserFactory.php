<?php

namespace Database\Factories;

use App\Enums\StaffRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => null,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }

    public function owner(): static
    {
        return $this->state(fn () => ['role' => StaffRole::Owner]);
    }

    public function orderManager(): static
    {
        return $this->state(fn () => ['role' => StaffRole::OrderManager]);
    }

    public function inventoryManager(): static
    {
        return $this->state(fn () => ['role' => StaffRole::InventoryManager]);
    }

    public function reporting(): static
    {
        return $this->state(fn () => ['role' => StaffRole::Reporting]);
    }

    /**
     * Stub — 2FA is not yet enabled.
     */
    public function withTwoFactor(): static
    {
        return $this;
    }
}
