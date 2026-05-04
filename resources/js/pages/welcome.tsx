import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Boxes,
    CheckCircle2,
    Clock3,
    DollarSign,
    Package,
    ShoppingCart,
    TrendingUp,
    UsersRound,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, home, login, register } from '@/routes';

const metrics = [
    {
        label: 'Orders routed',
        value: '18.4k',
        change: '+14%',
    },
    {
        label: 'Inventory checks',
        value: '92k',
        change: 'live',
    },
    {
        label: 'Revenue watched',
        value: '$642k',
        change: '+9%',
    },
];

const fulfillmentFlow = [
    {
        label: 'Pending',
        width: '34%',
        widthClass: 'w-[34%]',
        colorClass: 'bg-amber-300',
    },
    {
        label: 'Packed',
        width: '58%',
        widthClass: 'w-[58%]',
        colorClass: 'bg-emerald-400',
    },
    {
        label: 'Shipped',
        width: '82%',
        widthClass: 'w-[82%]',
        colorClass: 'bg-sky-400',
    },
];

const features = [
    {
        title: 'Inventory stays visible',
        description:
            'See stock pressure, category movement, and low-count products before shelves go quiet.',
        icon: Boxes,
    },
    {
        title: 'Orders keep moving',
        description:
            'Track order status, customer context, item counts, and totals from one focused queue.',
        icon: ShoppingCart,
    },
    {
        title: 'Revenue has context',
        description:
            'Pair sales velocity with product performance so pricing and replenishment decisions are clearer.',
        icon: TrendingUp,
    },
    {
        title: 'Customer signals stay close',
        description:
            'Connect customer activity to order history and catalog health without digging through exports.',
        icon: UsersRound,
    },
];

const workflow = [
    'Spot low-stock products before the next batch ships.',
    'Review pending orders and status changes from one queue.',
    'Compare top products by revenue, units sold, and rating.',
];

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    const primaryHref = auth.user
        ? dashboard()
        : canRegister
          ? register()
          : login();
    const primaryLabel = auth.user
        ? 'Open dashboard'
        : canRegister
          ? 'Start tracking'
          : 'Log in';

    return (
        <>
            <Head title="Ship Fast, Load Faster" />

            <div className="isolate min-h-dvh bg-zinc-950 text-white antialiased">
                <header className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-8">
                    <Link
                        href={home()}
                        aria-label="Homepage"
                        className="flex items-center gap-3"
                    >
                        <span className="flex size-9 items-center justify-center rounded-md bg-white text-zinc-950">
                            <AppLogoIcon className="size-5 fill-current" />
                        </span>
                        <div className="text-sm font-semibold">
                            Ship Fast, Load Faster
                        </div>
                    </Link>

                    <nav className="flex items-center gap-2">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-md px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="rounded-md border border-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                <main>
                    <section className="px-6 pt-12 pb-20 sm:pt-16 lg:px-8 lg:pt-20">
                        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[9fr_8fr] lg:items-center">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                                    <Package className="size-4" />
                                    Commerce operations for faster fulfillment
                                </p>
                                <h1 className="mt-6 max-w-[12ch] text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                                    Ship faster with every signal in view.
                                </h1>
                                <p className="mt-6 max-w-[58ch] text-lg text-pretty text-zinc-300">
                                    A focused command center for orders, catalog
                                    health, revenue, and customers. Keep your
                                    store moving without bouncing between
                                    spreadsheets and stale dashboards.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        href={primaryHref}
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                                    >
                                        {primaryLabel}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    {!auth.user && (
                                        <Link
                                            href={login()}
                                            className="inline-flex items-center justify-center rounded-md px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                                        >
                                            View your workspace
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="overflow-hidden rounded-md bg-white/10 p-2 shadow-2xl ring-1 shadow-black/30 ring-white/15">
                                    <div className="rounded-md bg-zinc-950 ring-1 ring-white/10">
                                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="size-2 rounded-full bg-rose-400" />
                                                <span className="size-2 rounded-full bg-amber-300" />
                                                <span className="size-2 rounded-full bg-emerald-400" />
                                            </div>
                                            <div className="text-sm font-medium text-zinc-300">
                                                Store dashboard
                                            </div>
                                        </div>

                                        <div className="grid gap-4 p-4 sm:grid-cols-3">
                                            {metrics.map((metric) => (
                                                <div
                                                    key={metric.label}
                                                    className="rounded-md bg-white/[0.06] p-4 ring-1 ring-white/10"
                                                >
                                                    <p className="text-sm text-zinc-400">
                                                        {metric.label}
                                                    </p>
                                                    <div className="mt-3 flex items-end justify-between gap-3">
                                                        <p className="text-2xl font-semibold tabular-nums">
                                                            {metric.value}
                                                        </p>
                                                        <div className="rounded-sm bg-emerald-400/10 px-2 py-1 text-sm font-medium text-emerald-300 tabular-nums">
                                                            {metric.change}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid gap-4 px-4 pb-4 lg:grid-cols-[7fr_5fr]">
                                            <div className="rounded-md bg-white/[0.06] p-4 ring-1 ring-white/10">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-medium">
                                                            Fulfillment flow
                                                        </p>
                                                        <p className="text-sm text-zinc-400">
                                                            Orders by current
                                                            state
                                                        </p>
                                                    </div>
                                                    <Clock3 className="size-5 text-emerald-300" />
                                                </div>
                                                <div className="mt-6 flex flex-col gap-4">
                                                    {fulfillmentFlow.map(
                                                        (status) => (
                                                            <div
                                                                key={
                                                                    status.label
                                                                }
                                                            >
                                                                <div className="flex justify-between gap-4 text-sm">
                                                                    <div className="text-zinc-300">
                                                                        {
                                                                            status.label
                                                                        }
                                                                    </div>
                                                                    <div className="text-zinc-500 tabular-nums">
                                                                        {
                                                                            status.width
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 h-2 rounded-full bg-white/10">
                                                                    <div
                                                                        className={`${status.colorClass} ${status.widthClass} h-2 rounded-full`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            <div className="rounded-md bg-white/[0.06] p-4 ring-1 ring-white/10">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-medium">
                                                            Top mover
                                                        </p>
                                                        <p className="text-sm text-zinc-400">
                                                            Revenue impact
                                                        </p>
                                                    </div>
                                                    <DollarSign className="size-5 text-emerald-300" />
                                                </div>
                                                <div className="mt-6 rounded-md bg-zinc-900 p-4">
                                                    <p className="text-sm text-zinc-400">
                                                        Carbon fiber carry-on
                                                    </p>
                                                    <p className="mt-2 text-3xl font-semibold tabular-nums">
                                                        $48,920
                                                    </p>
                                                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-300">
                                                        <CheckCircle2 className="size-4" />
                                                        Reorder threshold met
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-white/10 bg-white/[0.03] py-10">
                        <div className="mx-auto grid max-w-7xl gap-6 px-6 sm:grid-cols-3 lg:px-8">
                            {[
                                [
                                    'Live order context',
                                    'Status, totals, and item counts stay together.',
                                ],
                                [
                                    'Catalog health',
                                    'Low stock and sales velocity surface quickly.',
                                ],
                                [
                                    'Customer momentum',
                                    'New activity stays connected to revenue.',
                                ],
                            ].map(([title, description]) => (
                                <div key={title}>
                                    <p className="text-lg font-semibold">
                                        {title}
                                    </p>
                                    <p className="mt-2 text-base text-pretty text-zinc-400">
                                        {description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-zinc-50 py-20 text-zinc-950 lg:py-24 dark:bg-zinc-950 dark:text-white">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="max-w-[62ch]">
                                <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                                    Built for the daily rhythm of a growing
                                    store.
                                </h2>
                                <p className="mt-4 text-lg text-pretty text-zinc-600 dark:text-zinc-400">
                                    The homepage mirrors the workspace inside:
                                    compact, readable, and built around the
                                    operational questions teams ask every day.
                                </p>
                            </div>

                            <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {features.map((feature) => (
                                    <div
                                        key={feature.title}
                                        className="rounded-md bg-white p-6 ring-1 ring-zinc-200 dark:bg-white/[0.04] dark:ring-white/10"
                                    >
                                        <dt>
                                            <feature.icon className="size-6 text-emerald-600 dark:text-emerald-300" />
                                            <span className="mt-5 block font-semibold">
                                                {feature.title}
                                            </span>
                                        </dt>
                                        <dd className="mt-3 text-base text-pretty text-zinc-600 dark:text-zinc-400">
                                            {feature.description}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>

                    <section className="bg-white py-20 text-zinc-950 lg:py-24 dark:bg-zinc-900 dark:text-white">
                        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[7fr_5fr] lg:items-start lg:px-8">
                            <div>
                                <h2 className="max-w-[14ch] text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                                    A cleaner morning standup for operations.
                                </h2>
                                <p className="mt-4 max-w-[58ch] text-lg text-pretty text-zinc-600 dark:text-zinc-400">
                                    Start with a clear picture of fulfillment,
                                    stock, product winners, and customer
                                    movement. Then move directly into the
                                    dashboard when something needs attention.
                                </p>
                            </div>

                            <div className="rounded-md bg-zinc-950 p-6 text-white ring-1 ring-zinc-950/10 dark:bg-white/[0.04] dark:ring-white/10">
                                <p className="text-sm font-medium text-emerald-300">
                                    Today&apos;s operating loop
                                </p>
                                <ol
                                    className="mt-6 flex flex-col gap-5"
                                    role="list"
                                >
                                    {workflow.map((item, index) => (
                                        <li
                                            key={item}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-sm font-semibold text-zinc-950 tabular-nums">
                                                {index + 1}
                                            </div>
                                            <div className="text-base text-pretty text-zinc-300">
                                                {item}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
