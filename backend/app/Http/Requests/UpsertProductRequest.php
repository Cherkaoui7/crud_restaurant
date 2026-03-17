<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class UpsertProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'stock_quantity' => ['required', 'integer', 'min:0', 'max:999999'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'image' => ['nullable', 'image', 'max:3072'],
            'is_active' => ['required', 'boolean'],
            'remove_image' => ['nullable', 'boolean'],
            'allergens' => ['nullable', 'array'],
            'allergens.*' => ['integer', 'exists:allergens,id'],
            'modifiers' => ['nullable', 'array', 'max:8'],
            'modifiers.*.name' => ['required', 'string', 'max:80'],
            'modifiers.*.price_adjustment' => ['nullable', 'numeric', 'min:-999999.99', 'max:999999.99'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $payload = [];

        if ($this->filled('name')) {
            $payload['name'] = Str::squish((string) $this->input('name'));
        }

        if ($this->has('description')) {
            $payload['description'] = $this->filled('description')
                ? trim((string) $this->input('description'))
                : null;
        }

        if ($this->has('allergens')) {
            $payload['allergens'] = collect($this->input('allergens', []))
                ->filter(fn ($value) => $value !== null && $value !== '')
                ->map(fn ($value) => (int) $value)
                ->unique()
                ->values()
                ->all();
        }

        if ($this->has('modifiers')) {
            $payload['modifiers'] = collect($this->input('modifiers', []))
                ->map(function ($modifier): array {
                    return [
                        'name' => Str::squish((string) ($modifier['name'] ?? '')),
                        'price_adjustment' => $modifier['price_adjustment'] === '' || $modifier['price_adjustment'] === null
                            ? 0
                            : (float) $modifier['price_adjustment'],
                    ];
                })
                ->filter(fn (array $modifier) => $modifier['name'] !== '')
                ->values()
                ->all();
        }

        foreach (['is_active', 'remove_image'] as $field) {
            if ($this->has($field)) {
                $payload[$field] = filter_var(
                    $this->input($field),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                );
            }
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }
}
