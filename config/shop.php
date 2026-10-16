<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Shop — business-configurable values
    |--------------------------------------------------------------------------
    |
    | All values here are driven by environment variables so they can be
    | changed per environment without touching code. Confirm every value
    | with the business before going live.
    |
    */

    // Currency code shown to customers. UNCONFIRMED — awaiting business input.
    'currency' => env('SHOP_CURRENCY', 'UGX'),

    // Units below which a variant is flagged as low stock in the admin.
    'low_stock_threshold' => (int) env('SHOP_LOW_STOCK_THRESHOLD', 5),

    // Payment provider slug. Supported: 'manual' (awaiting verification workflow).
    // Additional providers added in Phase 9 once confirmed.
    'payment_provider' => env('PAYMENT_PROVIDER', 'manual'),
    'payment_webhook_secret' => env('PAYMENT_WEBHOOK_SECRET'),

    // Filesystem disk used for product images.
    'media_disk' => env('MEDIA_DISK', 'public'),

    // Maximum allowed image upload size in kilobytes.
    'media_max_kb' => (int) env('MEDIA_MAX_KB', 4096),

    // URL of the main Nganzi marketing website, used for cross-links in the shop.
    'marketing_site_url' => env('MARKETING_SITE_URL', 'https://nganzicoffee.com'),

    /*
    |--------------------------------------------------------------------------
    | Customer support contact — UNCONFIRMED
    |--------------------------------------------------------------------------
    |
    | Shown in order emails. Leave blank until the business confirms which
    | contact details customers should use; templates fall back to "reply to
    | this email".
    |
    */
    'support' => [
        'email' => env('SHOP_SUPPORT_EMAIL'),
        'phone' => env('SHOP_SUPPORT_PHONE'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Customer notifications
    |--------------------------------------------------------------------------
    |
    | Email uses the configured mailer (MAIL_* variables). SMS/WhatsApp stays
    | disabled until a provider is approved and integrated; the "log" driver
    | is for local development only and sends nothing.
    |
    */
    'notifications' => [
        'mail_enabled' => (bool) env('NOTIFY_MAIL_ENABLED', true),
        'sms_enabled' => (bool) env('NOTIFY_SMS_ENABLED', false),
        'sms_driver' => env('NOTIFY_SMS_DRIVER', 'log'),
        'queue' => env('NOTIFY_QUEUE', 'default'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Traffic analytics — privacy-first, off by default
    |--------------------------------------------------------------------------
    |
    | Intended for a cookieless, aggregate analytics service (for example a
    | self-hosted or EU-hosted Plausible/Umami instance). Loaded on public
    | storefront pages only, never in the admin. Traffic data is kept
    | entirely separate from order and payment records. Confirm consent and
    | retention requirements for the deployment before enabling.
    |
    */
    'analytics' => [
        'script_src' => env('ANALYTICS_SCRIPT_SRC'),
        'site_id' => env('ANALYTICS_SITE_ID'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Delivery — UNCONFIRMED
    |--------------------------------------------------------------------------
    |
    | Delivery areas, fees, and free-delivery thresholds must be confirmed
    | by the business before checkout is enabled. These are placeholder
    | values only.
    |
    */
    'delivery' => [
        // Placeholder flat fee in the smallest currency unit (e.g. UGX cents/shillings).
        // Replace with zone-based config once delivery rules are confirmed.
        'flat_fee' => (int) env('SHOP_DELIVERY_FEE', 0),

        // Empty means delivery areas have not been restricted yet.
        'areas' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('SHOP_DELIVERY_AREAS', '')),
        ))),

        // Order subtotal (smallest unit) above which delivery is free. 0 = never free.
        'free_above' => (int) env('SHOP_FREE_DELIVERY_ABOVE', 0),

        // Stock is deducted when an order is created and restored if payment remains unpaid.
        'reservation_hours' => max(1, (int) env('SHOP_INVENTORY_RESERVATION_HOURS', 24)),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tax — UNCONFIRMED
    |--------------------------------------------------------------------------
    |
    | Tax applicability, rate, and inclusive/exclusive treatment must be
    | confirmed with the business and qualified tax advice before launch.
    |
    */
    'tax' => [
        'enabled' => (bool) env('SHOP_TAX_ENABLED', false),
        'rate' => (float) env('SHOP_TAX_RATE', 0.0),       // e.g. 0.18 for 18 %
        'inclusive' => (bool) env('SHOP_TAX_INCLUSIVE', true),
    ],

];
