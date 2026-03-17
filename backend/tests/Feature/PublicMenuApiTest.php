<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicMenuApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_active_products_in_categories(): void
    {
        $category1 = Category::factory()->create(['name' => 'Pizza']);
        
        $activeProduct = Product::factory()->create([
            'category_id' => $category1->id,
            'is_active' => true,
        ]);
        
        $inactiveProduct = Product::factory()->create([
            'category_id' => $category1->id,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/public/menu');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        
        // Assert active product is present
        $response->assertJsonFragment([
            'id' => $activeProduct->id,
            'name' => $activeProduct->name,
        ]);

        // Assert inactive product is missing
        $response->assertJsonMissing([
            'name' => $inactiveProduct->name,
        ]);
    }
}
