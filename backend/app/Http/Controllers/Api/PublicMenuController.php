<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;

class PublicMenuController extends Controller
{
    /**
     * Get all categories with their active products (including modifiers and allergens).
     */
    public function index(Request $request)
    {
        $categories = Category::with(['products' => function ($query) {
            $query->where('is_active', true)
                  ->with(['modifiers', 'allergens']);
        }])
        ->whereHas('products', function ($query) {
            $query->where('is_active', true);
        })
        ->orderBy('name')
        ->get();

        return CategoryResource::collection($categories);
    }
}
