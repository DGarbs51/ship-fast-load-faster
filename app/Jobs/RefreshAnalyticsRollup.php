<?php

namespace App\Jobs;

use App\Models\OrderItem;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Date;

/**
 * Rebuilds the product revenue rollup off the request thread.
 * ShouldBeUnique keeps a burst of dispatches from piling up duplicate jobs.
 */
class RefreshAnalyticsRollup implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public const string CACHE_KEY = 'analytics:product-revenue';

    private const int STALE_AFTER_MINUTES = 5;

    /**
     * Queue a refresh when the rollup is missing or older than five minutes. Dispatching
     * is one cheap insert into the jobs table; the slow work runs in `queue:work`.
     */
    public static function dispatchIfStale(): void
    {
        $refreshedAt = Cache::get(self::CACHE_KEY)['refreshed_at'] ?? null;

        if ($refreshedAt === null || Date::parse($refreshedAt)->lt(now()->subMinutes(self::STALE_AFTER_MINUTES))) {
            self::dispatch();
        }
    }

    public function handle(): void
    {
        $revenueByProduct = OrderItem::query()
            ->toBase()
            ->select('product_id')
            ->selectRaw('sum(line_total) as revenue')
            ->whereIn('id', OrderItem::query()->select('id')->latest()->limit(5000))
            ->groupBy('product_id')
            ->pluck('revenue', 'product_id')
            ->map(fn (mixed $revenue): float => (float) $revenue)
            ->all();

        // ponytail: stands in for a slow third-party analytics call; delete once a real one exists.
        usleep(random_int(800000, 1200000));

        Cache::forever(self::CACHE_KEY, [
            'refreshed_at' => now()->toISOString(),
            'revenue_by_product' => $revenueByProduct,
        ]);
    }
}
