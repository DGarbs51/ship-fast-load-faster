import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Boxes, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    formatCurrency,
    formatDateTime,
    formatNumber,
    formatStatus,
} from '@/lib/formatters';
import { dashboard } from '@/routes';
import { show as orderShow } from '@/routes/orders';
import { show as productShow } from '@/routes/products';

type Metrics = {
    total_revenue_this_month: number;
    total_orders_this_month: number;
    pending_orders: number;
    average_order_value: number;
    low_stock_products: number;
    new_customers_this_month: number;
};

type TopProduct = {
    id: number | null;
    name: string;
    category: string | null;
    revenue: number;
    units_sold: number;
    average_rating: number;
};

type RecentOrder = {
    id: number;
    number: string;
    customer: string | null;
    status: string;
    total: number;
    created_at: string | null;
    items: {
        product: string | null;
        quantity: number;
    }[];
};

type CategoryTree = {
    id: number;
    name: string;
    product_count: number;
    children: {
        id: number;
        name: string;
        product_count: number;
    }[];
};

type CategoryInventory = {
    id: number;
    name: string;
    stock_count: number;
};

function statusVariant(status: string) {
    if (status === 'pending') {
        return 'secondary';
    }

    if (status === 'cancelled') {
        return 'destructive';
    }

    return 'outline';
}

export default function Dashboard({
    metrics,
    topProducts,
    recentOrders,
    categoryTree,
    categoryInventory,
}: {
    metrics: Metrics;
    topProducts: TopProduct[];
    recentOrders: RecentOrder[];
    categoryTree: CategoryTree[];
    categoryInventory: CategoryInventory[];
}) {
    const metricCards = [
        {
            label: 'Revenue this month',
            value: formatCurrency(metrics.total_revenue_this_month),
        },
        {
            label: 'Orders this month',
            value: formatNumber(metrics.total_orders_this_month),
        },
        {
            label: 'Pending orders',
            value: formatNumber(metrics.pending_orders),
        },
        {
            label: 'Average order value',
            value: formatCurrency(metrics.average_order_value),
        },
        {
            label: 'Low-stock products',
            value: formatNumber(metrics.low_stock_products),
        },
        {
            label: 'New customers this month',
            value: formatNumber(metrics.new_customers_this_month),
        },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="rounded-md bg-zinc-950 p-6 text-white ring-1 ring-zinc-950/10 md:p-8">
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                        <Package className="size-4" />
                        Commerce operations
                    </p>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
                        Store dashboard
                    </h1>
                    <p className="mt-2 max-w-[62ch] text-base text-pretty text-zinc-400 sm:text-sm">
                        Orders, revenue, catalog health, and customer activity.
                    </p>
                </header>

                <div className="@container">
                    <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
                        {metricCards.map((metric) => (
                            <Card key={metric.label}>
                                <CardContent className="pt-6">
                                    <p className="truncate text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                                        {metric.label}
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold tabular-nums">
                                        {metric.value}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
                    <Card>
                        <CardHeader className="border-b border-zinc-950/5 pb-4 dark:border-white/10">
                            <CardTitle>Top products by revenue</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead className="border-b border-zinc-950/5 text-left text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                                    <tr>
                                        <th className="pb-3 font-medium">
                                            Product
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Category
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Units
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Rating
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Revenue
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((product) => (
                                        <tr
                                            key={`${product.id}-${product.name}`}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-3 font-medium">
                                                {product.id ? (
                                                    <Link
                                                        href={productShow(
                                                            product.id,
                                                        )}
                                                        className="text-zinc-950 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                ) : (
                                                    product.name
                                                )}
                                            </td>
                                            <td className="py-3 text-zinc-600 dark:text-zinc-400">
                                                {product.category ?? 'None'}
                                            </td>
                                            <td className="py-3 text-right">
                                                {formatNumber(
                                                    product.units_sold,
                                                )}
                                            </td>
                                            <td className="py-3 text-right">
                                                {product.average_rating.toFixed(
                                                    1,
                                                )}
                                            </td>
                                            <td className="py-3 text-right font-medium">
                                                {formatCurrency(
                                                    product.revenue,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-zinc-950/5 pb-4 dark:border-white/10">
                            <CardTitle>Recent orders</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <Link
                                            href={orderShow(order.id)}
                                            className="font-medium text-zinc-950 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
                                        >
                                            {order.number}
                                        </Link>
                                        <p className="truncate text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                                            {order.customer ?? 'Guest'} -{' '}
                                            {formatDateTime(order.created_at)}
                                        </p>
                                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                                            {order.items
                                                .slice(0, 2)
                                                .map(
                                                    (item) =>
                                                        `${item.quantity}x ${item.product ?? 'Product'}`,
                                                )
                                                .join(', ')}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <Badge
                                            variant={statusVariant(
                                                order.status,
                                            )}
                                        >
                                            {formatStatus(order.status)}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                            {formatCurrency(order.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="border-b border-zinc-950/5 pb-4 dark:border-white/10">
                            <CardTitle>Catalog inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {categoryInventory.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <Boxes className="size-4 text-emerald-600 dark:text-emerald-300" />
                                        <span className="text-sm font-medium">
                                            {category.name}
                                        </span>
                                    </div>
                                    <span className="text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
                                        {formatNumber(category.stock_count)} in
                                        stock
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-zinc-950/5 pb-4 dark:border-white/10">
                            <CardTitle>Category tree</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            {categoryTree.map((category) => (
                                <div
                                    key={category.id}
                                    className="rounded-md bg-zinc-50 p-3 ring-1 ring-zinc-950/5 dark:bg-white/[0.04] dark:ring-white/10"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium">
                                            {category.name}
                                        </span>
                                        <Badge variant="secondary">
                                            <Package className="size-3" />
                                            {formatNumber(
                                                category.product_count,
                                            )}
                                        </Badge>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {category.children
                                            .slice(0, 4)
                                            .map((child) => (
                                                <div
                                                    key={child.id}
                                                    className="flex items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                                                >
                                                    <span>{child.name}</span>
                                                    <span>
                                                        {formatNumber(
                                                            child.product_count,
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {topProducts[0]?.id && (
                    <Link
                        href={productShow(topProducts[0].id)}
                        className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                    >
                        Review leading product
                        <ArrowRight className="size-4" />
                    </Link>
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
