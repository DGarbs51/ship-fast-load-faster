import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, PackageSearch } from 'lucide-react';
import { Pagination } from '@/components/pagination';
import type { PaginationLink } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { index as productsIndex, show as productShow } from '@/routes/products';

type Product = {
    id: number;
    name: string;
    sku: string;
    price: number;
    stock_count: number;
    active: boolean;
    category: string | null;
    units_sold: number;
    revenue: number;
    average_rating: number;
    review_count: number;
};

type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export default function ProductsIndex({
    products,
}: {
    products: Paginated<Product>;
}) {
    return (
        <>
            <Head title="Products" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col gap-5 rounded-md bg-zinc-950 p-6 text-white ring-1 ring-zinc-950/10 sm:flex-row sm:items-center sm:justify-between md:p-8">
                    <div>
                        <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                            <PackageSearch className="size-4" />
                            Catalog health
                        </p>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
                            Products
                        </h1>
                        <p className="mt-2 max-w-[58ch] text-base text-pretty text-zinc-400 sm:text-sm">
                            Catalog performance, inventory, and reviews.
                        </p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-md bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-200 ring-1 ring-white/10">
                        {formatNumber(products.total)} products
                    </div>
                </header>

                <Card className="overflow-hidden py-0">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[920px] text-sm">
                                <thead className="border-b border-zinc-950/10 bg-zinc-950 text-left text-zinc-300 dark:border-white/10">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 font-medium">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Sold
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Revenue
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Rating
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Reviews
                                        </th>
                                        <th className="px-6 py-3 text-right font-medium">
                                            Stock
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={productShow(
                                                            product.id,
                                                        )}
                                                        className="font-medium text-zinc-950 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                    <ArrowUpRight className="size-3 text-zinc-400" />
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        {product.sku}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            product.active
                                                                ? 'outline'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {product.active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                                {product.category ?? 'None'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {formatCurrency(product.price)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {formatNumber(
                                                    product.units_sold,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatCurrency(
                                                    product.revenue,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {product.average_rating.toFixed(
                                                    1,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {formatNumber(
                                                    product.review_count,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span
                                                    className={
                                                        product.stock_count <=
                                                        10
                                                            ? 'font-medium text-red-600 dark:text-red-300'
                                                            : ''
                                                    }
                                                >
                                                    {formatNumber(
                                                        product.stock_count,
                                                    )}
                                                </span>
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
                        Showing {formatNumber(products.from)}-
                        {formatNumber(products.to)} of{' '}
                        {formatNumber(products.total)}
                    </p>
                    <Pagination links={products.links} />
                </div>
            </div>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: productsIndex(),
        },
    ],
};
