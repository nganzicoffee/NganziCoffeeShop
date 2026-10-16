<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            // Nullable: system-generated movements have no actor.
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            // Nullable: only set when movement is caused by a sale.
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reason');
            $table->integer('delta');          // positive = added, negative = removed
            $table->unsignedInteger('stock_before');
            $table->unsignedInteger('stock_after');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['variant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
