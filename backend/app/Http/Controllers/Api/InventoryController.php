<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    public function alerts(): JsonResponse
    {
        $totalProducts = Product::query()->count();
        $outOfStockProducts = Product::query()
            ->where('stock_quantity', '<=', 0)
            ->count();
        $lowStockProducts = Product::query()
            ->where('stock_quantity', '>', 0)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->count();
        $inStockProducts = max(0, $totalProducts - $outOfStockProducts - $lowStockProducts);

        $urgentProducts = Product::query()
            ->with(['category', 'allergens', 'modifiers'])
            ->where(function ($query): void {
                $query
                    ->where('stock_quantity', '<=', 0)
                    ->orWhere(function ($nestedQuery): void {
                        $nestedQuery
                            ->where('stock_quantity', '>', 0)
                            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
                    });
            })
            ->orderByRaw('CASE WHEN stock_quantity <= 0 THEN 0 ELSE 1 END')
            ->orderBy('stock_quantity')
            ->orderBy('name')
            ->limit(12)
            ->get();

        return response()->json([
            'data' => [
                'total_products' => $totalProducts,
                'in_stock_products' => $inStockProducts,
                'low_stock_products' => $lowStockProducts,
                'out_of_stock_products' => $outOfStockProducts,
                'urgent_products' => ProductResource::collection($urgentProducts)->resolve(),
            ],
        ]);
    }
}
