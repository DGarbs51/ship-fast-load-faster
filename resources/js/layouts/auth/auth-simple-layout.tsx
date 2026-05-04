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
        <div className="isolate flex min-h-svh flex-col items-center justify-center bg-zinc-950 p-6 text-white antialiased md:p-10">
            <div className="w-full max-w-sm">
                <div className="overflow-hidden rounded-md bg-white/10 p-2 shadow-2xl ring-1 shadow-black/25 ring-white/15">
                    <div className="flex flex-col gap-8 rounded-md bg-zinc-950 p-6 ring-1 ring-white/10 sm:p-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-3 font-medium"
                            >
                                <span className="flex size-9 items-center justify-center rounded-md bg-white text-zinc-950">
                                    <AppLogoIcon className="size-5 fill-current" />
                                </span>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight text-balance">
                                    {title}
                                </h1>
                                <p className="text-base text-pretty text-zinc-400 sm:text-sm">
                                    {description}
                                </p>
                            </div>
                        </div>
                        <div className="[&_.text-muted-foreground]:text-zinc-400 [&_input]:border-white/10 [&_input]:bg-white/[0.06] [&_input]:text-white [&_input]:ring-white/10 [&_label]:text-zinc-200">
                            {children}
                        </div>
                    </div>
                </div>
                <div className="mt-6 text-center text-sm text-zinc-500">
                    Commerce operations for faster fulfillment
                </div>
            </div>
        </div>
    );
}
