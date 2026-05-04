import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, ShoppingCart } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import type { PaginationLink } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    formatCurrency,
    formatDateTime,
    formatNumber,
    formatStatus,
} from '@/lib/formatters';
import { index as ordersIndex, show as orderShow } from '@/routes/orders';

type Order = {
    id: number;
    number: string;
    customer: string | null;
    item_count: number;
    total: number;
    status: string;
    created_at: string | null;
};

type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
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

export default function OrdersIndex({ orders }: { orders: Paginated<Order> }) {
    return (
        <>
            <Head title="Orders" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col gap-5 rounded-md bg-zinc-950 p-6 text-white ring-1 ring-zinc-950/10 sm:flex-row sm:items-center sm:justify-between md:p-8">
                    <div>
                        <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                            <ShoppingCart className="size-4" />
                            Fulfillment queue
                        </p>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
                            Orders
                        </h1>
                        <p className="mt-2 max-w-[58ch] text-base text-pretty text-zinc-400 sm:text-sm">
                            Customer orders, item counts, totals, and status.
                        </p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-md bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-200 ring-1 ring-white/10">
                        {formatNumber(orders.total)} orders
                    </div>
                </header>

                <Card className="overflow-hidden py-0">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead className="border-b border-zinc-950/10 bg-zinc-950 text-left text-zinc-300 dark:border-white/10">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">
                                            Order
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Placed
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.data.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={orderShow(
                                                            order.id,
                                                        )}
                                                        className="font-medium text-zinc-950 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
                                                    >
                                                        {order.number}
                                                    </Link>
                                                    <ArrowUpRight className="size-3 text-zinc-400" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                                {order.customer ?? 'Guest'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {formatNumber(order.item_count)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatCurrency(order.total)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={statusVariant(
                                                        order.status,
                                                    )}
                                                >
                                                    {formatStatus(order.status)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                                {formatDateTime(
                                                    order.created_at,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Showing {formatNumber(orders.from)}-
                        {formatNumber(orders.to)} of{' '}
                        {formatNumber(orders.total)}
                    </p>
                    <Pagination links={orders.links} />
                </div>
            </div>
        </>
    );
}

OrdersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Orders',
            href: ordersIndex(),
        },
    ],
};
