<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('reference')->unique();
            $table->string('lookup_token', 64)->unique();

            // Fulfilment and payment states are separate columns.
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('unpaid');

            // Customer contact snapshot — captured at order time.
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');

            // Delivery snapshot — JSON so structure can evolve without schema changes.
            $table->json('delivery_address');
            $table->text('delivery_notes')->nullable();
            $table->text('customer_notes')->nullable();

            // Money — all in smallest currency unit (e.g. UGX shillings).
            $table->unsignedBigInteger('subtotal_minor');
            $table->unsignedBigInteger('delivery_fee_minor')->default(0);
            $table->unsignedBigInteger('tax_minor')->default(0);
            $table->unsignedBigInteger('total_minor');
            $table->string('currency', 3);

            $table->timestamps();

            $table->index(['status', 'payment_status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
