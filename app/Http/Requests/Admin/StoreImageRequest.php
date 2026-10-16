<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $maxKb = (int) config('shop.media_max_kb', 4096);

        return [
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', "max:{$maxKb}"],
            'alt' => ['nullable', 'string', 'max:255'],
        ];
    }
}
