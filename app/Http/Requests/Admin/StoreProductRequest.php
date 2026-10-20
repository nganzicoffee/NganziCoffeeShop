<?php

namespace App\Http\Requests\Admin;

use App\Enums\ProductStatus;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', 'unique:products,slug'],
            'category_id' => ['nullable', 'required_without:category_name', 'integer', 'exists:categories,id'],
            'category_name' => ['nullable', 'required_without:category_id', 'string', 'max:100', 'regex:/[\pL\pN]/u'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', Rule::enum(ProductStatus::class)],
            'featured' => ['boolean'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],
            'variants' => ['sometimes', 'array', 'min:1', 'max:20'],
            'variants.*' => ['array:label,price_minor,stock'],
            'variants.*.label' => ['required', 'string', 'max:100', 'distinct:ignore_case'],
            'variants.*.price_minor' => ['required', 'integer', 'between:0,2000000000'],
            'variants.*.stock' => ['required', 'integer', 'between:0,1000000'],
            'front_image' => ['nullable', 'required_with:back_image', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.config('shop.media_max_kb', 4096)],
            'back_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.config('shop.media_max_kb', 4096)],
        ];
    }
}
