<?php

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;

/* ── Homepage ─────────────────────────────────────────────────────── */

test('homepage loads successfully', function () {
    $this->get('/')->assertOk();
});

test('homepage shows featured published products', function () {
    $category = Category::factory()->create();

    $featured = Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Published,
        'featured' => true,
        'name' => 'Featured Arabica',
    ]);
    ProductVariant::factory()->create([
        'product_id' => $featured->id,
        'active' => true,
        'price_minor' => 25000,
        'stock' => 10,
    ]);

    $draft = Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Draft,
        'featured' => true,
        'name' => 'Draft Coffee',
    ]);

    $this->get('/')
        ->assertOk()
        ->assertSee('Featured Arabica')
        ->assertDontSee('Draft Coffee');
});

/* ── Shop listing ─────────────────────────────────────────────────── */

test('shop listing loads successfully', function () {
    $this->get('/shop')->assertOk();
});

test('shop listing shows only published products', function () {
    $category = Category::factory()->create();

    Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Published,
        'name' => 'Published Robusta',
    ]);

    Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Draft,
        'name' => 'Hidden Draft',
    ]);

    Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Archived,
        'name' => 'Archived Blend',
    ]);

    $this->get('/shop')
        ->assertOk()
        ->assertSee('Published Robusta')
        ->assertDontSee('Hidden Draft')
        ->assertDontSee('Archived Blend');
});

test('shop listing filters by category', function () {
    $light = Category::factory()->create(['name' => 'Light Roast', 'slug' => 'light-roast']);
    $dark = Category::factory()->create(['name' => 'Dark Roast', 'slug' => 'dark-roast']);

    Product::factory()->create([
        'category_id' => $light->id,
        'status' => ProductStatus::Published,
        'name' => 'Light Arabica',
    ]);

    Product::factory()->create([
        'category_id' => $dark->id,
        'status' => ProductStatus::Published,
        'name' => 'Dark Robusta',
    ]);

    $this->get('/shop?category=light-roast')
        ->assertOk()
        ->assertSee('Light Arabica')
        ->assertDontSee('Dark Robusta');
});

test('shop listing filters by search', function () {
    $category = Category::factory()->create();

    Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Published,
        'name' => 'Mountain Arabica',
    ]);

    Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Published,
        'name' => 'Valley Robusta',
    ]);

    $this->get('/shop?search=Mountain')
        ->assertOk()
        ->assertSee('Mountain Arabica')
        ->assertDontSee('Valley Robusta');
});

/* ── Product detail ───────────────────────────────────────────────── */

test('published product detail page loads', function () {
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Published,
        'name' => 'Nganzi Medium Roast',
        'slug' => 'nganzi-medium-roast',
    ]);
    ProductVariant::factory()->create([
        'product_id' => $product->id,
        'active' => true,
        'label' => '250g',
        'price_minor' => 15000,
        'stock' => 5,
    ]);

    $this->get('/shop/nganzi-medium-roast')
        ->assertOk()
        ->assertSee('Nganzi Medium Roast')
        ->assertSee('250g');
});

test('unpublished product returns 404', function () {
    $category = Category::factory()->create();
    Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Draft,
        'slug' => 'secret-coffee',
    ]);

    $this->get('/shop/secret-coffee')->assertNotFound();
});

test('non-existent product returns 404', function () {
    $this->get('/shop/does-not-exist')->assertNotFound();
});

test('product detail shows only active variants', function () {
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'category_id' => $category->id,
        'status' => ProductStatus::Published,
        'slug' => 'variant-test',
    ]);

    ProductVariant::factory()->create([
        'product_id' => $product->id,
        'active' => true,
        'label' => '500g',
    ]);
    ProductVariant::factory()->create([
        'product_id' => $product->id,
        'active' => false,
        'label' => '1kg Inactive',
    ]);

    $response = $this->get('/shop/variant-test')->assertOk();

    // The controller only loads active variants, so inactive ones should not appear
    $page = $response->original->getData()['page']['props']['product'];
    $variantLabels = collect($page['variants'])->pluck('label')->all();

    expect($variantLabels)->toContain('500g');
    expect($variantLabels)->not->toContain('1kg Inactive');
});

/* ── Static & marketing pages ─────────────────────────────────────── */

test('about page loads', function () {
    $this->get('/about')->assertOk();
});

test('coffee guide page loads', function () {
    $this->get('/coffee')->assertOk();
});

test('contact page loads', function () {
    $this->get('/contact')->assertOk();
});

test('delivery page loads', function () {
    $this->get('/delivery')->assertOk();
});

test('privacy page loads', function () {
    $this->get('/privacy')->assertOk();
    $this->get('/policies/privacy-policy')->assertOk();
});

test('terms page loads', function () {
    $this->get('/terms')->assertOk();
});

test('sitemap xml endpoint returns valid xml with published products', function () {
    $response = $this->get('/sitemap.xml');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/xml; charset=utf-8');
    $this->assertStringContainsString('<?xml version="1.0" encoding="UTF-8"?>', $response->getContent());
    $this->assertStringContainsString('<loc>', $response->getContent());
    $this->assertStringContainsString('/shop', $response->getContent());
});
