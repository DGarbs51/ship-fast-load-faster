<?php

namespace App\Observers;

use App\Services\DashboardStats;

/**
 * Any write to a model the dashboard aggregates invalidates every dashboard key.
 * Note: query-builder mass updates (`Order::where(...)->update()`) skip observers.
 */
class DashboardCacheObserver
{
    public function saved(): void
    {
        DashboardStats::flush();
    }

    public function deleted(): void
    {
        DashboardStats::flush();
    }
}
