<?php

namespace App\Services;

use App\Mail\PasswordChangeCodeMail;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class PasswordChangeVerificationService
{
    private const int TTL_MINUTES = 10;

    private const int MAX_ATTEMPTS = 5;

    public function hasActiveCode(User $user): bool
    {
        $payload = $this->getPayload($user);

        return $payload !== null
            && $payload['attempts'] < self::MAX_ATTEMPTS
            && $payload['expires_at'] > now()->getTimestamp();
    }

    public function sendCode(User $user): void
    {
        if (app()->isProduction() && ! in_array(config('mail.default'), ['smtp', 'sendmail', 'ses', 'postmark', 'resend'], true)) {
            throw ValidationException::withMessages([
                'code' => 'Configure outgoing email before sending password verification codes.',
            ]);
        }

        $existing = $this->getPayload($user);
        if ($existing !== null && $existing['sent_at'] > now()->subMinute()->getTimestamp()) {
            throw ValidationException::withMessages([
                'code' => 'Wait one minute before requesting another verification code.',
            ]);
        }

        $code = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(self::TTL_MINUTES);

        Cache::put($this->cacheKey($user), [
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'sent_at' => now()->getTimestamp(),
            'expires_at' => $expiresAt->getTimestamp(),
        ], $expiresAt);

        try {
            Mail::to($user->email)->send(new PasswordChangeCodeMail($user->name, $code));
        } catch (Throwable) {
            Cache::forget($this->cacheKey($user));

            throw ValidationException::withMessages([
                'code' => 'Email delivery failed. Check outgoing email settings, then request a new code.',
            ]);
        }

        AuditLog::create([
            'actor_id' => $user->id,
            'event' => 'security.password_code_sent',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'details' => ['email' => $user->email],
        ]);
    }

    public function verifyAndConsume(User $user, string $code): void
    {
        $payload = $this->getPayload($user);

        if (
            $payload === null
            || $payload['attempts'] >= self::MAX_ATTEMPTS
            || $payload['expires_at'] <= now()->getTimestamp()
        ) {
            Cache::forget($this->cacheKey($user));

            throw ValidationException::withMessages([
                'code' => 'This verification code has expired or is no longer valid. Request a new code.',
            ]);
        }

        if (! Hash::check($code, $payload['code_hash'])) {
            $attempts = $payload['attempts'] + 1;

            if ($attempts >= self::MAX_ATTEMPTS) {
                Cache::forget($this->cacheKey($user));
            } else {
                $payload['attempts'] = $attempts;
                Cache::put(
                    $this->cacheKey($user),
                    $payload,
                    now()->setTimestamp($payload['expires_at']),
                );
            }

            throw ValidationException::withMessages([
                'code' => 'The verification code is incorrect. After five incorrect attempts, a new code is required.',
            ]);
        }

        Cache::forget($this->cacheKey($user));
    }

    /**
     * @return array{code_hash: string, attempts: int, sent_at: int, expires_at: int}|null
     */
    private function getPayload(User $user): ?array
    {
        $value = Cache::get($this->cacheKey($user));

        if (! is_array($value)) {
            return null;
        }

        if (
            ! isset($value['code_hash'], $value['attempts'], $value['sent_at'], $value['expires_at'])
            || ! is_string($value['code_hash'])
            || ! is_int($value['attempts'])
            || ! is_int($value['sent_at'])
            || ! is_int($value['expires_at'])
        ) {
            return null;
        }

        return $value;
    }

    private function cacheKey(User $user): string
    {
        return "password_change_otp:{$user->id}";
    }
}
