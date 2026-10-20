<?php

use App\Enums\StaffRole;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('catalogue staff can create pack prices stock and both images in one submission', function (StaffRole $role) {
    Storage::fake('public');
    config(['shop.media_disk' => 'public']);
    $staff = User::factory()->create(['role' => $role]);
    $this->actingAs($staff)->post('/admin/products', [
        'name' => 'Coffee', 'slug' => 'coffee', 'category_name' => 'Roasted coffee', 'status' => 'published',
        'variants' => [
            ['label' => '250g', 'price_minor' => 25000, 'stock' => 30],
            ['label' => '500g', 'price_minor' => 45000, 'stock' => 12],
        ],
        'front_image' => UploadedFile::fake()->image('front.jpg'),
        'back_image' => UploadedFile::fake()->image('back.jpg'),
    ])->assertSessionHasNoErrors();
    $product = Product::where('slug', 'coffee')->firstOrFail();
    expect($product->category->name)->toBe('Roasted coffee');
    expect($product->variants()->count())->toBe(2);
    expect($product->variants()->where('label', '250g')->firstOrFail()->price_minor)->toBe(25000);
    expect($product->variants()->where('label', '250g')->firstOrFail()->stock)->toBe(30);
    expect(InventoryMovement::where('actor_id', $staff->id)->sum('delta'))->toBe(42);
    expect($product->images()->count())->toBe(2);
    expect($product->images->first()->alt)->toContain('front');
    expect($product->images->last()->alt)->toContain('back');
    foreach ($product->images as $image) {
        Storage::disk('public')->assertExists($image->path);
    }
})->with([StaffRole::Owner, StaffRole::InventoryManager]);

test('one front image is sufficient and a negative price prevents all creation', function () {
    Storage::fake('public');
    config(['shop.media_disk' => 'public']);
    $staff = User::factory()->create(['role' => StaffRole::Owner]);
    $category = Category::factory()->create();
    $data = [
        'name' => 'Coffee', 'slug' => 'coffee', 'category_id' => $category->id, 'status' => 'published',
        'variants' => [['label' => '250g', 'price_minor' => -1, 'stock' => 3]],
        'front_image' => UploadedFile::fake()->image('front.jpg'),
    ];
    $this->actingAs($staff)->post('/admin/products', $data)->assertSessionHasErrors('variants.0.price_minor');
    expect(Product::count())->toBe(0);
    $data['variants'][0]['price_minor'] = 25000;
    $this->post('/admin/products', $data)->assertSessionHasNoErrors();
    expect(Product::firstOrFail()->images()->count())->toBe(1);
});

test('reporting staff cannot write catalogue or upload product images', function () {
    $staff = User::factory()->create(['role' => StaffRole::Reporting]);
    $product = Product::factory()->create();
    $this->actingAs($staff)->post('/admin/products', [])->assertForbidden();
    $this->post('/admin/products/'.$product->id.'/images', [
        'image' => UploadedFile::fake()->image('front.jpg'),
    ])->assertForbidden();
});

test('third images are rejected and image order must belong to the same product', function () {
    Storage::fake('public');
    config(['shop.media_disk' => 'public']);
    $owner = User::factory()->create(['role' => StaffRole::Owner]);
    $product = Product::factory()->create();
    $front = ProductImage::factory()->create(['product_id' => $product->id, 'sort_order' => 0]);
    $back = ProductImage::factory()->create(['product_id' => $product->id, 'sort_order' => 1]);
    $other = ProductImage::factory()->create();
    $this->actingAs($owner)->post('/admin/products/'.$product->id.'/images', [
        'image' => UploadedFile::fake()->image('third.jpg'),
    ])->assertSessionHasErrors('image');
    expect($product->images()->count())->toBe(2);
    $this->post('/admin/products/'.$product->id.'/images/reorder', [
        'order' => [$other->id, $front->id],
    ])->assertSessionHasErrors('order');
    $this->post('/admin/products/'.$product->id.'/images/reorder', [
        'order' => [$back->id, $front->id],
    ])->assertSessionHasNoErrors();
    expect($product->images()->pluck('id')->all())->toBe([$back->id, $front->id]);
});

test('owner controls exchange rate and storefront exposes it', function () {
    $owner = User::factory()->create(['role' => StaffRole::Owner]);
    $data = [
        'delivery_fee' => 0, 'free_delivery_above' => 0, 'delivery_areas' => '', 'reservation_hours' => 24,
        'tax_enabled' => false, 'tax_rate' => 0, 'tax_inclusive' => true, 'usd_exchange_rate' => 4000,
    ];
    $this->actingAs($owner)->put('/admin/settings', $data)->assertSessionHasNoErrors();
    expect((float) StoreSetting::get('usd_exchange_rate'))->toBe(4000.0);
    $this->get('/shop')->assertInertia(fn ($page) => $page->where('shop.usdExchangeRate', 4000));
    $reporter = User::factory()->create(['role' => StaffRole::Reporting]);
    $this->actingAs($reporter)->put('/admin/settings', [...$data, 'usd_exchange_rate' => 1])->assertForbidden();
    expect((float) StoreSetting::get('usd_exchange_rate'))->toBe(4000.0);
});
