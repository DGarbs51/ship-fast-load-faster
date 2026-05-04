import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save, UserRound } from 'lucide-react';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    formatCurrency,
    formatDateTime,
    formatNumber,
    formatStatus,
} from '@/lib/formatters';
import { index as ordersIndex } from '@/routes/orders';
import { show as productShow } from '@/routes/products';

type Order = {
    id: number;
    number: string;
    status: string;
    total: number;
    created_at: string | null;
    customer: {
        id: number | null;
        name: string | null;
        email: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
    };
    items: {
        id: number;
        product_id: number | null;
        product: string | null;
        sku: string | null;
        quantity: number;
        unit_price: number;
        line_total: number;
    }[];
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

export default function OrderShow({
    order,
    statuses,
}: {
    order: Order;
    statuses: string[];
}) {
    return (
        <>
            <Head title={order.number} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="space-y-4 rounded-md bg-zinc-950 p-6 text-white ring-1 ring-zinc-950/10 md:p-8">
                    <Link
                        href={ordersIndex()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft className="size-4" />
                        Orders
                    </Link>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-300">
                                Order detail
                            </p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
                                {order.number}
                            </h1>
                            <p className="mt-2 text-base text-zinc-400 sm:text-sm">
                                Placed {formatDateTime(order.created_at)}
                            </p>
                        </div>
                        <Badge variant={statusVariant(order.status)}>
                            {formatStatus(order.status)}
                        </Badge>
                    </div>
                </header>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <Card>
                        <CardHeader className="border-b border-zinc-950/5 pb-4 dark:border-white/10">
                            <CardTitle>Line items</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-sm">
                                <thead className="border-b border-zinc-950/5 text-left text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                                    <tr>
                                        <th className="pb-3 font-medium">
                                            Product
                                        </th>
                                        <th className="pb-3 font-medium">
                                            SKU
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Qty
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Unit
                                        </th>
                                        <th className="pb-3 text-right font-medium">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-3 font-medium">
                                                {item.product_id ? (
                                                    <Link
                                                        href={productShow(
                                                            item.product_id,
                                                        )}
                                                        className="text-zinc-950 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
                                                    >
                                                        {item.product}
                                                    </Link>
                                                ) : (
                                                    (item.product ?? 'Product')
                                                )}
                                            </td>
                                            <td className="py-3 text-zinc-600 dark:text-zinc-400">
                                                {item.sku ?? 'Unknown'}
                                            </td>
                                            <td className="py-3 text-right">
                                                {formatNumber(item.quantity)}
                                            </td>
                                            <td className="py-3 text-right">
                                                {formatCurrency(
                                                    item.unit_price,
                                                )}
                                            </td>
                                            <td className="py-3 text-right font-medium">
                                                {formatCurrency(
                                                    item.line_total,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="border-b border-zinc-950/5 pb-4 dark:border-white/10">
                                <CardTitle>Order summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-zinc-600 dark:text-zinc-400">
                                        Items
                                    </span>
                                    <span className="font-medium">
                                        {formatNumber(order.items.length)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-zinc-600 dark:text-zinc-400">
                                        Total
                                    </span>
                                    <span className="text-lg font-semibold tabular-nums">
                                        {formatCurrency(order.total)}
                                    </span>
                                </div>
                                <Form
                                    action={OrderController.updateStatus.url(
                                        order.id,
                                    )}
                                    method="patch"
                                    options={{
                                        preserveScroll: true,
                                    }}
                                    className="grid gap-3"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <label
                                                htmlFor="status"
                                                className="text-sm font-medium"
                                            >
                                                Status
                                            </label>
                                            <select
                                                id="status"
                                                name="status"
                                                defaultValue={order.status}
                                                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-950 ring-1 ring-zinc-950/5 outline-hidden transition-[color,box-shadow,border-color] focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:ring-white/10"
                                            >
                                                {statuses.map((status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {formatStatus(status)}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.status && (
                                                <p className="text-sm text-red-600 dark:text-red-300">
                                                    {errors.status}
                                                </p>
                                            )}
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="w-fit"
                                            >
                                                <Save className="size-4" />
                                                Save status
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="border-b border-zinc-950/5 pb-4 dark:border-white/10">
                                <CardTitle>Customer</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <UserRound className="size-4 text-emerald-600 dark:text-emerald-300" />
                                    <span className="font-medium">
                                        {order.customer.name ?? 'Guest'}
                                    </span>
                                </div>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    {order.customer.email ?? 'No email'}
                                </p>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    {[
                                        order.customer.city,
                                        order.customer.state,
                                        order.customer.country,
                                    ]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

OrderShow.layout = {
    breadcrumbs: [
        {
            title: 'Orders',
            href: ordersIndex(),
        },
        {
            title: 'Order',
            href: ordersIndex(),
        },
    ],
};
