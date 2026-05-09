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
                <header className="rounded-md border border-border bg-card p-6 text-card-foreground md:p-8">
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        <Package className="size-4" />
                        Commerce operations
                    </p>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
                        Store dashboard
                    </h1>
                    <p className="mt-2 max-w-[62ch] text-base text-pretty text-muted-foreground sm:text-sm">
                        Orders, revenue, catalog health, and customer activity.
                    </p>
                </header>

                <div className="@container">
                    <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
                        {metricCards.map((metric) => (
                            <Card key={metric.label}>
                                <CardContent>
                                    <p className="truncate text-base text-muted-foreground sm:text-sm">
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

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)] xl:max-h-[36rem]">
                    <Card className="min-h-0">
                        <CardHeader className="shrink-0 border-b border-border pb-4">
                            <CardTitle>Top products by revenue</CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 overflow-x-auto overflow-y-scroll">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead className="border-b border-border text-left text-muted-foreground">
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
                                                        className="text-foreground hover:text-emerald-700 dark:hover:text-emerald-300"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                ) : (
                                                    product.name
                                                )}
                                            </td>
                                            <td className="py-3 text-muted-foreground">
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

                    <Card className="min-h-0">
                        <CardHeader className="shrink-0 border-b border-border pb-4">
                            <CardTitle>Recent orders</CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-scroll">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <Link
                                            href={orderShow(order.id)}
                                            className="font-medium text-foreground hover:text-emerald-700 dark:hover:text-emerald-300"
                                        >
                                            {order.number}
                                        </Link>
                                        <p className="truncate text-base text-muted-foreground sm:text-sm">
                                            {order.customer ?? 'Guest'} -{' '}
                                            {formatDateTime(order.created_at)}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
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

                <div className="grid gap-4 lg:grid-cols-2 lg:max-h-[32rem]">
                    <Card className="min-h-0">
                        <CardHeader className="shrink-0 border-b border-border pb-4">
                            <CardTitle>Catalog inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-scroll">
                            {categoryInventory.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <Boxes className="size-4 text-emerald-700 dark:text-emerald-300" />
                                        <span className="text-sm font-medium">
                                            {category.name}
                                        </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground tabular-nums">
                                        {formatNumber(category.stock_count)} in
                                        stock
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="min-h-0">
                        <CardHeader className="shrink-0 border-b border-border pb-4">
                            <CardTitle>Category tree</CardTitle>
                        </CardHeader>
                        <CardContent className="grid min-h-0 flex-1 gap-3 overflow-y-scroll sm:grid-cols-2">
                            {categoryTree.map((category) => (
                                <div
                                    key={category.id}
                                    className="rounded-md border border-border bg-muted p-3"
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
                                                    className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
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
                        className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-emerald-400 dark:text-zinc-950 dark:hover:bg-emerald-300"
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
