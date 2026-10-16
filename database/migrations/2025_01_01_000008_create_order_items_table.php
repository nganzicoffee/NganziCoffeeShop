<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            // Nullable so a deleted variant doesn't orphan the history row.
            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->nullOnDelete();

            // Immutable snapshots captured at purchase time.
            $table->string('product_name');
            $table->string('variant_label');
            $table->string('sku')->nullable();
            $table->unsignedBigInteger('unit_price_minor');
            $table->unsignedSmallInteger('quantity');
            $table->unsignedBigInteger('line_total_minor');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
