<?php

use App\Jobs\RefreshAnalyticsRollup;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Notifications\OrderConfirmation;
use Illuminate\Bus\UniqueLock;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

test('the dashboard no longer runs the analytics rollup inline', function () {
    Queue::fake();
    $this->actingAs(User::factory()->create());

    $startedAt = microtime(true);
    $this->get('/dashboard')->assertOk();

    expect(microtime(true) - $startedAt)->toBeLessThan(0.8);
});

test('the analytics rollup job stores revenue per product', function () {
    $item = OrderItem::factory()->create(['line_total' => 40]);
    OrderItem::factory()->for($item->product)->create(['line_total' => 60]);

    (new RefreshAnalyticsRollup)->handle();

    expect(Cache::get(RefreshAnalyticsRollup::CACHE_KEY)['revenue_by_product'])
        ->toBe([$item->product_id => 100.0]);
});

test('the dashboard queues a rollup refresh only when the rollup is missing or stale', function () {
    Queue::fake();
    $this->actingAs(User::factory()->create());

    $this->get('/dashboard')->assertOk();
    Queue::assertPushedTimes(RefreshAnalyticsRollup::class, 1);

    Cache::forever(RefreshAnalyticsRollup::CACHE_KEY, ['refreshed_at' => now()->toISOString(), 'revenue_by_product' => []]);
    $this->get('/dashboard')->assertOk();
    Queue::assertPushedTimes(RefreshAnalyticsRollup::class, 1);

    // A worker finishing the first job releases its unique lock.
    (new UniqueLock(Cache::driver()))->release(new RefreshAnalyticsRollup);
    $this->travel(6)->minutes();
    $this->get('/dashboard')->assertOk();
    Queue::assertPushedTimes(RefreshAnalyticsRollup::class, 2);
});

test('a stale rollup is queued only once while the worker is behind', function () {
    Queue::fake();
    $this->actingAs(User::factory()->create());

    $this->get('/dashboard')->assertOk();
    $this->get('/dashboard')->assertOk();

    Queue::assertPushedTimes(RefreshAnalyticsRollup::class, 1);
});

test('marking an order paid queues the confirmation instead of sending inline', function () {
    Notification::fake();
    $this->actingAs(User::factory()->create());
    $order = Order::factory()->create(['status' => 'pending']);

    $this->patch("/orders/{$order->id}/status", ['status' => 'paid'])->assertRedirect();

    Notification::assertSentTo($order->customer, OrderConfirmation::class, fn (OrderConfirmation $notification) => $notification->orderNumber === $order->number && $notification->status === 'paid');
    expect(OrderConfirmation::class)->toImplement(ShouldQueue::class);
});

test('the confirmation keeps the status it was sent for after the order moves on', function () {
    $order = Order::factory()->create(['status' => 'paid']);
    $notification = unserialize(serialize(new OrderConfirmation($order)));

    $order->update(['status' => 'shipped']);

    expect($notification->toMail($order->customer)->subject)->toBe("Order {$order->number} is paid");
});

test('cancelling an order does not send a confirmation', function () {
    Notification::fake();
    $this->actingAs(User::factory()->create());
    $order = Order::factory()->create(['status' => 'pending']);

    $this->patch("/orders/{$order->id}/status", ['status' => 'cancelled'])->assertRedirect();

    Notification::assertNothingSent();
});

test('the stampede demo reports how many workers rebuilt the cache', function () {
    config(['concurrency.default' => 'sync']);
    OrderItem::factory()->create();

    $this->artisan('workshop:stampede', ['--workers' => 2])
        ->expectsOutputToContain('1 of 2 workers ran the expensive query.')
        ->assertSuccessful();
});
