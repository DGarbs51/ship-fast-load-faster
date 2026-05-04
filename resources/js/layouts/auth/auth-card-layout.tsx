import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="isolate flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-950 p-6 text-white antialiased md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <div className="flex size-9 items-center justify-center rounded-md bg-white text-zinc-950">
                        <AppLogoIcon className="size-5 fill-current" />
                    </div>
                </Link>

                <div className="flex flex-col gap-6 [&_.text-muted-foreground]:text-zinc-400 [&_input]:border-white/10 [&_input]:bg-white/[0.06] [&_input]:text-white [&_input]:ring-white/10 [&_label]:text-zinc-200">
                    <Card className="border-white/10 bg-white/[0.06] text-white ring-white/10">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl text-white">
                                {title}
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                {description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
