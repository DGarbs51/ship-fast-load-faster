import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="isolate flex min-h-svh flex-col items-center justify-center bg-background p-6 text-foreground antialiased md:p-10">
            <div className="w-full max-w-sm">
                <div className="overflow-hidden rounded-md bg-muted p-2 shadow-2xl shadow-black/10 dark:shadow-none">
                    <div className="flex flex-col gap-8 rounded-md border border-border bg-card p-6 sm:p-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-3 font-medium"
                            >
                                <span className="flex size-9 items-center justify-center rounded-md bg-foreground text-background">
                                    <AppLogoIcon className="size-5 fill-current" />
                                </span>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight text-balance">
                                    {title}
                                </h1>
                                <p className="text-base text-pretty text-muted-foreground sm:text-sm">
                                    {description}
                                </p>
                            </div>
                        </div>
                        <div>{children}</div>
                    </div>
                </div>
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Commerce operations for faster fulfillment
                </div>
            </div>
        </div>
    );
}
