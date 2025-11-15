export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

// Default Vietnamese locale formatter
const DEFAULT_LOCALE = 'vi-VN';
const DEFAULT_CURRENCY = 'VND';
const EMPTY_PLACEHOLDER = '—';

/**
 * Normalize amount to number
 */
const normalizeAmount = (amount: number | string | null | undefined): number | null => {
  if (amount === null || amount === undefined || amount === '') {
    return null;
  }

  const numAmount = typeof amount === 'number' ? amount : Number(amount);
  return Number.isNaN(numAmount) ? null : numAmount;
};

/**
 * Format currency amount with Vietnamese locale and VND currency
 * Main function for displaying currency with symbol (e.g., "200.000 ₫")
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  options: CurrencyFormatOptions = {}
): string => {
  const normalized = normalizeAmount(amount);
  if (normalized === null) {
    return EMPTY_PLACEHOLDER;
  }

  const {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    maximumFractionDigits = 0,
    minimumFractionDigits = 0
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
    minimumFractionDigits
  }).format(normalized);
};

/**
 * Format currency for Vietnamese VND (most common case)
 * Convenience wrapper for formatCurrency
 */
export const formatVND = (amount: number | string | null | undefined): string => {
  return formatCurrency(amount, { currency: 'VND' });
};

/**
 * Format number as currency without currency symbol
 * Use for displaying numbers with thousand separators (e.g., "200.000")
 */
export const formatNumber = (
  amount: number | string | null | undefined,
  options: { locale?: string; maximumFractionDigits?: number } = {}
): string => {
  const normalized = normalizeAmount(amount);
  if (normalized === null) {
    return EMPTY_PLACEHOLDER;
  }

  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 0 } = options;

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(normalized);
};

/**
 * Format price for input field display (with dot separators: 200.000, 2.000.000)
 * Used for displaying formatted price in input fields
 * Accepts both string (from input) and number (for initial display)
 */
export const formatPriceInput = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // If it's a string, remove all non-numeric characters first
  const numericString = typeof value === 'string' ? value.replace(/[^\d]/g, '') : String(value);

  if (numericString === '' || numericString === '0') {
    return '';
  }

  const numValue = Number(numericString);
  if (Number.isNaN(numValue) || numValue === 0) {
    return '';
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(numValue);
};

/**
 * Format price from number to display string (for initial display in edit dialogs)
 * Alias for formatPriceInput - same logic for number input
 */
export const formatPriceForDisplay = (value: number | null | undefined): string => {
  return formatPriceInput(value);
};

/**
 * Parse formatted price string to number (remove dot separators)
 * Used when saving to database - converts "200.000" to 200000
 */
export const parsePriceInput = (value: string): number => {
  if (!value || value === '') {
    return 0;
  }

  // Remove all non-numeric characters (dots, spaces, etc.)
  const cleaned = value.replace(/[^\d]/g, '');

  if (cleaned === '') {
    return 0;
  }

  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};
