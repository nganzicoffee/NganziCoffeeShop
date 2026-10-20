<?php

namespace App\Models;

use App\Enums\StaffRole;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property StaffRole $role
 * @property int|null $invited_by
 * @property string $token
 * @property string $code_hash
 * @property int $attempts
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $sent_at
 * @property CarbonImmutable|null $accepted_at
 * @property CarbonImmutable|null $revoked_at
 */
#[Fillable(['name', 'email', 'role', 'invited_by', 'token', 'code_hash', 'attempts', 'expires_at', 'sent_at', 'accepted_at', 'revoked_at'])]
#[Hidden(['code_hash', 'token'])]
class StaffInvitation extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'role' => StaffRole::class,
            'attempts' => 'integer',
            'expires_at' => 'immutable_datetime',
            'sent_at' => 'immutable_datetime',
            'accepted_at' => 'immutable_datetime',
            'revoked_at' => 'immutable_datetime',
        ];
    }

    public function isUsable(): bool
    {
        return $this->accepted_at === null
            && $this->revoked_at === null
            && $this->attempts < 5
            && $this->expires_at->isFuture();
    }
}
