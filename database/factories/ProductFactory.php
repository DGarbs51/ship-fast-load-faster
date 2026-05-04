<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(3, true);

        return [
            'category_id' => Category::factory(),
            'sku' => fake()->unique()->bothify('SKU-####-????'),
            'name' => Str::title($name),
            'slug' => Str::slug($name.'-'.fake()->unique()->randomNumber()),
            'description' => fake()->paragraph(3),
            'price' => fake()->randomFloat(2, 6, 350),
            'stock_count' => fake()->numberBetween(0, 400),
            'active' => fake()->boolean(92),
        ];
    }
}
