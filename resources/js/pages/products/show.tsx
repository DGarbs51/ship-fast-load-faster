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
                <header className="space-y-4 rounded-md border border-border bg-card p-6 text-card-foreground md:p-8">
                    <Link
                        href={productsIndex()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Products
                    </Link>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                Product signal
                            </p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
                                {product.name}
                            </h1>
                            <p className="mt-2 max-w-3xl text-base text-pretty text-muted-foreground sm:text-sm">
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
                        <CardContent>
                            <p className="truncate text-base text-muted-foreground sm:text-sm">
                                Price
                            </p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums">
                                {formatCurrency(product.price)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <p className="truncate text-base text-muted-foreground sm:text-sm">
                                Units sold
                            </p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums">
                                {formatNumber(product.units_sold)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <p className="truncate text-base text-muted-foreground sm:text-sm">
                                Revenue
                            </p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums">
                                {formatCurrency(product.revenue)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <p className="truncate text-base text-muted-foreground sm:text-sm">
                                Rating
                            </p>
                            <p className="mt-2 text-3xl font-semibold tabular-nums">
                                {product.average_rating.toFixed(1)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,2.6fr)_minmax(260px,1fr)]">
                    <Card>
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle>Recent orders</CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-[28rem] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 border-b border-border bg-card text-left text-muted-foreground">
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
                                                        className="text-foreground hover:text-emerald-700 dark:hover:text-emerald-300"
                                                    >
                                                        {order.number}
                                                    </Link>
                                                ) : (
                                                    order.number
                                                )}
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDateTime(
                                                        order.created_at,
                                                    )}
                                                </p>
                                            </td>
                                            <td className="py-3 text-muted-foreground">
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
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle>Product details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    SKU
                                </span>
                                <span className="font-medium">
                                    {product.sku}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Category
                                </span>
                                <span className="font-medium">
                                    {product.category ?? 'None'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Stock
                                </span>
                                <span className="font-medium">
                                    {formatNumber(product.stock_count)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Reviews
                                </span>
                                <span className="font-medium">
                                    {formatNumber(product.review_count)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                    <ShoppingCart className="size-4 text-emerald-700 dark:text-emerald-300" />
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
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle>Reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[32rem] space-y-5 overflow-y-auto">
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
                                        <p className="text-base text-muted-foreground sm:text-sm">
                                            {review.customer ?? 'Customer'} -{' '}
                                            {formatDateTime(review.created_at)}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-sm font-medium">
                                        <Star className="size-4 fill-current text-amber-400" />
                                        {review.rating}
                                    </span>
                                </div>
                                <p className="mt-3 text-base text-pretty text-foreground sm:text-sm">
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
