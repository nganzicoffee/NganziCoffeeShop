<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $reference Public order reference (UUID).
 * @property string $lookup_token Secure token for unauthenticated order lookup.
 * @property string $idempotency_key Checkout submission deduplication key.
 * @property OrderStatus $status
 * @property PaymentStatus $payment_status
 * @property string $customer_name
 * @property string|null $customer_email
 * @property string $customer_phone
 * @property string $delivery_address JSON snapshot of delivery details.
 * @property string|null $delivery_notes
 * @property string|null $customer_notes
 * @property string|null $internal_notes
 * @property int $subtotal_minor
 * @property int $delivery_fee_minor
 * @property int $tax_minor
 * @property int $total_minor
 * @property string $currency
 * @property Carbon|null $inventory_reserved_until
 * @property Carbon|null $inventory_released_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'reference', 'lookup_token', 'idempotency_key',
    'status', 'payment_status',
    'customer_name', 'customer_email', 'customer_phone',
    'delivery_address', 'delivery_notes', 'customer_notes', 'internal_notes',
    'subtotal_minor', 'delivery_fee_minor', 'tax_minor', 'total_minor',
    'currency', 'inventory_reserved_until', 'inventory_released_at',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
            'delivery_address' => 'array',
            'subtotal_minor' => 'integer',
            'delivery_fee_minor' => 'integer',
            'tax_minor' => 'integer',
            'total_minor' => 'integer',
            'inventory_reserved_until' => 'datetime',
            'inventory_released_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order): void {
            $order->reference ??= (string) Str::uuid();
            $order->lookup_token ??= Str::random(64);
        });
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** @return HasMany<OrderStatusHistory, $this> */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    /** @return HasOne<Payment, $this> */
    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    /** @return HasMany<OrderNotification, $this> */
    public function notifications(): HasMany
    {
        return $this->hasMany(OrderNotification::class);
    }
}
