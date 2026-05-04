const currencyFormatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
});

const numberFormatter = new Intl.NumberFormat('en-AU');

export function formatCurrency(value: number | null | undefined): string {
    return currencyFormatter.format(Number(value ?? 0));
}

export function formatNumber(value: number | null | undefined): string {
    return numberFormatter.format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return 'Unknown';
    }

    return new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return 'Unknown';
    }

    return new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

export function formatStatus(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
