import { Monitor, Moon, Sun } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const order: Appearance[] = ['light', 'dark', 'system'];

const meta: Record<Appearance, { icon: typeof Sun; label: string }> = {
    light: { icon: Sun, label: 'Light' },
    dark: { icon: Moon, label: 'Dark' },
    system: { icon: Monitor, label: 'System' },
};

export default function AppearanceToggleTab({
    className,
    ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
    const { appearance, updateAppearance } = useAppearance();
    const { icon: Icon, label } = meta[appearance];

    const cycle = () => {
        const next = order[(order.indexOf(appearance) + 1) % order.length];
        updateAppearance(next);
    };

    return (
        <button
            type="button"
            onClick={cycle}
            className={cn(
                'flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                className,
            )}
            {...props}
        >
            <Icon className="mr-2 size-4" />
            {label}
        </button>
    );
}
