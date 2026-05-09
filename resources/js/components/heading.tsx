export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-8 space-y-0.5'}>
            <h2
                className={
                    variant === 'small'
                        ? 'mb-1 text-lg font-semibold tracking-tight text-balance'
                        : 'text-2xl font-semibold tracking-tight text-balance'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="text-base text-pretty text-muted-foreground sm:text-sm">
                    {description}
                </p>
            )}
        </header>
    );
}
