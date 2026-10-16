<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * DevSeeder runs only in local/testing environments.
     * Never seed development sample data in production.
     */
    public function run(): void
    {
        if (app()->environment(['local', 'testing'])) {
            $this->call(DevSeeder::class);
        }
    }
}
