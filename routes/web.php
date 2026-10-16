<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\InventoryMovementController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductImageController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\StoreSettingsController;
use App\Http\Controllers\Admin\VariantController;
use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\CheckoutController;
use App\Http\Controllers\Shop\PaymentWebhookController;
use App\Http\Controllers\Shop\ProductController as ShopProductController;
use App\Http\Controllers\Shop\ShopController;
use App\Http\Controllers\Shop\SitemapController;
use App\Http\Controllers\Shop\StaticPageController;
use App\Http\Middleware\EnsureStaff;
use Illuminate\Support\Facades\Route;

// ── Public shop ────────────────────────────────────────────────────
Route::get('/', [ShopController::class, 'home'])->name('home');
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');
Route::get('/shop/{slug}', [ShopProductController::class, 'show'])->name('shop.product');

Route::get('/cart', [CartController::class, 'show'])->name('cart.show');
Route::post('/cart', [CartController::class, 'add'])->name('cart.add');
Route::patch('/cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{cartItem}', [CartController::class, 'remove'])->name('cart.remove');
Route::get('/checkout', [CheckoutController::class, 'show'])->name('checkout.show');
Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
Route::get('/orders/{reference}/{lookupToken}', [CheckoutController::class, 'confirmation'])->name('orders.confirmation');
Route::post('/webhooks/payments', PaymentWebhookController::class)->name('webhooks.payments');

Route::get('/about', [StaticPageController::class, 'about'])->name('about');
Route::get('/coffee', [StaticPageController::class, 'coffee'])->name('coffee');
Route::get('/contact', [StaticPageController::class, 'contact'])->name('contact');
Route::get('/delivery', [StaticPageController::class, 'delivery'])->name('delivery');
Route::get('/privacy', [StaticPageController::class, 'privacy'])->name('privacy');
Route::get('/policies/privacy-policy', [StaticPageController::class, 'privacy'])->name('policies.privacy');
Route::get('/terms', [StaticPageController::class, 'terms'])->name('terms');

// Design-system reference — local development only.
if (app()->environment('local')) {
    Route::inertia('/design-system', 'design-system')->name('design-system');
}

// ── Authenticated ──────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('admin')->name('admin.')->middleware(EnsureStaff::class)->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');
        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('orders/export', [OrderController::class, 'export'])->name('orders.export');
        Route::get('orders/{order:reference}', [OrderController::class, 'show'])->name('orders.show');
        Route::patch('orders/{order:reference}/status', [OrderController::class, 'updateStatus'])->name('orders.status.update');
        Route::post('orders/{order:reference}/payment', [OrderController::class, 'confirmPayment'])->name('orders.payment.confirm');
        Route::post('orders/{order:reference}/notifications/{notification}/retry', [OrderController::class, 'retryNotification'])->name('orders.notifications.retry');
        Route::patch('orders/{order:reference}/notes', [OrderController::class, 'updateInternalNotes'])->name('orders.notes.update');
        Route::get('inventory', [InventoryMovementController::class, 'index'])->name('inventory.index');
        Route::get('settings', [StoreSettingsController::class, 'edit'])->name('settings.edit');
        Route::put('settings', [StoreSettingsController::class, 'update'])->name('settings.update');
        Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
        Route::patch('staff/{user}/role', [StaffController::class, 'updateRole'])->name('staff.role.update');
        Route::get('audit-log', [AuditLogController::class, 'index'])->name('audit-log.index');

        Route::resource('products', ProductController::class)->except(['show']);

        Route::prefix('products/{product}')->name('products.')->group(function () {
            Route::post('variants', [VariantController::class, 'store'])->name('variants.store');
            Route::put('variants/{variant}', [VariantController::class, 'update'])->name('variants.update');
            Route::delete('variants/{variant}', [VariantController::class, 'destroy'])->name('variants.destroy');

            Route::post('images', [ProductImageController::class, 'store'])->name('images.store');
            Route::delete('images/{image}', [ProductImageController::class, 'destroy'])->name('images.destroy');
            Route::post('images/reorder', [ProductImageController::class, 'reorder'])->name('images.reorder');

            Route::post('variants/{variant}/inventory', [InventoryController::class, 'store'])->name('variants.inventory.store');
        });
    });
});

require __DIR__.'/settings.php';
