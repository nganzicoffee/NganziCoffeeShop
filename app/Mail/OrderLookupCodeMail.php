<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class OrderLookupCodeMail extends Mailable
{
    public function __construct(
        public readonly string $code,
    ) {}

    public function build(): static
    {
        return $this->subject('Your Nganzi Coffee order lookup code')
            ->view('mail.order-lookup-code');
    }
}
