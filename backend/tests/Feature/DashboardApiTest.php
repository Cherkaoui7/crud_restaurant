<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_stats_requires_authentication(): void
    {
        $this->getJson('/api/dashboard/stats')->assertUnauthorized();
    }

    public function test_authenticated_user_can_fetch_dashboard_stats(): void
    {
        $user = User::factory()->create([
            'role' => 'employee',
        ]);

        $starters = Category::query()->create(['name' => 'Starters']);
        $mains = Category::query()->create(['name' => 'Mains']);
        $desserts = Category::query()->create(['name' => 'Desserts']);

        Product::query()->create([
            'name' => 'Soup of the day',
            'description' => 'Seasonal vegetables',
            'price' => 6.50,
            'category_id' => $starters->id,
            'is_active' => true,
        ]);

        Product::query()->create([
            'name' => 'Pasta fresca',
            'description' => 'Tomato and basil',
            'price' => 12.90,
            'category_id' => $mains->id,
            'is_active' => true,
        ]);

        Product::query()->create([
            'name' => 'Lemon tart',
            'description' => 'Citrus dessert',
            'price' => 5.90,
            'category_id' => $desserts->id,
            'is_active' => false,
        ]);

        $archived = Product::query()->create([
            'name' => 'Archived special',
            'description' => 'No longer visible',
            'price' => 9.50,
            'category_id' => $mains->id,
            'is_active' => true,
        ]);
        $archived->delete();

        Sanctum::actingAs($user);

        $this->getJson('/api/dashboard/stats')
            ->assertOk()
            ->assertJsonPath('data.total_products', 3)
            ->assertJsonPath('data.active_products', 2)
            ->assertJsonPath('data.inactive_products', 1)
            ->assertJsonPath('data.total_categories', 3);
    }
}
