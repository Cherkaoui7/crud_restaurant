<?php

namespace Database\Seeders;

use App\Models\Allergen;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $categories = collect([
            'Entree',
            'Plat principal',
            'Dessert',
            'Boisson',
        ])->mapWithKeys(function (string $name): array {
            $category = Category::query()->updateOrCreate(
                ['name' => $name],
                ['name' => $name]
            );

            return [$name => $category];
        });

        $allergens = collect([
            ['name' => 'Dairy', 'icon' => 'dairy'],
            ['name' => 'Egg', 'icon' => 'egg'],
            ['name' => 'Gluten', 'icon' => 'gluten'],
            ['name' => 'Nuts', 'icon' => 'nuts'],
            ['name' => 'Shellfish', 'icon' => 'shellfish'],
            ['name' => 'Soy', 'icon' => 'soy'],
        ])->mapWithKeys(function (array $allergen): array {
            $record = Allergen::query()->updateOrCreate(
                ['name' => $allergen['name']],
                ['icon' => $allergen['icon']]
            );

            return [$record->name => $record];
        });

        User::query()->updateOrCreate(
            ['email' => 'admin@restaurant.test'],
            [
                'name' => 'Gerant',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'employee@restaurant.test'],
            [
                'name' => 'Employe',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'employee',
            ]
        );

        $products = [
            [
                'name' => 'Salade Cesar',
                'description' => 'Laitue croquante, parmesan, croutons et sauce maison.',
                'price' => 8.50,
                'stock_quantity' => 14,
                'category' => 'Entree',
                'is_active' => true,
                'allergens' => ['Dairy', 'Gluten', 'Egg'],
            ],
            [
                'name' => 'Burger Signature',
                'description' => 'Steak grille, cheddar affine, pickles et sauce barbecue.',
                'price' => 14.90,
                'stock_quantity' => 18,
                'category' => 'Plat principal',
                'is_active' => true,
                'allergens' => ['Dairy', 'Gluten', 'Egg'],
                'modifiers' => [
                    ['name' => 'Double steak', 'price_adjustment' => 3.50],
                    ['name' => 'Menu combo', 'price_adjustment' => 4.90],
                ],
            ],
            [
                'name' => 'Pates Primavera',
                'description' => 'Pates fraiches, legumes sautes et creme legere au basilic.',
                'price' => 12.90,
                'stock_quantity' => 9,
                'category' => 'Plat principal',
                'is_active' => true,
                'allergens' => ['Dairy', 'Gluten'],
            ],
            [
                'name' => 'Tiramisu',
                'description' => 'Dessert italien au cafe et mascarpone.',
                'price' => 6.20,
                'stock_quantity' => 5,
                'category' => 'Dessert',
                'is_active' => true,
                'allergens' => ['Dairy', 'Egg', 'Gluten'],
            ],
            [
                'name' => 'Citronnade Maison',
                'description' => 'Boisson fraiche aux citrons presses et menthe.',
                'price' => 4.50,
                'stock_quantity' => 24,
                'category' => 'Boisson',
                'is_active' => true,
                'modifiers' => [
                    ['name' => '50 cl', 'price_adjustment' => 0],
                    ['name' => '1 L', 'price_adjustment' => 2.00],
                ],
            ],
            [
                'name' => 'Cheesecake Fruits Rouges',
                'description' => 'Part de cheesecake cremeux avec coulis de fruits rouges.',
                'price' => 6.80,
                'stock_quantity' => 0,
                'category' => 'Dessert',
                'is_active' => false,
                'allergens' => ['Dairy', 'Egg', 'Gluten'],
            ],
        ];

        foreach ($products as $productData) {
            $product = Product::query()->updateOrCreate(
                ['name' => $productData['name']],
                [
                    'description' => $productData['description'],
                    'price' => $productData['price'],
                    'stock_quantity' => $productData['stock_quantity'],
                    'category_id' => $categories[$productData['category']]->id,
                    'is_active' => $productData['is_active'],
                ]
            );

            $product->allergens()->sync(
                collect($productData['allergens'] ?? [])
                    ->map(fn (string $name) => $allergens[$name]->id)
                    ->all()
            );

            $product->modifiers()->delete();

            if (! empty($productData['modifiers'])) {
                $product->modifiers()->createMany($productData['modifiers']);
            }
        }
    }
}
