<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class StaffInvitationMail extends Mailable
{
    public function __construct(
        public readonly string $staffName,
        public readonly string $roleLabel,
        public readonly string $code,
        public readonly string $acceptUrl,
    ) {}

    public function build(): static
    {
        return $this->subject('Your Nganzi Coffee staff invitation')
            ->view('mail.staff-invitation');
    }
}
