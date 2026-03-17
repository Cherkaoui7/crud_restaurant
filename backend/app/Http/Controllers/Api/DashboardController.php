<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalProducts = Product::query()->count();
        $activeProducts = Product::query()
            ->where('is_active', true)
            ->count();
        $outOfStockProducts = Product::query()
            ->where('stock_quantity', '<=', 0)
            ->count();
        $lowStockProducts = Product::query()
            ->where('stock_quantity', '>', 0)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->count();
        $inStockProducts = max(0, $totalProducts - $outOfStockProducts - $lowStockProducts);

        return response()->json([
            'data' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'inactive_products' => $totalProducts - $activeProducts,
                'total_categories' => Category::query()->count(),
                'in_stock_products' => $inStockProducts,
                'low_stock_products' => $lowStockProducts,
                'out_of_stock_products' => $outOfStockProducts,
            ],
        ]);
    }
}
