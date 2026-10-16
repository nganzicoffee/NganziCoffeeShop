<?php

namespace Database\Seeders;

use App\Enums\InventoryReason;
use App\Enums\ProductStatus;
use App\Enums\StaffRole;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedStaff();
        $this->seedCatalogue();
    }

    private function seedStaff(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@nganzi.test'],
            [
                'name' => 'Nganzi Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => StaffRole::Owner,
            ]
        );

        User::firstOrCreate(
            ['email' => 'orders@nganzi.test'],
            [
                'name' => 'Order Manager',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => StaffRole::OrderManager,
            ]
        );
    }

    private function seedCatalogue(): void
    {
        $productsData = [
            [
                'category_name' => 'Light Roast',
                'category_slug' => 'light-roast',
                'sort_order' => 1,
                'name' => 'Nganzi Light Roast',
                'slug' => 'light-roast',
                'description' => 'A delicate, lively cup with floral character and fruit-forward notes. Grown in Western Uganda and roasted to preserve honey, red berry, and jasmine notes.',
                'image_path' => 'products/light-roast.webp',
                'variants' => [
                    ['label' => '100g', 'price_minor' => 12000, 'stock' => 30],
                    ['label' => '250g', 'price_minor' => 25000, 'stock' => 50],
                    ['label' => '500g', 'price_minor' => 45000, 'stock' => 35],
                    ['label' => '1kg',  'price_minor' => 85000, 'stock' => 20],
                ],
            ],
            [
                'category_name' => 'Medium Roast',
                'category_slug' => 'medium-roast',
                'sort_order' => 2,
                'name' => 'Nganzi Medium Roast',
                'slug' => 'medium-roast',
                'description' => 'A versatile, smooth cup balancing caramel sweetness and cocoa. Smooth enough for everyday brewing and expressive enough to drink black.',
                'image_path' => 'products/medium-roast.webp',
                'variants' => [
                    ['label' => '100g', 'price_minor' => 12000, 'stock' => 30],
                    ['label' => '250g', 'price_minor' => 25000, 'stock' => 60],
                    ['label' => '500g', 'price_minor' => 45000, 'stock' => 40],
                    ['label' => '1kg',  'price_minor' => 85000, 'stock' => 25],
                ],
            ],
            [
                'category_name' => 'Dark Roast',
                'category_slug' => 'dark-roast',
                'sort_order' => 3,
                'name' => 'Nganzi Dark Roast',
                'slug' => 'dark-roast',
                'description' => 'A rich, deep roast with a lingering smoky finish. Stands up beautifully to milk and delivers bold chocolate and molasses intensity.',
                'image_path' => 'products/dark-roast.webp',
                'variants' => [
                    ['label' => '100g', 'price_minor' => 12000, 'stock' => 25],
                    ['label' => '250g', 'price_minor' => 25000, 'stock' => 50],
                    ['label' => '500g', 'price_minor' => 45000, 'stock' => 30],
                    ['label' => '1kg',  'price_minor' => 85000, 'stock' => 15],
                ],
            ],
            [
                'category_name' => 'Raw Beans',
                'category_slug' => 'raw-beans',
                'sort_order' => 4,
                'name' => 'Nganzi Raw Coffee Beans',
                'slug' => 'raw-coffee-beans',
                'description' => 'Unroasted single-origin green coffee beans available in Robusta and Arabica varieties directly from our Komurubuga Coffee Farm.',
                'image_path' => 'products/raw-beans.webp',
                'variants' => [
                    ['label' => '500g', 'price_minor' => 30000, 'stock' => 40],
                    ['label' => '1kg',  'price_minor' => 55000, 'stock' => 50],
                ],
            ],
        ];

        foreach ($productsData as $data) {
            $category = Category::firstOrCreate(
                ['slug' => $data['category_slug']],
                ['name' => $data['category_name'], 'sort_order' => $data['sort_order']]
            );

            $product = Product::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'category_id' => $category->id,
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'status' => ProductStatus::Published,
                    'featured' => true,
                    'seo_title' => $data['name'].' — Nganzi Coffee',
                    'seo_description' => $data['description'],
                ]
            );

            ProductImage::firstOrCreate(
                ['product_id' => $product->id, 'path' => $data['image_path']],
                ['alt' => $data['name'], 'sort_order' => 1]
            );

            foreach ($data['variants'] as $v) {
                $variant = ProductVariant::updateOrCreate(
                    ['product_id' => $product->id, 'label' => $v['label']],
                    [
                        'sku' => strtoupper(substr($data['slug'], 0, 3)).'-'.$v['label'],
                        'price_minor' => $v['price_minor'],
                        'stock' => $v['stock'],
                        'active' => true,
                    ]
                );

                InventoryMovement::firstOrCreate(
                    ['variant_id' => $variant->id, 'reason' => InventoryReason::InitialStock],
                    [
                        'actor_id' => null,
                        'order_id' => null,
                        'delta' => $v['stock'],
                        'stock_before' => 0,
                        'stock_after' => $v['stock'],
                        'note' => 'Initial stock for '.$data['name'].' ('.$v['label'].')',
                    ]
                );
            }
        }
    }
}
