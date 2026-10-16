<?php

namespace App\Services\Notifications;

/**
 * Transport for SMS/WhatsApp messages.
 *
 * Only a development "log" driver ships with the app. A real provider must be
 * approved by the business, implemented against this interface, and bound in
 * AppServiceProvider before NOTIFY_SMS_ENABLED is switched on.
 */
interface SmsSender
{
    /** Throw on failure so the queued job can retry. */
    public function send(string $phone, string $message): void;
}
