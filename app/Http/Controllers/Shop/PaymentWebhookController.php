<?php

namespace App\Http\Controllers\Shop;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentWebhookController extends Controller
{
    public function __invoke(Request $request, OrderPaymentService $paymentService): JsonResponse
    {
        $secret = (string) (config('shop.payment_webhook_secret') ?: config('shop.payments.webhook_secret', ''));
        $signature = (string) ($request->header('X-Webhook-Signature') ?: $request->header('X-Nganzi-Signature', ''));
        $rawBody = $request->getContent();

        if ($secret === '' || $signature === '' || ! hash_equals(hash_hmac('sha256', $rawBody, $secret), $signature)) {
            return response()->json(['message' => 'Invalid webhook signature.'], 401);
        }

        $data = $request->validate([
            'order_reference' => ['required', 'string', 'max:64'],
            'provider' => ['required', 'string', 'max:40'],
            'provider_reference' => ['required', 'string', 'max:120'],
            'amount_minor' => ['required', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'status' => ['required', Rule::in([
                PaymentStatus::Paid->value,
                PaymentStatus::Pending->value,
                PaymentStatus::Failed->value,
            ])],
        ]);

        $order = Order::query()->where('reference', $data['order_reference'])->firstOrFail();

        if (isset($data['currency']) && strtoupper($data['currency']) !== strtoupper($order->currency)) {
            return response()->json(['message' => 'Currency mismatch.'], 422);
        }

        $status = PaymentStatus::from($data['status']);

        if ($status === PaymentStatus::Paid) {
            $paymentService->confirmPayment(
                order: $order,
                provider: $data['provider'],
                providerReference: $data['provider_reference'],
                amountMinor: (int) $data['amount_minor'],
            );
        } else {
            $paymentService->recordAttempt(
                order: $order,
                provider: $data['provider'],
                providerReference: $data['provider_reference'],
                amountMinor: (int) $data['amount_minor'],
                status: $status,
            );
        }

        return response()->json(['ok' => true]);
    }
}
