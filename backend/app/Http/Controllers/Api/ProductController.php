<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportProductsRequest;
use App\Http\Requests\UpsertProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Allergen;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->integer('per_page', 8), 1), 30);
        $products = $this->filteredProductsQuery($request)
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return ProductResource::collection($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UpsertProductRequest $request): Response
    {
        $validated = $request->validated();
        $product = Product::query()->create($this->payloadFromRequest($request));
        $this->syncRelations($product, $validated);

        return ProductResource::make($product->load(['category', 'allergens', 'modifiers']))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'allergens', 'modifiers']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpsertProductRequest $request, Product $product): ProductResource
    {
        $validated = $request->validated();
        $product->update($this->payloadFromRequest($request, $product));
        $this->syncRelations($product, $validated);

        return new ProductResource($product->load(['category', 'allergens', 'modifiers']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): Response
    {
        $product->delete();

        return response()->noContent();
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $products = $this->filteredProductsQuery($request)
            ->latest()
            ->get();

        return response()->streamDownload(function () use ($products): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'name',
                'description',
                'price',
                'stock_quantity',
                'category',
                'is_active',
                'allergens',
                'modifiers',
            ]);

            foreach ($products as $product) {
                fputcsv($handle, [
                    $product->name,
                    $product->description,
                    number_format((float) $product->price, 2, '.', ''),
                    (int) $product->stock_quantity,
                    $product->category?->name,
                    $product->is_active ? 'true' : 'false',
                    $product->allergens->pluck('name')->implode('|'),
                    $product->modifiers
                        ->map(fn ($modifier) => "{$modifier->name}:".number_format((float) $modifier->price_adjustment, 2, '.', ''))
                        ->implode('|'),
                ]);
            }

            fclose($handle);
        }, 'products-export.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function importCsv(ImportProductsRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'rb');

        if ($handle === false) {
            return response()->json([
                'message' => 'Unable to read the CSV file.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $header = fgetcsv($handle);

        if (! $header) {
            fclose($handle);

            return response()->json([
                'message' => 'The CSV file is empty.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $normalizedHeader = collect($header)
            ->map(fn ($column) => Str::of((string) $column)->trim()->lower()->toString())
            ->values()
            ->all();

        $requiredColumns = ['name', 'price', 'category'];

        foreach ($requiredColumns as $column) {
            if (! in_array($column, $normalizedHeader, true)) {
                fclose($handle);

                return response()->json([
                    'message' => "Missing required CSV column: {$column}.",
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        $imported = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if ($row === [null] || $row === false) {
                continue;
            }

            $payload = collect($normalizedHeader)
                ->mapWithKeys(fn ($column, $index) => [$column => trim((string) ($row[$index] ?? ''))])
                ->all();

            if (($payload['name'] ?? '') === '') {
                continue;
            }

            $category = Category::query()->firstOrCreate([
                'name' => $payload['category'],
            ]);

            $product = Product::query()->updateOrCreate(
                ['name' => $payload['name']],
                [
                    'description' => $payload['description'] !== '' ? $payload['description'] : null,
                    'price' => (float) ($payload['price'] ?? 0),
                    'stock_quantity' => max(0, (int) ($payload['stock_quantity'] !== '' ? $payload['stock_quantity'] : 0)),
                    'category_id' => $category->id,
                    'is_active' => filter_var($payload['is_active'] !== '' ? $payload['is_active'] : 'true', FILTER_VALIDATE_BOOLEAN),
                ]
            );

            $allergenIds = collect(explode('|', (string) ($payload['allergens'] ?? '')))
                ->map(fn ($name) => trim($name))
                ->filter()
                ->map(function (string $name) {
                    return Allergen::query()->firstOrCreate(
                        ['name' => $name],
                        ['icon' => Str::slug($name, '_')]
                    )->id;
                })
                ->values()
                ->all();

            $product->allergens()->sync($allergenIds);
            $product->modifiers()->delete();

            $modifiers = collect(explode('|', (string) ($payload['modifiers'] ?? '')))
                ->map(fn ($entry) => trim($entry))
                ->filter()
                ->map(function (string $entry): ?array {
                    [$name, $priceAdjustment] = array_pad(explode(':', $entry, 2), 2, '0');
                    $name = trim($name);

                    if ($name === '') {
                        return null;
                    }

                    return [
                        'name' => $name,
                        'price_adjustment' => (float) trim($priceAdjustment),
                    ];
                })
                ->filter()
                ->values()
                ->all();

            if ($modifiers !== []) {
                $product->modifiers()->createMany($modifiers);
            }

            $imported++;
        }

        fclose($handle);

        return response()->json([
            'message' => 'Products imported successfully.',
            'data' => [
                'imported_count' => $imported,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function payloadFromRequest(UpsertProductRequest $request, ?Product $product = null): array
    {
        $validated = $request->safe()->except(['image', 'remove_image', 'allergens', 'modifiers']);

        if ($request->boolean('remove_image') && $product?->image_path) {
            Storage::disk('public')->delete($product->image_path);
            $validated['image_path'] = null;
        }

        if ($request->hasFile('image')) {
            if ($product?->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }

            $validated['image_path'] = $request->file('image')->store('products', 'public');
        }

        return $validated;
    }

    /**
     * @param array<string, mixed> $validated
     */
    protected function syncRelations(Product $product, array $validated): void
    {
        $product->allergens()->sync(Arr::wrap($validated['allergens'] ?? []));

        $product->modifiers()->delete();

        $modifiers = Collection::make($validated['modifiers'] ?? [])
            ->map(fn (array $modifier): array => [
                'name' => $modifier['name'],
                'price_adjustment' => $modifier['price_adjustment'] ?? 0,
            ])
            ->values()
            ->all();

        if ($modifiers !== []) {
            $product->modifiers()->createMany($modifiers);
        }
    }

    protected function filteredProductsQuery(Request $request): Builder
    {
        $status = (string) $request->input('status', 'all');
        $search = trim((string) $request->input('search', ''));

        return Product::query()
            ->with(['category', 'allergens', 'modifiers'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->filled('category_id'), function ($query) use ($request) {
                $query->where('category_id', $request->integer('category_id'));
            })
            ->when($status === 'active', function ($query) {
                $query->where('is_active', true);
            })
            ->when($status === 'inactive', function ($query) {
                $query->where('is_active', false);
            });
    }
}
