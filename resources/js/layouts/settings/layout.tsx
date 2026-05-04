import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
            <header className="rounded-md bg-zinc-950 p-6 text-white ring-1 ring-zinc-950/10 md:p-8">
                <p className="text-sm font-medium text-emerald-300">
                    Account controls
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
                    Settings
                </h1>
                <p className="mt-2 max-w-[58ch] text-base text-pretty text-zinc-400 sm:text-sm">
                    Manage your profile, security, and workspace appearance.
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="w-full">
                    <nav
                        className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item) => (
                            <Button
                                key={toUrl(item.href)}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn(
                                    'w-full justify-start border border-zinc-200 bg-white text-zinc-700 ring-1 ring-zinc-950/5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/10 dark:hover:text-white',
                                    {
                                        'border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-zinc-950 dark:hover:bg-emerald-300 dark:hover:text-zinc-950':
                                            isCurrentOrParentUrl(item.href),
                                    },
                                )}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1">
                    <section className="max-w-3xl space-y-8">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
