<?php

namespace App\Services\Notifications;

use Throwable;

/** Helpers that keep contact details and credentials out of logs and the delivery table. */
class NotificationRedactor
{
    public static function maskEmail(?string $email): ?string
    {
        if ($email === null || ! str_contains($email, '@')) {
            return null;
        }

        [$local, $domain] = explode('@', $email, 2);

        return mb_substr($local, 0, 1).'***@'.$domain;
    }

    public static function maskPhone(?string $phone): ?string
    {
        if ($phone === null || $phone === '') {
            return null;
        }

        $digits = preg_replace('/\D/', '', $phone) ?? '';

        return '***'.substr($digits, -3);
    }

    /** Short, single-line error summary with anything credential-like or address-like removed. */
    public static function summarise(Throwable $exception): string
    {
        $message = preg_replace('/\s+/', ' ', $exception->getMessage()) ?? '';
        $message = preg_replace('/(Bearer\s+)\S+/i', '$1[redacted]', $message) ?? '';
        $message = preg_replace('/\b(?:sk|pk|rk)_(?:live|test)_\S+/i', '[redacted]', $message) ?? '';
        $message = preg_replace(
            '/((?:password|passwd|pwd|secret|token|api[_-]?key|key|authorization|auth)\s*[=:]\s*)\S+/i',
            '$1[redacted]',
            $message,
        ) ?? '';
        $message = preg_replace('/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i', '[email]', $message) ?? '';
        $message = preg_replace('/\+?\d[\d\s-]{7,}\d/', '[number]', $message) ?? '';

        return mb_substr(class_basename($exception).': '.trim($message), 0, 480);
    }
}
