<?php

namespace Tests\Feature;

use App\Models\Allergen;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    private const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgN0X58QAAAAASUVORK5CYII=';

    public function test_admin_can_create_a_product_with_an_image(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create([
            'role' => 'admin',
        ]);
        $category = Category::query()->create([
            'name' => 'Dessert',
        ]);
        $dairy = Allergen::query()->create([
            'name' => 'Dairy',
            'icon' => 'dairy',
        ]);
        $gluten = Allergen::query()->create([
            'name' => 'Gluten',
            'icon' => 'gluten',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->post('/api/products', [
            'name' => 'Fondant chocolat',
            'description' => 'Dessert maison',
            'price' => '7.50',
            'stock_quantity' => 12,
            'low_stock_threshold' => 4,
            'category_id' => $category->id,
            'is_active' => 'true',
            'allergens' => [$dairy->id, $gluten->id],
            'modifiers' => [
                ['name' => 'Large', 'price_adjustment' => '2.50'],
                ['name' => 'Extra scoop', 'price_adjustment' => '1.20'],
            ],
            'image' => UploadedFile::fake()->createWithContent('fondant.png', base64_decode(self::TINY_PNG)),
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Fondant chocolat')
            ->assertJsonPath('data.category_id', $category->id)
            ->assertJsonPath('data.stock_quantity', 12)
            ->assertJsonPath('data.low_stock_threshold', 4)
            ->assertJsonPath('data.stock_state', 'in')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.allergens.0.name', 'Dairy')
            ->assertJsonPath('data.modifiers.0.name', 'Large');

        $this->assertDatabaseHas('products', [
            'name' => 'Fondant chocolat',
            'category_id' => $category->id,
            'stock_quantity' => 12,
            'low_stock_threshold' => 4,
        ]);
        $this->assertDatabaseHas('product_modifiers', [
            'name' => 'Large',
            'price_adjustment' => 2.50,
        ]);
        $this->assertDatabaseHas('allergen_product', [
            'allergen_id' => $dairy->id,
            'product_id' => $response->json('data.id'),
        ]);

        Storage::disk('public')->assertExists($response->json('data.image_path'));
    }

    public function test_admin_can_update_product_allergens_and_modifiers(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);
        $category = Category::query()->create([
            'name' => 'Plat principal',
        ]);
        $dairy = Allergen::query()->create([
            'name' => 'Dairy',
            'icon' => 'dairy',
        ]);
        $soy = Allergen::query()->create([
            'name' => 'Soy',
            'icon' => 'soy',
        ]);

        $product = Product::query()->create([
            'name' => 'Ramen maison',
            'description' => 'Bouillon longuement mijote',
            'price' => 15.90,
            'stock_quantity' => 9,
            'low_stock_threshold' => 4,
            'category_id' => $category->id,
            'is_active' => true,
        ]);
        $product->modifiers()->create([
            'name' => 'Standard',
            'price_adjustment' => 0,
        ]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/products/{$product->id}", [
            'name' => 'Ramen maison',
            'description' => 'Bouillon miso et garnitures',
            'price' => '16.40',
            'stock_quantity' => 3,
            'low_stock_threshold' => 4,
            'category_id' => $category->id,
            'is_active' => true,
            'allergens' => [$dairy->id, $soy->id],
            'modifiers' => [
                ['name' => 'Large bowl', 'price_adjustment' => '2.00'],
                ['name' => 'Extra egg', 'price_adjustment' => '1.50'],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.stock_quantity', 3)
            ->assertJsonPath('data.low_stock_threshold', 4)
            ->assertJsonPath('data.stock_state', 'low')
            ->assertJsonPath('data.modifiers.0.name', 'Large bowl')
            ->assertJsonPath('data.allergens.1.name', 'Soy');

        $this->assertDatabaseMissing('product_modifiers', [
            'product_id' => $product->id,
            'name' => 'Standard',
        ]);
        $this->assertDatabaseHas('product_modifiers', [
            'product_id' => $product->id,
            'name' => 'Extra egg',
            'price_adjustment' => 1.50,
        ]);
        $this->assertDatabaseHas('allergen_product', [
            'product_id' => $product->id,
            'allergen_id' => $soy->id,
        ]);
    }

    public function test_employee_cannot_create_a_product(): void
    {
        $employee = User::factory()->create([
            'role' => 'employee',
        ]);
        $category = Category::query()->create([
            'name' => 'Boisson',
        ]);

        Sanctum::actingAs($employee);

        $this->postJson('/api/products', [
            'name' => 'The glace',
            'description' => 'Boisson froide',
            'price' => '4.20',
            'stock_quantity' => 7,
            'low_stock_threshold' => 3,
            'category_id' => $category->id,
            'is_active' => true,
        ])->assertForbidden();
    }

    public function test_admin_can_export_products_as_csv(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);
        $category = Category::query()->create([
            'name' => 'Boisson',
        ]);
        $allergen = Allergen::query()->create([
            'name' => 'Soy',
            'icon' => 'soy',
        ]);

        $product = Product::query()->create([
            'name' => 'Latte glace',
            'description' => 'Cafe froid au lait',
            'price' => 5.80,
            'stock_quantity' => 4,
            'low_stock_threshold' => 6,
            'category_id' => $category->id,
            'is_active' => true,
        ]);
        $product->allergens()->sync([$allergen->id]);
        $product->modifiers()->create([
            'name' => 'Large',
            'price_adjustment' => 1.50,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->get('/api/products/export/csv');

        $response
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();

        $this->assertStringContainsString('name,description,price,stock_quantity,low_stock_threshold,category,is_active,allergens,modifiers', $csv);
        $this->assertStringContainsString('Latte glace', $csv);
        $this->assertStringContainsString(',4,6,Boisson,true,', $csv);
        $this->assertStringContainsString('Soy', $csv);
        $this->assertStringContainsString('Large:1.50', $csv);
    }

    public function test_admin_can_import_products_from_csv(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        Sanctum::actingAs($admin);

        $csv = <<<CSV
name,description,price,stock_quantity,low_stock_threshold,category,is_active,allergens,modifiers
Club Sandwich,Chicken bacon sandwich,11.90,8,3,Plat principal,true,Gluten|Egg,Large:2.00|Extra bacon:1.50
Fresh Juice,Orange and carrot,4.80,0,2,Boisson,true,,50 cl:0.00|1 L:2.50
CSV;

        $response = $this->post('/api/products/import/csv', [
            'file' => UploadedFile::fake()->createWithContent('products.csv', $csv),
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.imported_count', 2);

        $this->assertDatabaseHas('products', [
            'name' => 'Club Sandwich',
            'stock_quantity' => 8,
            'low_stock_threshold' => 3,
        ]);
        $this->assertDatabaseHas('products', [
            'name' => 'Fresh Juice',
            'stock_quantity' => 0,
            'low_stock_threshold' => 2,
        ]);
        $this->assertDatabaseHas('categories', [
            'name' => 'Plat principal',
        ]);
        $this->assertDatabaseHas('allergens', [
            'name' => 'Gluten',
        ]);
        $this->assertDatabaseHas('product_modifiers', [
            'name' => 'Extra bacon',
            'price_adjustment' => 1.50,
        ]);
    }

    public function test_category_cannot_be_deleted_when_it_is_used_by_a_product(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);
        $category = Category::query()->create([
            'name' => 'Plat principal',
        ]);

        Product::query()->create([
            'name' => 'Pizza napolitaine',
            'description' => 'Sauce tomate et mozzarella',
            'price' => 13.90,
            'category_id' => $category->id,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $this->deleteJson("/api/categories/{$category->id}")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Cette categorie contient encore des produits actifs.');
    }
}
