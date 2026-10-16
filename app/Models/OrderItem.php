<?php

namespace App\Models;

use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Immutable snapshot of what was purchased.
 * Never update these rows after creation — they are the historical record.
 *
 * @property int $id
 * @property int $order_id
 * @property int|null $variant_id Nullable: variant may be deleted later.
 * @property string $product_name Snapshot at purchase time.
 * @property string $variant_label Snapshot at purchase time (e.g. "250g").
 * @property string|null $sku Snapshot at purchase time.
 * @property int $unit_price_minor Snapshot at purchase time.
 * @property int $quantity
 * @property int $line_total_minor unit_price_minor × quantity, stored for integrity.
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'order_id', 'variant_id',
    'product_name', 'variant_label', 'sku',
    'unit_price_minor', 'quantity', 'line_total_minor',
])]
class OrderItem extends Model
{
    /** @use HasFactory<OrderItemFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'unit_price_minor' => 'integer',
            'quantity' => 'integer',
            'line_total_minor' => 'integer',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<ProductVariant, $this> */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
