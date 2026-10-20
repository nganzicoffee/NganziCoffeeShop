<?php

namespace App\Console\Commands;

use App\Enums\StaffRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateStaffUser extends Command
{
    protected $signature = 'staff:create
                            {email? : The email address of the staff member}
                            {--name= : Full name of the staff member}
                            {--role=owner : Role (owner, order_manager, inventory_manager, reporting)}
                            {--password= : Optional password (prompted if omitted)}';

    protected $description = 'Create a staff or administrative user for production or local operations';

    public function handle(): int
    {
        $email = $this->argument('email') ?? $this->ask('Staff member email address');
        if (! is_string($email) || trim($email) === '') {
            $this->error('Email address is required.');

            return self::FAILURE;
        }

        $email = strtolower(trim($email));

        if (User::where('email', $email)->exists()) {
            $this->error("A user with email [{$email}] already exists.");

            return self::FAILURE;
        }

        $name = $this->option('name') ?? $this->ask('Full name');
        if (! is_string($name) || trim($name) === '') {
            $this->error('Name is required.');

            return self::FAILURE;
        }

        $roleInput = $this->option('role');
        $role = is_string($roleInput) ? StaffRole::tryFrom($roleInput) : null;
        if (! $role) {
            $selectedRole = $this->choice(
                'Select role',
                [
                    StaffRole::Owner->value => 'Owner / Admin (full access)',
                    StaffRole::OrderManager->value => 'Order Manager (manage orders & customers)',
                    StaffRole::InventoryManager->value => 'Inventory Manager (manage stock & catalogue)',
                    StaffRole::Reporting->value => 'Reporting (read-only views)',
                ],
                StaffRole::Owner->value
            );
            $role = is_string($selectedRole) ? StaffRole::from($selectedRole) : StaffRole::Owner;
        }

        $password = $this->option('password') ?? $this->secret('Password');
        if (! is_string($password) || trim($password) === '') {
            $this->error('Password cannot be empty.');

            return self::FAILURE;
        }

        $validator = Validator::make([
            'email' => $email,
            'name' => $name,
            'password' => $password,
        ], [
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', Password::min(8)],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        // This trusted CLI command provisions verified staff accounts.
        $user = User::forceCreate([
            'name' => trim($name),
            'email' => $email,
            'role' => $role,
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        $this->info("Staff member [{$user->name}] ({$user->email}) created successfully with role [{$role->label()}].");

        return self::SUCCESS;
    }
}
