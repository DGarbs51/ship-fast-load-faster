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
     * is one cheap insert into the jobs table; the slow work runs in `queue:listen`.
     */
    public static function dispatchIfStale(): void
    {
        $refreshedAt = Cache::get(self::CACHE_KEY)['refreshed_at'] ?? null;

        if ($refreshedAt === null || Date::parse($refreshedAt)->lt(now()->subMinutes(self::STALE_AFTER_MINUTES))) {
            self::dispatch();
        }
    }

    /**
     * Exercise 2.3: paste handle() here. The dashboard stays synchronous until checkpoint 04.
     *
     * @see OrderItem
     */
    public function handle(): void {}
}
