<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\StoreSetting;
use App\Services\ShopSettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingsController extends Controller
{
    public function edit(Request $request, ShopSettingsService $settings): Response
    {
        abort_unless($request->user()->hasRole(StaffRole::Owner), 403);

        return Inertia::render('admin/settings', [
            'currency' => config('shop.currency'),
            'settings' => [
                'delivery_fee' => $settings->integer('delivery_flat_fee', (int) config('shop.delivery.flat_fee', 0)),
                'free_delivery_above' => $settings->integer('free_delivery_above', (int) config('shop.delivery.free_above', 0)),
                'delivery_areas' => implode(', ', $settings->areas(config('shop.delivery.areas', []))),
                'reservation_hours' => $settings->integer('reservation_hours', (int) config('shop.delivery.reservation_hours', 24)),
                'tax_enabled' => $settings->boolean('tax_enabled', (bool) config('shop.tax.enabled', false)),
                'tax_rate' => $settings->decimal('tax_rate', (float) config('shop.tax.rate', 0)),
                'tax_inclusive' => $settings->boolean('tax_inclusive', (bool) config('shop.tax.inclusive', true)),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasRole(StaffRole::Owner), 403);
        $data = $request->validate([
            'delivery_fee' => ['required', 'integer', 'min:0'],
            'free_delivery_above' => ['required', 'integer', 'min:0'],
            'delivery_areas' => ['nullable', 'string', 'max:1000'],
            'reservation_hours' => ['required', 'integer', 'between:1,720'],
            'tax_enabled' => ['required', 'boolean'],
            'tax_rate' => ['required', 'numeric', 'between:0,1'],
            'tax_inclusive' => ['required', 'boolean'],
        ]);

        $areas = array_values(array_unique(array_filter(array_map('trim', explode(',', $data['delivery_areas'] ?? '')))));
        if (count($areas) > 50) {
            throw ValidationException::withMessages([
                'delivery_areas' => 'Enter no more than 50 delivery areas.',
            ]);
        }

        $values = [
            'delivery_flat_fee' => (string) $data['delivery_fee'],
            'free_delivery_above' => (string) $data['free_delivery_above'],
            'delivery_areas' => implode(',', $areas),
            'reservation_hours' => (string) $data['reservation_hours'],
            'tax_enabled' => $data['tax_enabled'] ? 'true' : 'false',
            'tax_rate' => (string) $data['tax_rate'],
            'tax_inclusive' => $data['tax_inclusive'] ? 'true' : 'false',
        ];

        DB::transaction(function () use ($values, $request): void {
            $before = StoreSetting::query()->whereIn('key', array_keys($values))->pluck('value', 'key')->all();
            foreach ($values as $key => $value) {
                StoreSetting::set($key, $value);
            }

            AuditLog::create([
                'actor_id' => $request->user()->id,
                'event' => 'store_settings.updated',
                'subject_type' => 'store_settings',
                'details' => ['before' => $before, 'after' => $values],
            ]);
        });

        return back()->with('toast', ['type' => 'success', 'message' => 'Store settings saved.']);
    }
}
