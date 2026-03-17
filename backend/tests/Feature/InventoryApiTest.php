<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_alerts_requires_authentication(): void
    {
        $this->getJson('/api/inventory/alerts')->assertUnauthorized();
    }

    public function test_authenticated_user_can_fetch_inventory_alerts(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);
        $category = Category::query()->create([
            'name' => 'Plat principal',
        ]);

        Product::query()->create([
            'name' => 'Burger maison',
            'description' => 'Steak et cheddar',
            'price' => 14.90,
            'stock_quantity' => 10,
            'low_stock_threshold' => 4,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        Product::query()->create([
            'name' => 'Penne pesto',
            'description' => 'Basilic et parmesan',
            'price' => 12.50,
            'stock_quantity' => 3,
            'low_stock_threshold' => 5,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        Product::query()->create([
            'name' => 'Cheesecake',
            'description' => 'Dessert cremeux',
            'price' => 6.80,
            'stock_quantity' => 0,
            'low_stock_threshold' => 2,
            'category_id' => $category->id,
            'is_active' => false,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/inventory/alerts')
            ->assertOk()
            ->assertJsonPath('data.total_products', 3)
            ->assertJsonPath('data.in_stock_products', 1)
            ->assertJsonPath('data.low_stock_products', 1)
            ->assertJsonPath('data.out_of_stock_products', 1)
            ->assertJsonCount(2, 'data.urgent_products')
            ->assertJsonPath('data.urgent_products.0.name', 'Cheesecake')
            ->assertJsonPath('data.urgent_products.0.stock_state', 'out')
            ->assertJsonPath('data.urgent_products.1.name', 'Penne pesto')
            ->assertJsonPath('data.urgent_products.1.stock_state', 'low');
    }
}
