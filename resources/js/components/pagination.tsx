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
                                ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-400 dark:border-emerald-400 dark:bg-emerald-400 dark:text-zinc-950 dark:hover:bg-emerald-300'
                                : 'border-border bg-card text-foreground hover:bg-muted',
                        )}
                    >
                        {paginationLabel(link.label)}
                    </Link>
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
                    >
                        {paginationLabel(link.label)}
                    </span>
                ),
            )}
        </nav>
    );
}
