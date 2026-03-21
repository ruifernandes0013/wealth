/**
 * Format a number as Portuguese currency: € 1.234,56
 */
export function formatCurrency(value: number): string {
  const formatted = Math.abs(value).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `€ ${value < 0 ? '-' : ''}${formatted}`;
}

/**
 * Format a percentage to 1 decimal place
 */
export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Parse a Portuguese-formatted currency string back to a number
 */
export function parseCurrency(str: string): number {
  const cleaned = str.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}
