<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Log;

/** Development-only SMS driver: records that a message would be sent, without the number or body. */
class LogSmsSender implements SmsSender
{
    public function send(string $phone, string $message): void
    {
        Log::info('SMS notification (log driver, not sent)', [
            'to' => NotificationRedactor::maskPhone($phone),
            'length' => mb_strlen($message),
        ]);
    }
}
