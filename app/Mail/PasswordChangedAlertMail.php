<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class PasswordChangedAlertMail extends Mailable
{
    public function __construct(
        public readonly string $userName,
        public readonly string $changedAt,
        public readonly ?string $ipAddress,
    ) {}

    public function build(): static
    {
        return $this->subject('Security alert: Your Nganzi Coffee password was changed')
            ->view('mail.password-changed-alert');
    }
}
