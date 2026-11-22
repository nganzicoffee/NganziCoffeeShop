<?php

namespace App\Http\Controllers\Shop;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Mail\OrderLookupCodeMail;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OrderLookupController extends Controller
{
    private const int CODE_TTL_MINUTES = 10;

    private const int CODE_COOLDOWN_SECONDS = 60;

    private const int MAX_CODE_ATTEMPTS = 5;

    private const int ACCESS_TTL_MINUTES = 20;

    public function index(Request $request): Response
    {
        $state = $request->session()->get('order_lookup', []);
        $email = $state['verified_email'] ?? null;
        $verifiedUntil = $state['verified_until'] ?? 0;

        if (is_string($email) && $verifiedUntil > now()->timestamp) {
            $orders = Order::query()
                ->whereRaw('LOWER(TRIM(customer_email)) = ?', [Str::lower($email)])
                ->with('items')
                ->latest()
                ->get()
                ->map(fn (Order $order): array => [
                    'reference' => $order->reference,
                    'status' => $order->status->value,
                    'statusLabel' => $order->status->label(),
                    'category' => match ($order->status) {
                        OrderStatus::Completed => 'completed',
                        OrderStatus::Cancelled => 'cancelled',
                        default => 'active',
                    },
                    'paymentStatus' => $order->payment_status->label(),
                    'createdAt' => $order->created_at?->toAtomString(),
                    'items' => $order->items->map(fn ($item): array => [
                        'productName' => $item->product_name,
                        'variantLabel' => $item->variant_label,
                        'quantity' => $item->quantity,
                    ])->values(),
                    'total' => $order->total_minor,
                    'currency' => $order->currency,
                ])
                ->values();

            return Inertia::render('shop/order-lookup', [
                'step' => 'orders',
                'email' => $email,
                'notice' => $request->session()->pull('order_lookup_notice'),
                'orders' => $orders,
            ]);
        }

        if ($email !== null || isset($state['verified_until'])) {
            $request->session()->forget('order_lookup');
            $request->session()->flash('order_lookup_notice', 'Your secure order lookup expired. Enter your email to start again.');
        }

        $state = $request->session()->get('order_lookup', []);
        $pendingEmail = $state['pending_email'] ?? null;

        return Inertia::render('shop/order-lookup', [
            'step' => is_string($pendingEmail) ? 'code' : 'email',
            'email' => is_string($pendingEmail) ? $pendingEmail : null,
            'emailHint' => is_string($pendingEmail) ? $this->maskEmail($pendingEmail) : null,
            'notice' => $request->session()->pull('order_lookup_notice'),
            'orders' => [],
        ]);
    }

    public function requestCode(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);
        $email = Str::lower(trim($data['email']));
        $cacheKey = $this->codeCacheKey($email);
        $payload = Cache::get($cacheKey);

        $request->session()->put('order_lookup', ['pending_email' => $email]);

        if (
            is_array($payload)
            && ($payload['sent_at'] ?? 0) > now()->subSeconds(self::CODE_COOLDOWN_SECONDS)->timestamp
            && ($payload['expires_at'] ?? 0) > now()->timestamp
        ) {
            return redirect()->route('orders.lookup')->with(
                'order_lookup_notice',
                'If an order is associated with that email, a code has been sent. Wait a minute before requesting another.',
            );
        }

        if (app()->isProduction() && ! in_array(config('mail.default'), ['smtp', 'sendmail', 'ses', 'postmark', 'resend'], true)) {
            throw ValidationException::withMessages([
                'email' => 'Order lookup email is not available right now. Please contact the shop.',
            ]);
        }

        $code = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(self::CODE_TTL_MINUTES);
        Cache::put($cacheKey, [
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'sent_at' => now()->timestamp,
            'expires_at' => $expiresAt->timestamp,
        ], $expiresAt);

        try {
            Mail::to($email)->send(new OrderLookupCodeMail($code));
        } catch (Throwable) {
            Cache::forget($cacheKey);
            $request->session()->forget('order_lookup');

            throw ValidationException::withMessages([
                'email' => 'We could not send the code. Check the email address and try again shortly.',
            ]);
        }

        return redirect()->route('orders.lookup')->with(
            'order_lookup_notice',
            'If an order is associated with that email, a six-digit code has been sent. It expires in 10 minutes.',
        );
    }

    public function verifyCode(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:6', 'regex:/^\d{6}$/'],
        ]);
        $state = $request->session()->get('order_lookup', []);
        $email = $state['pending_email'] ?? null;

        if (! is_string($email)) {
            return redirect()->route('orders.lookup');
        }

        $cacheKey = $this->codeCacheKey($email);
        $payload = Cache::get($cacheKey);

        if (
            ! is_array($payload)
            || ! is_string($payload['code_hash'] ?? null)
            || ($payload['attempts'] ?? self::MAX_CODE_ATTEMPTS) >= self::MAX_CODE_ATTEMPTS
            || ($payload['expires_at'] ?? 0) <= now()->timestamp
        ) {
            Cache::forget($cacheKey);

            throw ValidationException::withMessages([
                'code' => 'This code has expired or is no longer valid. Request a new one.',
            ]);
        }

        if (! Hash::check($data['code'], $payload['code_hash'])) {
            $attempts = $payload['attempts'] + 1;

            if ($attempts >= self::MAX_CODE_ATTEMPTS) {
                Cache::forget($cacheKey);
            } else {
                $payload['attempts'] = $attempts;
                Cache::put(
                    $cacheKey,
                    $payload,
                    now()->setTimestamp($payload['expires_at']),
                );
            }

            throw ValidationException::withMessages([
                'code' => $attempts >= self::MAX_CODE_ATTEMPTS
                    ? 'Too many incorrect attempts. Request a new code.'
                    : 'That code does not match. Check your email and try again.',
            ]);
        }

        Cache::forget($cacheKey);
        $request->session()->regenerate();
        $request->session()->put('order_lookup', [
            'verified_email' => $email,
            'verified_until' => now()->addMinutes(self::ACCESS_TTL_MINUTES)->timestamp,
        ]);

        return redirect()->route('orders.lookup');
    }

    public function forget(Request $request): RedirectResponse
    {
        $request->session()->forget('order_lookup');

        return redirect()->route('orders.lookup');
    }

    private function codeCacheKey(string $email): string
    {
        return 'guest_order_lookup_code:'.hash('sha256', $email);
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($local, 0, 1).'•••@'.$domain;
    }
}
