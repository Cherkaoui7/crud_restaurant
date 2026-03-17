<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Symfony\Component\HttpFoundation\Response;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categories = Category::query()
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UpsertCategoryRequest $request): Response
    {
        $category = Category::query()->create($request->validated());

        return CategoryResource::make($category->loadCount('products'))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->loadCount('products'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpsertCategoryRequest $request, Category $category): CategoryResource
    {
        $category->update($request->validated());

        return new CategoryResource($category->loadCount('products'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): Response
    {
        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Cette categorie contient encore des produits actifs.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $category->delete();

        return response()->noContent();
    }
}
