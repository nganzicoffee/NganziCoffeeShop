<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Jobs\SendOrderNotification;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderNotification;
use App\Services\OrderPaymentService;
use App\Services\OrderStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'payment_status' => ['nullable', Rule::enum(PaymentStatus::class)],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $orders = Order::query()
            ->withCount('items')
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('reference', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%")
                        ->orWhere('customer_phone', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($filters['payment_status'] ?? null, fn ($query, string $status) => $query->where('payment_status', $status))
            ->when($filters['from'] ?? null, fn ($query, string $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['to'] ?? null, fn ($query, string $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => $filters,
            'canExport' => $request->user()->can('export', Order::class),
            'exportFrom' => now()->subDays(29)->toDateString(),
            'exportTo' => now()->toDateString(),
            'statuses' => collect(OrderStatus::cases())->map(fn (OrderStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
            'paymentStatuses' => collect(PaymentStatus::cases())->map(fn (PaymentStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $this->authorize('view', $order);
        $order->load([
            'items',
            'payments' => fn ($query) => $query->latest(),
            'statusHistory.actor:id,name',
            'notifications' => fn ($query) => $query->latest(),
        ]);

        $customerHistory = Order::query()
            ->where('id', '!=', $order->id)
            ->where(function ($query) use ($order) {
                if (! empty($order->customer_email)) {
                    $query->where('customer_email', $order->customer_email);
                }
                if (! empty($order->customer_phone)) {
                    $query->orWhere('customer_phone', $order->customer_phone);
                }
            })
            ->latest()
            ->limit(5)
            ->get(['id', 'reference', 'status', 'payment_status', 'total_minor', 'currency', 'created_at'])
            ->map(fn (Order $prior): array => [
                'reference' => $prior->reference,
                'status' => $prior->status->label(),
                'paymentStatus' => $prior->payment_status->label(),
                'total' => $prior->total_minor,
                'currency' => $prior->currency,
                'createdAt' => $prior->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('admin/orders/show', [
            'order' => [
                'reference' => $order->reference,
                'status' => $order->status->value,
                'statusLabel' => $order->status->label(),
                'paymentStatus' => $order->payment_status->label(),
                'isPaid' => $order->payment_status === PaymentStatus::Paid,
                'customerName' => $order->customer_name,
                'customerEmail' => $order->customer_email,
                'customerPhone' => $order->customer_phone,
                'deliveryAddress' => $order->delivery_address,
                'deliveryNotes' => $order->delivery_notes,
                'customerNotes' => $order->customer_notes,
                'internalNotes' => $order->internal_notes,
                'customerHistory' => $customerHistory,
                'items' => $order->items->map(fn ($item): array => [
                    'productName' => $item->product_name,
                    'variantLabel' => $item->variant_label,
                    'sku' => $item->sku,
                    'unitPrice' => $item->unit_price_minor,
                    'quantity' => $item->quantity,
                    'lineTotal' => $item->line_total_minor,
                ]),
                'subtotal' => $order->subtotal_minor,
                'deliveryFee' => $order->delivery_fee_minor,
                'tax' => $order->tax_minor,
                'total' => $order->total_minor,
                'currency' => $order->currency,
                'payments' => $order->payments->map(fn ($payment): array => [
                    'provider' => $payment->provider,
                    'reference' => $payment->provider_reference,
                    'amount' => $payment->amount_minor,
                    'currency' => $payment->currency,
                    'status' => $payment->status->label(),
                    'createdAt' => $payment->created_at?->toDateTimeString(),
                ]),
                'notifications' => $order->notifications->map(fn (OrderNotification $notification): array => [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'label' => $notification->typeLabel(),
                    'channel' => $notification->channel,
                    'recipientHint' => $notification->recipient_hint,
                    'status' => $notification->status,
                    'attempts' => $notification->attempts,
                    'lastError' => $notification->last_error,
                    'sentAt' => $notification->sent_at?->toDateTimeString(),
                    'failedAt' => $notification->failed_at?->toDateTimeString(),
                ]),
                'history' => $order->statusHistory->map(fn ($entry): array => [
                    'from' => $entry->from_status->label(),
                    'to' => $entry->to_status->label(),
                    'actor' => $entry->actor->name ?? 'System',
                    'note' => $entry->note,
                    'at' => $entry->created_at?->toDateTimeString(),
                ]),
                'allowedTransitions' => collect($order->status->allowedTransitions())->map(fn (OrderStatus $status) => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ]),
            ],
            'canUpdateStatus' => $request->user()->can('updateStatus', $order),
        ]);
    }

    public function updateStatus(Request $request, Order $order, OrderStatusService $statusService): RedirectResponse
    {
        $this->authorize('updateStatus', $order);
        $data = $request->validate([
            'status' => ['required', Rule::enum(OrderStatus::class)],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $statusService->transition(
            $order,
            OrderStatus::from($data['status']),
            $request->user(),
            $data['note'] ?? null,
        );

        return back()->with('toast', ['type' => 'success', 'message' => 'Order status updated.']);
    }

    public function confirmPayment(Request $request, Order $order, OrderPaymentService $paymentService): RedirectResponse
    {
        $this->authorize('updateStatus', $order);
        $data = $request->validate([
            'provider' => ['required', 'string', 'max:40'],
            'provider_reference' => ['required', 'string', 'max:120'],
            'amount_minor' => ['nullable', 'integer', 'min:0'],
        ]);

        $paymentService->confirmPayment(
            order: $order,
            provider: $data['provider'],
            providerReference: $data['provider_reference'],
            amountMinor: isset($data['amount_minor']) ? (int) $data['amount_minor'] : $order->total_minor,
            actor: $request->user(),
        );

        return back()->with('toast', ['type' => 'success', 'message' => 'Payment confirmed.']);
    }

    public function retryNotification(Request $request, Order $order, OrderNotification $notification): RedirectResponse
    {
        $this->authorize('updateStatus', $order);

        abort_unless($notification->order_id === $order->id, 404);

        if ($notification->status === OrderNotification::STATUS_FAILED) {
            $notification->update([
                'status' => OrderNotification::STATUS_QUEUED,
                'last_error' => null,
            ]);

            SendOrderNotification::dispatch($notification->id);
        }

        return back()->with('toast', ['type' => 'success', 'message' => 'Notification re-queued.']);
    }

    public function updateInternalNotes(Request $request, Order $order): RedirectResponse
    {
        $this->authorize('updateStatus', $order);
        $data = $request->validate(['internal_notes' => ['nullable', 'string', 'max:5000']]);
        $before = $order->internal_notes;
        $order->update(['internal_notes' => $data['internal_notes'] ?? null]);
        AuditLog::create([
            'actor_id' => $request->user()->id,
            'event' => 'order.internal_notes_updated',
            'subject_type' => Order::class,
            'subject_id' => $order->id,
            'details' => [
                'reference' => $order->reference,
                'before' => $before,
                'after' => $order->internal_notes,
            ],
        ]);

        return back()->with('toast', ['type' => 'success', 'message' => 'Internal notes saved.']);
    }

    public function export(Request $request): StreamedResponse
    {
        $this->authorize('export', Order::class);
        $filters = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $filename = "paid-product-sales-{$filters['from']}-{$filters['to']}.csv";

        return response()->streamDownload(function () use ($filters): void {
            $output = fopen('php://output', 'w');
            if ($output === false) {
                throw new \RuntimeException('Unable to open CSV output stream.');
            }

            // Export aggregate product performance only — never customer contact or address PII.
            fputcsv($output, ['Product', 'Variant', 'SKU', 'Currency', 'Units sold', 'Paid product line total minor units']);
            $orders = Order::query()
                ->where('payment_status', PaymentStatus::Paid->value)
                ->whereBetween('created_at', [
                    "{$filters['from']} 00:00:00",
                    "{$filters['to']} 23:59:59",
                ])
                ->with('items')
                ->orderBy('id')
                ->lazy();

            $totals = [];
            foreach ($orders as $order) {
                foreach ($order->items as $item) {
                    $key = implode('|', [$item->product_name, $item->variant_label, $item->sku ?? '', $order->currency]);
                    $totals[$key] ??= [
                        self::sanitizeCsvCell($item->product_name),
                        self::sanitizeCsvCell($item->variant_label),
                        self::sanitizeCsvCell($item->sku),
                        self::sanitizeCsvCell($order->currency),
                        0,
                        0,
                    ];
                    $totals[$key][4] += $item->quantity;
                    $totals[$key][5] += $item->line_total_minor;
                }
            }

            foreach ($totals as $row) {
                fputcsv($output, $row);
            }

            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private static function sanitizeCsvCell(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        if (preg_match('/^[=+\-@\t\r]/', $value) === 1) {
            return "'".$value;
        }

        return $value;
    }
}
