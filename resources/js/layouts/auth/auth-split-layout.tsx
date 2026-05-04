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
        <div className="relative grid h-dvh flex-col items-center justify-center bg-zinc-950 px-8 text-white antialiased sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col p-10 text-white lg:flex">
                <div className="absolute inset-0 bg-zinc-950" />
                <div className="absolute inset-6 rounded-md bg-white/[0.04] ring-1 ring-white/10" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-medium"
                >
                    <span className="mr-3 flex size-9 items-center justify-center rounded-md bg-white text-zinc-950">
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
                        <span className="flex size-10 items-center justify-center rounded-md bg-white text-zinc-950">
                            <AppLogoIcon className="size-5 fill-current" />
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-base text-balance text-zinc-400 sm:text-sm">
                            {description}
                        </p>
                    </div>
                    <div className="[&_.text-muted-foreground]:text-zinc-400 [&_input]:border-white/10 [&_input]:bg-white/[0.06] [&_input]:text-white [&_input]:ring-white/10 [&_label]:text-zinc-200">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
