<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        $this->refreshAnalyticsRollup();

        $monthOrders = Order::whereBetween('created_at', [$monthStart, $monthEnd]);

        $monthTotals = $monthOrders->clone()
            ->toBase()
            ->selectRaw('count(*) as order_count, coalesce(sum(total), 0) as revenue')
            ->first();

        $productTotals = OrderItem::query()
            ->toBase()
            ->select('product_id')
            ->selectRaw('sum(line_total) as revenue, sum(quantity) as units_sold')
            ->whereIn('order_id', $monthOrders->clone()->select('id'))
            ->groupBy('product_id')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        $products = Product::with('category:id,name')
            ->withAvg('reviews', 'rating')
            ->findMany($productTotals->pluck('product_id'))
            ->keyBy('id');

        $topProducts = $productTotals
            ->map(function (object $totals) use ($products): array {
                $product = $products->get($totals->product_id);

                return [
                    'id' => $product?->id,
                    'name' => $product?->name ?? 'Unknown product',
                    'category' => $product?->category?->name,
                    'revenue' => (float) $totals->revenue,
                    'units_sold' => (int) $totals->units_sold,
                    'average_rating' => round((float) $product?->reviews_avg_rating, 1),
                ];
            })
            ->values();

        $recentOrders = Order::with(['customer:id,name', 'items:id,order_id,product_id,quantity', 'items.product:id,name'])
            ->latest()
            ->take(20)
            ->get()
            ->map(function (Order $order): array {
                return [
                    'id' => $order->id,
                    'number' => $order->number,
                    'customer' => $order->customer?->name,
                    'status' => $order->status,
                    'total' => (float) $order->total,
                    'created_at' => $order->created_at?->toISOString(),
                    'items' => $order->items->map(fn (OrderItem $item): array => [
                        'product' => $item->product?->name,
                        'quantity' => $item->quantity,
                    ])->values(),
                ];
            });

        $categoryTree = Category::whereNull('parent_id')
            ->withCount('products')
            ->with(['children' => fn (HasMany $query) => $query->withCount('products')])
            ->get()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'product_count' => $category->products_count,
                'children' => $category->children->map(fn (Category $child): array => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'product_count' => $child->products_count,
                ])->values(),
            ])
            ->values();

        $categoryInventory = Category::withSum('products', 'stock_count')
            ->orderByDesc('products_sum_stock_count')
            ->take(8)
            ->get()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'stock_count' => (int) $category->products_sum_stock_count,
            ]);

        $orderCount = (int) $monthTotals->order_count;
        $revenue = (float) $monthTotals->revenue;

        return Inertia::render('dashboard', [
            'metrics' => [
                'total_revenue_this_month' => $revenue,
                'total_orders_this_month' => $orderCount,
                'pending_orders' => Order::where('status', 'pending')->count(),
                'average_order_value' => $orderCount > 0 ? $revenue / $orderCount : 0,
                'low_stock_products' => Product::where('stock_count', '<=', 10)->count(),
                'new_customers_this_month' => Customer::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
            ],
            'topProducts' => $topProducts,
            'recentOrders' => $recentOrders,
            'categoryTree' => $categoryTree,
            'categoryInventory' => $categoryInventory,
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
