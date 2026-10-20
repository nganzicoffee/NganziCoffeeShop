<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class PasswordChangeCodeMail extends Mailable
{
    public function __construct(
        public readonly string $userName,
        public readonly string $code,
    ) {}

    public function build(): static
    {
        return $this->subject('Your Nganzi Coffee password verification code')
            ->view('mail.password-change-code');
    }
}
