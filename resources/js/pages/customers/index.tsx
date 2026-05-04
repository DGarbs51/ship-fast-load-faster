import { Head } from '@inertiajs/react';
import { Download, UsersRound } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import type { PaginationLink } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters';
import {
    exportMethod as customersExport,
    index as customersIndex,
} from '@/routes/customers';

type Customer = {
    id: number;
    name: string;
    email: string;
    city: string;
    state: string | null;
    country: string;
    order_count: number;
    total_spend: number;
    created_at: string | null;
};

type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export default function CustomersIndex({
    customers,
}: {
    customers: Paginated<Customer>;
}) {
    return (
        <>
            <Head title="Customers" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col gap-5 rounded-md bg-zinc-950 p-6 text-white ring-1 ring-zinc-950/10 sm:flex-row sm:items-center sm:justify-between md:p-8">
                    <div>
                        <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                            <UsersRound className="size-4" />
                            Customer momentum
                        </p>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
                            Customers
                        </h1>
                        <p className="mt-2 max-w-[58ch] text-base text-pretty text-zinc-400 sm:text-sm">
                            Lifetime order counts, spend, and location.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex w-fit items-center gap-2 rounded-md bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-200 ring-1 ring-white/10">
                            {formatNumber(customers.total)} customers
                        </div>
                        <Button asChild variant="outline">
                            <a
                                href={customersExport.url()}
                                className="border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white"
                            >
                                <Download className="size-4" />
                                Export
                            </a>
                        </Button>
                    </div>
                </header>

                <Card className="overflow-hidden py-0">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-sm">
                                <thead className="border-b border-zinc-950/10 bg-zinc-950 text-left text-zinc-300 dark:border-white/10">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Location
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Orders
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Total spend
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Joined
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.data.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium">
                                                    {customer.name}
                                                </p>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                    {customer.email}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                                {[
                                                    customer.city,
                                                    customer.state,
                                                    customer.country,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {formatNumber(
                                                    customer.order_count,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatCurrency(
                                                    customer.total_spend,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                                {formatDate(
                                                    customer.created_at,
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
                        Showing {formatNumber(customers.from)}-
                        {formatNumber(customers.to)} of{' '}
                        {formatNumber(customers.total)}
                    </p>
                    <Pagination links={customers.links} />
                </div>
            </div>
        </>
    );
}

CustomersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Customers',
            href: customersIndex(),
        },
    ],
};
