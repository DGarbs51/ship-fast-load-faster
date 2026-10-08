<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Closure;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DashboardStats
{
    /**
     * Replacing this token orphans every dashboard key at once. The database
     * cache store has no tags, so a versioned key prefix does the same job.
     * A fresh random token (not a counter) means a flush is one atomic write.
     */
    public const string VERSION_KEY = 'dashboard:version';

    private const int TTL_SECONDS = 600;

    public static function flush(): void
    {
        Cache::forever(self::VERSION_KEY, Str::ulid()->toString());
    }

    /**
     * @return array{total_revenue_this_month: float, total_orders_this_month: int, pending_orders: int, average_order_value: float|int, low_stock_products: int, new_customers_this_month: int}
     */
    public function metrics(): array
    {
        return $this->remember('metrics', function (): array {
            $monthStart = now()->startOfMonth();
            $monthEnd = now()->endOfMonth();

            $monthTotals = Order::whereBetween('created_at', [$monthStart, $monthEnd])
                ->toBase()
                ->selectRaw('count(*) as order_count, coalesce(sum(total), 0) as revenue')
                ->first();

            $orderCount = (int) $monthTotals->order_count;
            $revenue = (float) $monthTotals->revenue;

            return [
                'total_revenue_this_month' => $revenue,
                'total_orders_this_month' => $orderCount,
                'pending_orders' => Order::where('status', 'pending')->count(),
                'average_order_value' => $orderCount > 0 ? $revenue / $orderCount : 0,
                'low_stock_products' => Product::where('stock_count', '<=', 10)->count(),
                'new_customers_this_month' => Customer::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
            ];
        });
    }

    /**
     * @return list<array{id: int|null, name: string, category: string|null, revenue: float, units_sold: int, average_rating: float}>
     */
    public function topProducts(): array
    {
        return $this->remember('top-products', function (): array {
            $monthOrderIds = Order::whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->select('id');

            $productTotals = OrderItem::query()
                ->toBase()
                ->select('product_id')
                ->selectRaw('sum(line_total) as revenue, sum(quantity) as units_sold')
                ->whereIn('order_id', $monthOrderIds)
                ->groupBy('product_id')
                ->orderByDesc('revenue')
                ->limit(10)
                ->get();

            $products = Product::with('category:id,name')
                ->withAvg('reviews', 'rating')
                ->findMany($productTotals->pluck('product_id'))
                ->keyBy('id');

            return $productTotals
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
                ->values()
                ->all();
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function recentOrders(): array
    {
        return $this->remember('recent-orders', fn (): array => Order::with(['customer:id,name', 'items:id,order_id,product_id,quantity', 'items.product:id,name'])
            ->latest()
            ->take(20)
            ->get()
            ->map(fn (Order $order): array => [
                'id' => $order->id,
                'number' => $order->number,
                'customer' => $order->customer?->name,
                'status' => $order->status,
                'total' => (float) $order->total,
                'created_at' => $order->created_at?->toISOString(),
                'items' => $order->items->map(fn (OrderItem $item): array => [
                    'product' => $item->product?->name,
                    'quantity' => $item->quantity,
                ])->values()->all(),
            ])
            ->all());
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function categoryTree(): array
    {
        return $this->remember('category-tree', fn (): array => Category::whereNull('parent_id')
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
                ])->values()->all(),
            ])
            ->all());
    }

    /**
     * @return list<array{id: int, name: string, stock_count: int}>
     */
    public function categoryInventory(): array
    {
        return $this->remember('category-inventory', fn (): array => Category::withSum('products', 'stock_count')
            ->orderByDesc('products_sum_stock_count')
            ->take(8)
            ->get()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'stock_count' => (int) $category->products_sum_stock_count,
            ])
            ->all());
    }

    /**
     * @template TValue
     *
     * @param  Closure(): TValue  $callback
     * @return TValue
     */
    private function remember(string $key, Closure $callback): mixed
    {
        $version = Cache::get(self::VERSION_KEY, 'initial');

        return Cache::remember("dashboard:v{$version}:{$key}", self::TTL_SECONDS, $callback);
    }
}
