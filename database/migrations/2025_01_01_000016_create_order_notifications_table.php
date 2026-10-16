<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);      // order_received | payment_confirmed | status_updated
            $table->string('channel', 20);   // mail | sms
            // One row per logical message; the unique key makes retries and repeat saves no-ops.
            $table->string('dedupe_key', 191)->unique();
            // Masked recipient only (e.g. "j***@example.com"); full contact lives on the order.
            $table->string('recipient_hint')->nullable();
            $table->json('context')->nullable();
            $table->string('status', 20)->default('queued'); // queued | sent | failed | skipped
            $table->unsignedSmallInteger('attempts')->default(0);
            // Sanitised, truncated error summary — never credentials or full payloads.
            $table->string('last_error', 500)->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_notifications');
    }
};
