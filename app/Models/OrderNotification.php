<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Delivery record for one customer-facing order message on one channel.
 *
 * @property int $id
 * @property int $order_id
 * @property string $type
 * @property string $channel
 * @property string $dedupe_key
 * @property string|null $recipient_hint
 * @property array<string, mixed>|null $context
 * @property string $status
 * @property int $attempts
 * @property string|null $last_error
 * @property Carbon|null $sent_at
 * @property Carbon|null $failed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'order_id', 'type', 'channel', 'dedupe_key', 'recipient_hint', 'context',
    'status', 'attempts', 'last_error', 'sent_at', 'failed_at',
])]
class OrderNotification extends Model
{
    public const TYPE_ORDER_RECEIVED = 'order_received';

    public const TYPE_PAYMENT_CONFIRMED = 'payment_confirmed';

    public const TYPE_STATUS_UPDATED = 'status_updated';

    public const CHANNEL_EMAIL = 'mail';

    public const CHANNEL_SMS = 'sms';

    public const STATUS_QUEUED = 'queued';

    public const STATUS_SENT = 'sent';

    public const STATUS_FAILED = 'failed';

    public const STATUS_SKIPPED = 'skipped';

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'attempts' => 'integer',
            'sent_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            self::TYPE_ORDER_RECEIVED => 'Order received',
            self::TYPE_PAYMENT_CONFIRMED => 'Payment confirmed',
            self::TYPE_STATUS_UPDATED => 'Status update: '.($this->context['to_label'] ?? 'updated'),
            default => $this->type,
        };
    }
}
