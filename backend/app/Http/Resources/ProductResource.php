<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $lowStockThreshold = (int) $this->low_stock_threshold;
        $stockState = match (true) {
            (int) $this->stock_quantity <= 0 => 'out',
            (int) $this->stock_quantity <= $lowStockThreshold => 'low',
            default => 'in',
        };

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => (float) $this->price,
            'formatted_price' => number_format((float) $this->price, 2, '.', ' '),
            'stock_quantity' => (int) $this->stock_quantity,
            'low_stock_threshold' => $lowStockThreshold,
            'stock_state' => $stockState,
            'is_in_stock' => (int) $this->stock_quantity > 0,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                ];
            }),
            'allergens' => $this->whenLoaded('allergens', function () {
                return $this->allergens->map(function ($allergen) {
                    return [
                        'id' => $allergen->id,
                        'name' => $allergen->name,
                        'icon' => $allergen->icon,
                    ];
                })->values();
            }),
            'modifiers' => $this->whenLoaded('modifiers', function () {
                return $this->modifiers->map(function ($modifier) {
                    return [
                        'id' => $modifier->id,
                        'name' => $modifier->name,
                        'price_adjustment' => (float) $modifier->price_adjustment,
                    ];
                })->values();
            }),
            'image_path' => $this->image_path,
            'image_url' => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
