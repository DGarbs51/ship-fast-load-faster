import { Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Link>;

export default function TextLink({
    className = '',
    children,
    ...props
}: Props) {
    return (
        <Link
            className={cn(
                'font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-4 transition-colors duration-300 ease-out hover:text-emerald-700 hover:decoration-current! dark:text-emerald-300 dark:decoration-emerald-500/50 dark:hover:text-emerald-200',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
