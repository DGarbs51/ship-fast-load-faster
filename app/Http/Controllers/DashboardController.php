<?php

namespace App\Http\Controllers;

use App\Jobs\RefreshAnalyticsRollup;
use App\Services\DashboardStats;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(DashboardStats $stats): Response
    {
        RefreshAnalyticsRollup::dispatchIfStale();

        return Inertia::render('dashboard', [
            'metrics' => $stats->metrics(),
            'topProducts' => $stats->topProducts(),
            'recentOrders' => $stats->recentOrders(),
            'categoryTree' => $stats->categoryTree(),
            'categoryInventory' => $stats->categoryInventory(),
        ]);
    }
}
