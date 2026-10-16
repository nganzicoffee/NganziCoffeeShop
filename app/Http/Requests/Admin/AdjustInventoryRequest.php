<?php

namespace App\Http\Requests\Admin;

use App\Enums\InventoryReason;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manageInventory', Product::class);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'delta' => ['required', 'integer', 'not_in:0'],
            'reason' => ['required', Rule::enum(InventoryReason::class)],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
