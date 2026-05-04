<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'number' => 'SF-'.fake()->unique()->numerify('########'),
            'status' => fake()->randomElement(Order::STATUSES),
            'total' => fake()->randomFloat(2, 12, 900),
        ];
    }
}
