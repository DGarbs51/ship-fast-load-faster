<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Services\DashboardStats;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(DashboardStats $stats): Response
    {
        $this->refreshAnalyticsRollup();

        return Inertia::render('dashboard', [
            'metrics' => $stats->metrics(),
            'topProducts' => $stats->topProducts(),
            'recentOrders' => $stats->recentOrders(),
            'categoryTree' => $stats->categoryTree(),
            'categoryInventory' => $stats->categoryInventory(),
        ]);
    }

    private function refreshAnalyticsRollup(): void
    {
        OrderItem::latest()
            ->take(5000)
            ->get()
            ->groupBy('product_id')
            ->map(fn (Collection $items): float => (float) $items->sum('line_total'));

        usleep(random_int(800000, 1200000));
    }
}
