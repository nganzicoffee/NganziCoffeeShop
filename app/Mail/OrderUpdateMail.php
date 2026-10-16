<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Customer order email. Sent synchronously from within SendOrderNotification,
 * which already runs on the queue and owns retry/backoff and delivery logging.
 */
class OrderUpdateMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{subject: string, headline: string, intro: string, next_steps: string, sms: string}  $message
     */
    public function __construct(
        public Order $order,
        public array $message,
        public string $shortReference,
        public string $totalFormatted,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->message['subject']);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.update',
            with: [
                'customerFirstName' => strtok($this->order->customer_name, ' ') ?: $this->order->customer_name,
                'headline' => $this->message['headline'],
                'intro' => $this->message['intro'],
                'nextSteps' => $this->message['next_steps'],
                'items' => $this->order->items,
                'totalFormatted' => $this->totalFormatted,
                'shortReference' => $this->shortReference,
                'orderUrl' => route('orders.confirmation', [
                    'reference' => $this->order->reference,
                    'lookupToken' => $this->order->lookup_token,
                ]),
                'supportEmail' => config('shop.support.email'),
                'supportPhone' => config('shop.support.phone'),
            ],
        );
    }
}
