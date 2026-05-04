import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

function paginationLabel(label: string) {
    if (label.includes('Previous')) {
        return (
            <>
                <ChevronLeft className="size-4" />
                <span>Previous</span>
            </>
        );
    }

    if (label.includes('Next')) {
        return (
            <>
                <span>Next</span>
                <ChevronRight className="size-4" />
            </>
        );
    }

    return label;
}

export function Pagination({
    links,
    className,
}: {
    links: PaginationLink[];
    className?: string;
}) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <nav className={cn('flex flex-wrap items-center gap-2', className)}>
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        className={cn(
                            'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500',
                            link.active
                                ? 'border-emerald-400 bg-emerald-400 text-zinc-950 hover:bg-emerald-300'
                                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white',
                        )}
                    >
                        {paginationLabel(link.label)}
                    </Link>
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500"
                    >
                        {paginationLabel(link.label)}
                    </span>
                ),
            )}
        </nav>
    );
}
