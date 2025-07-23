// Formats cents to USD string: 2500 -> "$25.00"
export function formatCurrency(cents: number): string {
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
}

export function centsToDecimal(cents: number): number {
    return Math.round(cents / 100 * 100) / 100; // Round to 2 decimal places
}