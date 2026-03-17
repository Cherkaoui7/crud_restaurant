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

        return response()->json([
            'data' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'inactive_products' => $totalProducts - $activeProducts,
                'total_categories' => Category::query()->count(),
            ],
        ]);
    }
}
