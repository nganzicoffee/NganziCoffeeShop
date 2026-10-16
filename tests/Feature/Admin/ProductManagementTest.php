<?php

use App\Enums\InventoryReason;
use App\Enums\ProductStatus;
use App\Enums\StaffRole;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/* ── Helpers ──────────────────────────────────────────────────────── */

function makeOwner(): User
{
    return User::factory()->owner()->create(['email_verified_at' => now()]);
}

function makeOrderManager(): User
{
    return User::factory()->orderManager()->create(['email_verified_at' => now()]);
}

function makeInventoryManager(): User
{
    return User::factory()->create([
        'role' => StaffRole::InventoryManager,
        'email_verified_at' => now(),
    ]);
}

function makeReportingUser(): User
{
    return User::factory()->create([
        'role' => StaffRole::Reporting,
        'email_verified_at' => now(),
    ]);
}

/* ── Index ────────────────────────────────────────────────────────── */

test('owner can view product index', function () {
    $this->actingAs(makeOwner())->get('/admin/products')->assertOk();
});

test('reporting role can view product index', function () {
    $this->actingAs(makeReportingUser())->get('/admin/products')->assertOk();
});

test('guest cannot view product index', function () {
    $this->get('/admin/products')->assertRedirect('/login');
});

/* ── Create / Store ───────────────────────────────────────────────── */

test('owner can create a product', function () {
    $category = Category::factory()->create();

    $this->actingAs(makeOwner())
        ->post('/admin/products', [
            'name' => 'Test Coffee',
            'slug' => 'test-coffee',
            'category_id' => $category->id,
            'status' => ProductStatus::Draft->value,
            'featured' => false,
        ])
        ->assertRedirect();

    expect(Product::where('slug', 'test-coffee')->exists())->toBeTrue();
});

test('reporting role cannot create a product', function () {
    $category = Category::factory()->create();

    $this->actingAs(makeReportingUser())
        ->post('/admin/products', [
            'name' => 'Test Coffee',
            'slug' => 'test-coffee',
            'category_id' => $category->id,
            'status' => ProductStatus::Draft->value,
        ])
        ->assertForbidden();
});

test('duplicate slug is rejected', function () {
    $category = Category::factory()->create();
    Product::factory()->create(['slug' => 'existing-slug', 'category_id' => $category->id]);

    $this->actingAs(makeOwner())
        ->post('/admin/products', [
            'name' => 'Another',
            'slug' => 'existing-slug',
            'category_id' => $category->id,
            'status' => ProductStatus::Draft->value,
        ])
        ->assertSessionHasErrors('slug');
});

/* ── Update ───────────────────────────────────────────────────────── */

test('owner can update a product', function () {
    $product = Product::factory()->create();

    $this->actingAs(makeOwner())
        ->put("/admin/products/{$product->id}", [
            'name' => 'Updated Name',
            'slug' => $product->slug,
            'category_id' => $product->category_id,
            'status' => ProductStatus::Published->value,
            'featured' => true,
        ])
        ->assertRedirect();

    expect($product->fresh()->name)->toBe('Updated Name')
        ->and($product->fresh()->status)->toBe(ProductStatus::Published);
});

/* ── Delete ───────────────────────────────────────────────────────── */

test('owner can delete a product', function () {
    $product = Product::factory()->create();

    $this->actingAs(makeOwner())
        ->delete("/admin/products/{$product->id}")
        ->assertRedirect('/admin/products');

    expect(Product::find($product->id))->toBeNull();
});

test('order manager cannot delete a product', function () {
    $product = Product::factory()->create();

    $this->actingAs(makeOrderManager())
        ->delete("/admin/products/{$product->id}")
        ->assertForbidden();
});

/* ── Variants ─────────────────────────────────────────────────────── */

test('owner can add a variant', function () {
    $product = Product::factory()->create();

    $this->actingAs(makeOwner())
        ->post("/admin/products/{$product->id}/variants", [
            'label' => '250g',
            'price_minor' => 25000,
            'stock' => 10,
            'active' => true,
        ])
        ->assertRedirect();

    expect($product->variants()->where('label', '250g')->exists())->toBeTrue();
});

test('variant price cannot be negative', function () {
    $product = Product::factory()->create();

    $this->actingAs(makeOwner())
        ->post("/admin/products/{$product->id}/variants", [
            'label' => '250g',
            'price_minor' => -1,
            'stock' => 10,
        ])
        ->assertSessionHasErrors('price_minor');
});

test('owner can update a variant', function () {
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create(['price_minor' => 10000]);

    $this->actingAs(makeOwner())
        ->put("/admin/products/{$product->id}/variants/{$variant->id}", [
            'label' => $variant->label,
            'price_minor' => 20000,
            'active' => true,
        ])
        ->assertRedirect();

    expect($variant->fresh()->price_minor)->toBe(20000);
});

test('owner can remove a variant', function () {
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create();

    $this->actingAs(makeOwner())
        ->delete("/admin/products/{$product->id}/variants/{$variant->id}")
        ->assertRedirect();

    expect(ProductVariant::find($variant->id))->toBeNull();
});

test('variant from another product cannot be edited via wrong product route', function () {
    $product1 = Product::factory()->create();
    $product2 = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product2)->create();

    $this->actingAs(makeOwner())
        ->put("/admin/products/{$product1->id}/variants/{$variant->id}", [
            'label' => 'X',
            'price_minor' => 1000,
            'active' => true,
        ])
        ->assertNotFound();
});

/* ── Inventory ────────────────────────────────────────────────────── */

test('inventory manager can adjust stock', function () {
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create(['stock' => 10]);

    $this->actingAs(makeInventoryManager())
        ->post("/admin/products/{$product->id}/variants/{$variant->id}/inventory", [
            'delta' => 5,
            'reason' => InventoryReason::StockIn->value,
        ])
        ->assertRedirect();

    expect($variant->fresh()->stock)->toBe(15);
    expect(InventoryMovement::where('variant_id', $variant->id)->count())->toBe(1);
});

test('inventory adjustment records stock_before and stock_after', function () {
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create(['stock' => 20]);

    $this->actingAs(makeOwner())
        ->post("/admin/products/{$product->id}/variants/{$variant->id}/inventory", [
            'delta' => -3,
            'reason' => InventoryReason::Adjustment->value,
            'note' => 'Counted stock',
        ]);

    $movement = InventoryMovement::where('variant_id', $variant->id)->first();
    expect($movement->stock_before)->toBe(20)
        ->and($movement->stock_after)->toBe(17)
        ->and($movement->delta)->toBe(-3);
});

test('delta of zero is rejected', function () {
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create(['stock' => 10]);

    $this->actingAs(makeOwner())
        ->post("/admin/products/{$product->id}/variants/{$variant->id}/inventory", [
            'delta' => 0,
            'reason' => InventoryReason::Adjustment->value,
        ])
        ->assertSessionHasErrors('delta');
});

test('reporting role cannot adjust inventory', function () {
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create(['stock' => 10]);

    $this->actingAs(makeReportingUser())
        ->post("/admin/products/{$product->id}/variants/{$variant->id}/inventory", [
            'delta' => 5,
            'reason' => InventoryReason::StockIn->value,
        ])
        ->assertForbidden();
});

/* ── Images ───────────────────────────────────────────────────────── */

test('owner can upload a product image', function () {
    Storage::fake('public');
    $product = Product::factory()->create();

    $this->actingAs(makeOwner())
        ->post("/admin/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->create('coffee.jpg', 100, 'image/jpeg'),
            'alt' => 'A bag of coffee',
        ])
        ->assertRedirect();

    expect($product->images()->count())->toBe(1);
    Storage::disk('public')->assertExists($product->images()->first()->path);
});

test('non-image file is rejected on upload', function () {
    Storage::fake('public');
    $product = Product::factory()->create();

    $this->actingAs(makeOwner())
        ->post("/admin/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->create('malware.exe', 100, 'application/octet-stream'),
        ])
        ->assertSessionHasErrors('image');
});

test('owner can delete a product image', function () {
    Storage::fake('public');
    $product = Product::factory()->create();
    $image = ProductImage::factory()->for($product)->create(['path' => 'products/1/test.jpg']);
    Storage::disk('public')->put($image->path, 'fake');

    $this->actingAs(makeOwner())
        ->delete("/admin/products/{$product->id}/images/{$image->id}")
        ->assertRedirect();

    expect(ProductImage::find($image->id))->toBeNull();
    Storage::disk('public')->assertMissing($image->path);
});
