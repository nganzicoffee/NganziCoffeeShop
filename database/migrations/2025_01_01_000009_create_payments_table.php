<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider');                      // e.g. 'manual'
            $table->string('provider_reference')->nullable(); // provider's tx ID
            $table->unsignedBigInteger('amount_minor');
            $table->string('currency', 3);
            $table->string('status');
            // Non-sensitive provider metadata only — never card data or secrets.
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'status']);
            $table->index('provider_reference');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
