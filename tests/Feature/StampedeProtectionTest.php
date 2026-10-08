<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use App\Services\DashboardStats;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

test('expired metrics are served stale once, then refreshed in the background', function () {
    $this->withoutDefer();
    $order = Order::factory()->create(['status' => 'paid']);
    $stats = app(DashboardStats::class);

    expect($stats->metrics()['pending_orders'])->toBe(0);

    // Bypass the observer so only expiry (not invalidation) can refresh the value.
    DB::table('orders')->where('id', $order->id)->update(['status' => 'pending']);

    $this->travel(6)->minutes();

    expect($stats->metrics()['pending_orders'])->toBe(0)
        ->and($stats->metrics()['pending_orders'])->toBe(1);
});

test('a cold key is only rebuilt while holding the rebuild lock', function () {
    $lockHeldDuringRebuild = null;

    DB::listen(function (QueryExecuted $query) use (&$lockHeldDuringRebuild): void {
        if (! str_contains($query->sql, 'count(*) as order_count')) {
            return;
        }

        $key = 'dashboard:v'.Cache::get(DashboardStats::VERSION_KEY, 'initial').':metrics:rebuild';
        $probe = Cache::lock($key, 1);
        $lockHeldDuringRebuild = ! $probe->get();

        if (! $lockHeldDuringRebuild) {
            $probe->release();
        }
    });

    app(DashboardStats::class)->metrics();

    expect($lockHeldDuringRebuild)->toBeTrue();
});

test('a request waiting on the lock reuses the value the lock holder stored', function () {
    $key = 'dashboard:vinitial:metrics';
    Cache::lock("{$key}:rebuild", 30)->get(function () use ($key): void {
        Cache::flexible($key, [300, 900], fn (): array => ['pending_orders' => 42]);
    });

    DB::flushQueryLog();
    DB::enableQueryLog();

    expect(app(DashboardStats::class)->metrics()['pending_orders'])->toBe(42)
        ->and(collect(DB::getQueryLog())->pluck('query')->filter(fn (string $sql) => str_contains($sql, '"orders"')))->toBeEmpty();
});

test('customer export streams every customer with aggregates', function () {
    $this->actingAs(User::factory()->create());
    $customer = Customer::factory()->create(['name' => 'Ada Lovelace']);
    Order::factory()->for($customer)->count(2)->create(['total' => 25]);
    Customer::factory()->create();

    $csv = $this->get('/customers/export')->assertOk()->streamedContent();

    expect(str_getcsv(explode("\n", trim($csv))[1]))->toMatchArray([0 => 'Ada Lovelace', 3 => '2', 4 => '50'])
        ->and(substr_count(trim($csv), "\n"))->toBe(2);
});
