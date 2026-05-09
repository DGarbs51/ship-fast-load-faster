import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center bg-background px-8 text-foreground antialiased sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col p-10 lg:flex">
                <div className="absolute inset-0 bg-muted" />
                <div className="absolute inset-6 rounded-md border border-border bg-card" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-medium"
                >
                    <span className="mr-3 flex size-9 items-center justify-center rounded-md bg-foreground text-background">
                        <AppLogoIcon className="size-5 fill-current" />
                    </span>
                    {name}
                </Link>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <span className="flex size-10 items-center justify-center rounded-md bg-foreground text-background">
                            <AppLogoIcon className="size-5 fill-current" />
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-base text-balance text-muted-foreground sm:text-sm">
                            {description}
                        </p>
                    </div>
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}
