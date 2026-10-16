<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->timestamp('inventory_reserved_until')->nullable()->index();
            $table->timestamp('inventory_released_at')->nullable();
            $table->string('customer_email')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['idempotency_key']);
            $table->dropIndex(['inventory_reserved_until']);
            $table->dropColumn([
                'idempotency_key',
                'inventory_reserved_until',
                'inventory_released_at',
            ]);
            $table->string('customer_email')->nullable(false)->change();
        });
    }
};
