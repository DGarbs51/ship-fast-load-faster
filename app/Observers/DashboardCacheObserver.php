<?php

namespace App\Observers;

use App\Services\DashboardStats;

/**
 * Exercise 2.2: registered now; paste saved() and deleted() to enable invalidation.
 *
 * @see DashboardStats::flush()
 */
class DashboardCacheObserver
{
    public function saved(): void {}

    public function deleted(): void {}
}
