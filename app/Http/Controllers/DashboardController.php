<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
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

        $ordersForRevenue = Order::whereBetween('created_at', [$monthStart, $monthEnd])->get();
        $ordersForAverage = Order::whereBetween('created_at', [$monthStart, $monthEnd])->get();
        $ordersForCount = Order::whereBetween('created_at', [$monthStart, $monthEnd])->get();

        $monthOrderIds = Order::whereBetween('created_at', [$monthStart, $monthEnd])->get()->pluck('id');
        $monthlyOrderItems = OrderItem::whereIn('order_id', $monthOrderIds)->get();

        $topProducts = $monthlyOrderItems
            ->groupBy('product_id')
            ->map(fn (Collection $items): array => [
                'revenue' => (float) $items->sum(fn (OrderItem $item): float => (float) $item->line_total),
                'units_sold' => (int) $items->sum('quantity'),
            ])
            ->sortByDesc('revenue')
            ->take(10)
            ->map(function (array $totals, int|string $productId): array {
                $product = Product::find($productId);

                return [
                    'id' => $product?->id,
                    'name' => $product?->name ?? 'Unknown product',
                    'category' => $product?->category?->name,
                    'revenue' => $totals['revenue'],
                    'units_sold' => $totals['units_sold'],
                    'average_rating' => $product ? round((float) $product->reviews->avg('rating'), 1) : 0,
                ];
            })
            ->values();

        $recentOrders = Order::latest()
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
            ->get()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'product_count' => $category->products->count(),
                'children' => $category->children->map(fn (Category $child): array => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'product_count' => $child->products->count(),
                ])->values(),
            ])
            ->values();

        $categoryInventory = Category::all()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'stock_count' => (int) $category->products->sum('stock_count'),
            ])
            ->sortByDesc('stock_count')
            ->take(8)
            ->values();

        return Inertia::render('dashboard', [
            'metrics' => [
                'total_revenue_this_month' => (float) $ordersForRevenue->sum(fn (Order $order): float => (float) $order->total),
                'total_orders_this_month' => $ordersForCount->count(),
                'pending_orders' => Order::where('status', 'pending')->get()->count(),
                'average_order_value' => $ordersForAverage->count() > 0
                    ? (float) $ordersForAverage->sum(fn (Order $order): float => (float) $order->total) / $ordersForAverage->count()
                    : 0,
                'low_stock_products' => Product::all()->filter(fn (Product $product): bool => $product->stock_count <= 10)->count(),
                'new_customers_this_month' => Customer::whereBetween('created_at', [$monthStart, $monthEnd])->get()->count(),
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
