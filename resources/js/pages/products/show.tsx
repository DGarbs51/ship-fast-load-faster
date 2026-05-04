import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShoppingCart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    formatCurrency,
    formatDateTime,
    formatNumber,
    formatStatus,
} from '@/lib/formatters';
import { show as orderShow } from '@/routes/orders';
import { index as productsIndex } from '@/routes/products';

type Product = {
    id: number;
    name: string;
    sku: string;
    description: string;
    price: number;
    stock_count: number;
    active: boolean;
    category: string | null;
    units_sold: number;
    revenue: number;
    average_rating: number;
    review_count: number;
};

type RecentOrder = {
    id: number | null;
    number: string | null;
    customer: string | null;
    status: string | null;
    quantity: number;
    line_total: number;
    created_at: string | null;
};

type Review = {
    id: number;
    rating: number;
    title: string;
    body: string;
    customer: string | null;
    created_at: string | null;
};

function statusVariant(status: string | null) {
    if (status === 'pending') {
        return 'secondary';
    }

    if (status === 'cancelled') {
        return 'destructive';
    }

    return 'outline';
}

export default function ProductShow({
    product,
    recentOrders,
    reviews,
}: {
    product: Product;
    recentOrders: RecentOrder[];
    reviews: Review[];
}) {
    return (
        <>
            <Head title={product.name} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="space-y-4 rounded-md bg-zinc-950 p-6 text-white ring-1 ring-zinc-950/10 md:p-8">
                    <Link
                        href={productsIndex()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft className="size-4" />
                        Products
                    </Link>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-300">
                                Product signal
                            </p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
                                {product.name}
                            </h1>
                            <p className="mt-2 max-w-3xl text-base text-pretty text-zinc-400 sm:text-sm">
                                {product.description}
                            </p>
                        </div>
                        <Badge
                            variant={product.active ? 'outline' : 'secondary'}
                        >
                            {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="truncate text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                                Price
                            </p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums">
                                {formatCurrency(product.price)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="truncate text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                                Units sold
                            </p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums">
                                {formatNumber(product.units_sold)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="truncate text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                                Revenue
                            </p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums">
                                {formatCurrency(product.revenue)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="truncate text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                                Rating
                            </p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums">
                                {product.average_rating.toFixed(1)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
                    <Card>
                        <CardHeader className="border-b border-zinc-950/5 pb-4 dark:border-white/10">
                            <CardTitle>Recent orders</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-sm">
                                <thead className="border-b border-zinc-950/5 text-left text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                                    <tr>
                                        <th className="pb-3 font-medium">
                                            Order
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Customer
                                        </th>
                                        <th className="pb-3 font-medium">
                                            Status
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Qty
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order, index) => (
                                        <tr
                                            key={`${order.id}-${index}`}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-3 font-medium">
                                                {order.id ? (
                                                    <Link
                                                        href={orderShow(
                                                            order.id,
                                                        )}
                                                        className="text-zinc-950 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
                                                    >
                                                        {order.number}
                                                    </Link>
                                                ) : (
                                                    order.number
                                                )}
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                    {formatDateTime(
                                                        order.created_at,
                                                    )}
                                                </p>
                                            </td>
                                            <td className="py-3 text-zinc-600 dark:text-zinc-400">
                                                {order.customer ?? 'Guest'}
                                            </td>
                                            <td className="py-3">
                                                <Badge
                                                    variant={statusVariant(
                                                        order.status,
                                                    )}
                                                >
                                                    {order.status
                                                        ? formatStatus(
                                                              order.status,
                                                          )
                                                        : 'Unknown'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-right">
                                                {formatNumber(order.quantity)}
                                            </td>
                                            <td className="py-3 text-right font-medium">
                                                {formatCurrency(
                                                    order.line_total,
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
                            <CardTitle>Product details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    SKU
                                </span>
                                <span className="font-medium">
                                    {product.sku}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    Category
                                </span>
                                <span className="font-medium">
                                    {product.category ?? 'None'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    Stock
                                </span>
                                <span className="font-medium">
                                    {formatNumber(product.stock_count)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    Reviews
                                </span>
                                <span className="font-medium">
                                    {formatNumber(product.review_count)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <ShoppingCart className="size-4 text-emerald-600 dark:text-emerald-300" />
                                    Sales
                                </span>
                                <span className="font-medium">
                                    {formatCurrency(product.revenue)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="border-b border-zinc-950/5 pb-4 dark:border-white/10">
                        <CardTitle>Reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {reviews.map((review) => (
                            <article
                                key={review.id}
                                className="border-b pb-5 last:border-0 last:pb-0"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h2 className="font-medium">
                                            {review.title}
                                        </h2>
                                        <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                                            {review.customer ?? 'Customer'} -{' '}
                                            {formatDateTime(review.created_at)}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-sm font-medium">
                                        <Star className="size-4 fill-current text-amber-400" />
                                        {review.rating}
                                    </span>
                                </div>
                                <p className="mt-3 text-base text-pretty text-zinc-700 sm:text-sm dark:text-zinc-300">
                                    {review.body}
                                </p>
                            </article>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ProductShow.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: productsIndex(),
        },
        {
            title: 'Product',
            href: productsIndex(),
        },
    ],
};
