<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderNotification;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);
        $filters = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $from = Carbon::parse($filters['from'] ?? now()->subDays(29)->toDateString())->startOfDay();
        $to = Carbon::parse($filters['to'] ?? now()->toDateString())->endOfDay();

        $ordersInWindow = Order::query()->whereBetween('created_at', [$from, $to]);
        $orderCount = (clone $ordersInWindow)->count();

        $sales = (clone $ordersInWindow)->where('payment_status', PaymentStatus::Paid->value);
        $salesTotal = (int) (clone $sales)->sum('total_minor');
        $paidOrderCount = (clone $sales)->count();

        $refunds = (clone $ordersInWindow)->whereIn('payment_status', [
            PaymentStatus::Refunded->value,
            PaymentStatus::PartiallyRefunded->value,
        ]);
        $refundedCount = (clone $refunds)->count();
        $refundedMinor = (int) (clone $refunds)->sum('total_minor');

        $lowStockThreshold = max(0, (int) config('shop.low_stock_threshold', 5));

        $productPerformance = DB::table('order_items')
            ->select([
                'order_items.product_name',
                'order_items.variant_label',
                'order_items.sku',
                DB::raw('SUM(order_items.quantity) as units_sold'),
                DB::raw('SUM(order_items.line_total_minor) as revenue_minor'),
            ])
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.payment_status', PaymentStatus::Paid->value)
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('order_items.product_name', 'order_items.variant_label', 'order_items.sku')
            ->orderByDesc('revenue_minor')
            ->orderByDesc('units_sold')
            ->limit(10)
            ->get()
            ->map(fn (\stdClass $row): array => [
                'product_name' => (string) $row->product_name,
                'variant_label' => $row->variant_label ? (string) $row->variant_label : null,
                'sku' => $row->sku ? (string) $row->sku : null,
                'units_sold' => (int) $row->units_sold,
                'revenue_minor' => (int) $row->revenue_minor,
            ])
            ->values();

        $backlogCounts = Order::query()
            ->select(['status', DB::raw('COUNT(*) as aggregate')])
            ->whereNotIn('status', [
                OrderStatus::Completed->value,
                OrderStatus::Cancelled->value,
            ])
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $fulfilmentBacklog = collect([
            OrderStatus::Pending,
            OrderStatus::Confirmed,
            OrderStatus::Processing,
            OrderStatus::ReadyToDispatch,
            OrderStatus::Dispatched,
        ])->map(fn (OrderStatus $status): array => [
            'status' => $status->value,
            'label' => $status->label(),
            'count' => (int) ($backlogCounts[$status->value] ?? 0),
        ])->values();

        $inventoryExceptions = ProductVariant::query()
            ->with('product:id,name')
            ->where('active', true)
            ->where('stock', '<=', $lowStockThreshold)
            ->whereHas('product', fn ($query) => $query->where('status', 'published'))
            ->orderBy('stock')
            ->orderBy('id')
            ->limit(15)
            ->get()
            ->map(fn (ProductVariant $variant): array => [
                'product_id' => $variant->product_id,
                'product_name' => $variant->product->name ?? '—',
                'variant_label' => $variant->label,
                'sku' => $variant->sku,
                'stock' => $variant->stock,
                'status' => $variant->stock === 0 ? 'out_of_stock' : 'low_stock',
            ])
            ->values();

        $driver = DB::connection()->getDriverName();
        $isSingleDay = $from->toDateString() === $to->toDateString();

        if ($isSingleDay) {
            $timeExpr = match ($driver) {
                'sqlite' => "strftime('%H:00', created_at)",
                'pgsql' => "to_char(created_at, 'HH24:00')",
                default => "DATE_FORMAT(created_at, '%H:00')",
            };

            $groupedData = Order::query()
                ->select([
                    DB::raw("{$timeExpr} as time_key"),
                    DB::raw('COUNT(*) as total_orders'),
                    DB::raw("SUM(CASE WHEN payment_status = '".PaymentStatus::Paid->value."' THEN 1 ELSE 0 END) as paid_orders"),
                    DB::raw("SUM(CASE WHEN payment_status = '".PaymentStatus::Paid->value."' THEN total_minor ELSE 0 END) as sales_minor"),
                ])
                ->whereBetween('created_at', [$from, $to])
                ->groupBy(DB::raw($timeExpr))
                ->get()
                ->keyBy('time_key');

            $salesTrend = [];
            for ($h = 0; $h < 24; $h++) {
                $hourKey = sprintf('%02d:00', $h);
                $row = $groupedData->get($hourKey);
                $salesTrend[] = [
                    'label' => sprintf('%02d:00', $h),
                    'full_date' => sprintf('%s at %02d:00', $from->format('M j'), $h),
                    'sales_minor' => (int) ($row->sales_minor ?? 0),
                    'order_count' => (int) ($row->total_orders ?? 0),
                    'paid_order_count' => (int) ($row->paid_orders ?? 0),
                ];
            }
        } else {
            $dateExpr = match ($driver) {
                'sqlite' => "strftime('%Y-%m-%d', created_at)",
                'pgsql' => "to_char(created_at, 'YYYY-MM-DD')",
                default => 'DATE(created_at)',
            };

            $groupedData = Order::query()
                ->select([
                    DB::raw("{$dateExpr} as time_key"),
                    DB::raw('COUNT(*) as total_orders'),
                    DB::raw("SUM(CASE WHEN payment_status = '".PaymentStatus::Paid->value."' THEN 1 ELSE 0 END) as paid_orders"),
                    DB::raw("SUM(CASE WHEN payment_status = '".PaymentStatus::Paid->value."' THEN total_minor ELSE 0 END) as sales_minor"),
                ])
                ->whereBetween('created_at', [$from, $to])
                ->groupBy(DB::raw($dateExpr))
                ->get()
                ->keyBy('time_key');

            $salesTrend = [];
            $cursor = $from->copy()->startOfDay();
            $endCursor = $to->copy()->startOfDay();
            while ($cursor->lte($endCursor)) {
                $dateKey = $cursor->toDateString();
                $row = $groupedData->get($dateKey);
                $salesTrend[] = [
                    'label' => $cursor->format('M d'),
                    'full_date' => $cursor->format('l, M j, Y'),
                    'sales_minor' => (int) ($row->sales_minor ?? 0),
                    'order_count' => (int) ($row->total_orders ?? 0),
                    'paid_order_count' => (int) ($row->paid_orders ?? 0),
                ];
                $cursor->addDay();
            }
        }

        return Inertia::render('admin/dashboard', [
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'currency' => config('shop.currency'),
            'canExport' => $request->user()->can('export', Order::class),
            'salesTrend' => $salesTrend,
            'salesDefinition' => 'Captured paid orders only; excludes unpaid, pending, failed, refunded, and partially refunded orders. Gross order totals include delivery and tax.',
            'definitions' => [
                'order_count' => 'All orders placed within the selected date range regardless of payment or fulfilment status.',
                'paid_sales' => 'Gross order total (including delivery and tax) for orders with verified Paid status in the date range.',
                'refunds' => 'Orders marked Refunded or Partially refunded within the selected date range.',
                'average_order_value' => 'Paid sales divided by the number of paid orders in the selected date range.',
                'product_performance' => 'Units sold and line-item revenue from verified Paid orders in the selected date range.',
                'fulfilment_backlog' => 'Current open orders that have not yet reached Completed or Cancelled.',
                'inventory_exceptions' => "Active variants on published products with stock at or below the low-stock threshold ({$lowStockThreshold}).",
            ],
            'metrics' => [
                'order_count' => $orderCount,
                'sales_minor' => $salesTotal,
                'paid_order_count' => $paidOrderCount,
                'average_order_value_minor' => $paidOrderCount > 0 ? (int) round($salesTotal / $paidOrderCount) : 0,
                'refunded_count' => $refundedCount,
                'refunded_minor' => $refundedMinor,
                'awaiting_action_count' => Order::where('status', OrderStatus::Pending->value)->count(),
                'unfulfilled_count' => Order::whereNotIn('status', [
                    OrderStatus::Completed->value,
                    OrderStatus::Cancelled->value,
                ])->count(),
                'low_stock_count' => ProductVariant::query()
                    ->where('active', true)
                    ->where('stock', '>', 0)
                    ->where('stock', '<=', $lowStockThreshold)
                    ->whereHas('product', fn ($query) => $query->where('status', 'published'))
                    ->count(),
                'out_of_stock_count' => ProductVariant::query()
                    ->where('active', true)
                    ->where('stock', 0)
                    ->whereHas('product', fn ($query) => $query->where('status', 'published'))
                    ->count(),
                'failed_notifications_count' => OrderNotification::where('status', OrderNotification::STATUS_FAILED)->count(),
            ],
            'productPerformance' => $productPerformance,
            'fulfilmentBacklog' => $fulfilmentBacklog,
            'inventoryExceptions' => $inventoryExceptions,
            'recentOrders' => Order::query()
                ->withCount('items')
                ->latest()
                ->limit(8)
                ->get(['id', 'reference', 'customer_name', 'status', 'payment_status', 'total_minor', 'currency', 'created_at'])
                ->map(fn (Order $order): array => [
                    'reference' => $order->reference,
                    'customer_name' => $order->customer_name,
                    'status' => $order->status->label(),
                    'payment_status' => $order->payment_status->label(),
                    'total_minor' => $order->total_minor,
                    'currency' => $order->currency,
                    'items_count' => $order->items_count,
                    'created_at' => $order->created_at?->toIso8601String(),
                ]),
        ]);
    }
}
