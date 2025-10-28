/**
 * Currency formatting utilities
 */

export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

/**
 * Format currency amount with Vietnamese locale and VND currency
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  options: CurrencyFormatOptions = {}
): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }

  const numAmount = typeof amount === 'number' ? amount : Number(amount);

  if (Number.isNaN(numAmount)) {
    return '—';
  }

  const { currency = 'VND', locale = 'vi-VN', maximumFractionDigits = 0, minimumFractionDigits = 0 } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
    minimumFractionDigits
  }).format(numAmount);
};

/**
 * Format currency for Vietnamese VND (most common case)
 */
export const formatVND = (amount: number | string | null | undefined): string => {
  return formatCurrency(amount, { currency: 'VND' });
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string): number => {
  if (!value || value === '') return 0;

  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);

  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Format number as currency without currency symbol
 */
export const formatNumber = (
  amount: number | string | null | undefined,
  options: { locale?: string; maximumFractionDigits?: number } = {}
): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }

  const numAmount = typeof amount === 'number' ? amount : Number(amount);

  if (Number.isNaN(numAmount)) {
    return '—';
  }

  const { locale = 'vi-VN', maximumFractionDigits = 0 } = options;

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(numAmount);
};
