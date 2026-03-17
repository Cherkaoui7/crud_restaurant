<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductModifier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price_adjustment',
    ];

    protected function casts(): array
    {
        return [
            'price_adjustment' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
