<?php

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('a warm cache skips the dashboard aggregate queries', function () {
    Order::factory()->count(3)->create();

    $aggregateQueries = function (): int {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->get('/dashboard')->assertOk();

        return collect(DB::getQueryLog())
            ->pluck('query')
            ->filter(fn (string $sql): bool => str_contains($sql, '"orders"') || str_contains($sql, '"categories"'))
            ->count();
    };

    expect($aggregateQueries())->toBeGreaterThan(0)
        ->and($aggregateQueries())->toBe(0);
});

test('saving an order invalidates the cached metrics', function () {
    Order::factory()->create(['total' => 100, 'status' => 'paid']);

    $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page
        ->where('metrics.total_orders_this_month', 1)
        ->where('metrics.pending_orders', 0)
        ->etc()
    );

    Order::first()->update(['status' => 'pending']);
    Order::factory()->create(['total' => 50, 'status' => 'paid']);

    $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page
        ->where('metrics.total_orders_this_month', 2)
        ->where('metrics.total_revenue_this_month', 150)
        ->where('metrics.pending_orders', 1)
        ->etc()
    );
});

test('deleting an order invalidates the cached metrics', function () {
    $order = Order::factory()->create();
    $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('metrics.total_orders_this_month', 1)->etc());

    $order->delete();

    $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('metrics.total_orders_this_month', 0)->etc());
});
