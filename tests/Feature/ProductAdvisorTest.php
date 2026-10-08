<?php

use App\Ai\Agents\ProductAdvisor;
use App\Ai\Tools\SearchProducts;
use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Ai\Prompts\AgentPrompt;
use Laravel\Ai\Tools\Request;

test('guests cannot use the advisor', function () {
    $this->get('/advisor?question=lamps')->assertRedirect(route('login'));
});

test('the advisor page renders without prompting when no question is asked', function () {
    ProductAdvisor::fake();

    $this->actingAs(User::factory()->create())
        ->get('/advisor')
        ->assertInertia(fn (Assert $page) => $page->component('advisor')->where('answer', null));

    ProductAdvisor::assertNeverPrompted();
});

test('the advisor returns structured recommendations', function () {
    ProductAdvisor::fake([[
        'recommendations' => [['product_id' => 7, 'name' => 'Studio Desk Lamp', 'reason' => 'Top seller in Lighting.']],
        'confidence' => 0.8,
        'reasoning' => 'Searched for lamps.',
    ]]);

    $this->actingAs(User::factory()->create())
        ->get('/advisor?question='.urlencode('best desk lamps'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('answer.recommendations.0.product_id', 7)
            ->where('answer.confidence', 0.8)
            ->has('answer.tokens')
        );

    ProductAdvisor::assertPrompted(fn (AgentPrompt $prompt) => $prompt->contains('best desk lamps'));
});

test('provider failures show a friendly error', function () {
    ProductAdvisor::fake(fn () => throw new RuntimeException('No API key'));

    $this->actingAs(User::factory()->create())
        ->get('/advisor?question=lamps')
        ->assertInertia(fn (Assert $page) => $page->has('answer.error'));
});

test('questions are length limited', function () {
    ProductAdvisor::fake();

    $this->actingAs(User::factory()->create())
        ->get('/advisor?question='.str_repeat('a', 501))
        ->assertSessionHasErrors('question');

    ProductAdvisor::assertNeverPrompted();
});

test('search products tool filters by keyword, category and price, best sellers first', function () {
    $lighting = Category::factory()->create(['name' => 'Lighting']);
    $slowLamp = Product::factory()->for($lighting)->create(['name' => 'Studio Desk Lamp', 'price' => 50, 'active' => true]);
    $hotLamp = Product::factory()->for($lighting)->create(['name' => 'Compact Desk Lamp', 'price' => 80, 'active' => true]);
    Product::factory()->for($lighting)->create(['name' => 'Luxury Desk Lamp', 'price' => 500, 'active' => true]);
    Product::factory()->for($lighting)->create(['name' => 'Retired Desk Lamp', 'price' => 20, 'active' => false]);
    Product::factory()->create(['name' => 'Desk Lamp Elsewhere', 'price' => 20, 'active' => true]);
    OrderItem::factory()->for($hotLamp)->create(['quantity' => 5]);

    $results = (new SearchProducts)->search('lamp', 'Lighting', 100);

    expect(array_column($results, 'id'))->toBe([$hotLamp->id, $slowLamp->id])
        ->and($results[0]['units_sold'])->toBe(5);
});

test('search products tool returns json for the model', function () {
    Product::factory()->create(['name' => 'Travel Pouch', 'active' => true]);

    $json = (new SearchProducts)->handle(new Request(['query' => 'pouch']));

    expect(json_decode((string) $json, true))->toHaveCount(1);
});
