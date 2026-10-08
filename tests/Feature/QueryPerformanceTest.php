<?php

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Count the queries a GET request runs as an authenticated user.
 */
function queriesFor(string $uri): int
{
    DB::flushQueryLog();
    DB::enableQueryLog();

    test()->get($uri)->assertOk();

    $count = count(DB::getQueryLog());
    DB::disableQueryLog();

    return $count;
}

function seedCatalog(int $orders): void
{
    $category = Category::factory()->create();
    $products = Product::factory()->count(3)->for($category)->create();

    Order::factory()
        ->count($orders)
        ->has(OrderItem::factory()->count(2)->state(fn () => ['product_id' => $products->random()->id]), 'items')
        ->create();

    Review::factory()->count(5)->state(fn () => ['product_id' => $products->random()->id])->create();
}

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('list pages run a constant number of queries regardless of row count', function (string $uri) {
    seedCatalog(2);
    $small = queriesFor($uri);

    seedCatalog(10);
    $large = queriesFor($uri);

    expect($large)->toBe($small);
})->with(['/dashboard', '/products', '/orders', '/customers']);

test('detail pages run a constant number of queries regardless of related rows', function () {
    seedCatalog(2);
    $product = Product::first();
    $order = Order::first();
    OrderItem::factory()->for($product)->for($order)->create();
    Review::factory()->for($product)->create();
    $productQueries = queriesFor("/products/{$product->id}");
    $orderQueries = queriesFor("/orders/{$order->id}");

    OrderItem::factory()->count(10)->for($product)->for($order)->create();
    Review::factory()->count(10)->for($product)->create();

    expect(queriesFor("/products/{$product->id}"))->toBe($productQueries)
        ->and(queriesFor("/orders/{$order->id}"))->toBe($orderQueries);
});

test('dashboard aggregates are computed in the database correctly', function () {
    $product = Product::factory()->create(['stock_count' => 5]);
    Review::factory()->for($product)->create(['rating' => 4]);
    Review::factory()->for($product)->create(['rating' => 5]);

    $thisMonth = Order::factory()->create(['total' => 100, 'status' => 'pending']);
    Order::factory()->create(['total' => 50, 'status' => 'paid']);
    Order::factory()->create(['total' => 999, 'status' => 'pending', 'created_at' => now()->subMonths(2)]);
    OrderItem::factory()->for($thisMonth)->for($product)->create(['quantity' => 2, 'line_total' => 100]);

    $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page
        ->where('metrics.total_revenue_this_month', 150)
        ->where('metrics.total_orders_this_month', 2)
        ->where('metrics.average_order_value', 75)
        ->where('metrics.pending_orders', 2)
        ->where('metrics.low_stock_products', 1)
        ->where('topProducts.0.id', $product->id)
        ->where('topProducts.0.revenue', 100)
        ->where('topProducts.0.units_sold', 2)
        ->where('topProducts.0.average_rating', 4.5)
        ->etc()
    );
});

test('customers list shows order count, spend and last order date', function () {
    $customer = Customer::factory()->create();
    Order::factory()->for($customer)->create(['total' => 20, 'created_at' => now()->subDays(5)]);
    $latest = Order::factory()->for($customer)->create(['total' => 30, 'created_at' => now()->subDay()]);

    $this->get('/customers')->assertInertia(fn (Assert $page) => $page
        ->where('customers.data.0.order_count', 2)
        ->where('customers.data.0.total_spend', 50)
        ->where('customers.data.0.last_order_at', $latest->created_at->toISOString())
        ->etc()
    );
});
