const DEFAULT_LOCALE = 'en-US';

function normalizeNumericInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const hasComma = trimmed.includes(',');
  const hasDot = trimmed.includes('.');
  let working = trimmed.replaceAll(/\s+/g, '');

  if (hasComma && hasDot) {
    // Determine which separator is decimal by checking last occurrence
    if (trimmed.lastIndexOf('.') > trimmed.lastIndexOf(',')) {
      // Dot is decimal, commas are thousands
      working = working.replaceAll(',', '');
    } else {
      // Comma is decimal, dots are thousands
      working = working.replaceAll('.', '').replaceAll(',', '.');
    }
  } else if (hasComma) {
    const commaCount = (trimmed.match(/,/g) || []).length;
    working = commaCount === 1 ? working.replace(',', '.') : working.replaceAll(',', '');
  } else if (hasDot) {
    const dotCount = (trimmed.match(/\./g) || []).length;
    if (dotCount > 1) {
      working = working.replaceAll('.', '');
    }
  }

  const numericValue = Number(working);
  return Number.isNaN(numericValue) ? null : numericValue;
}

export function formatStaffSalary(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  let numericValue: number | null;

  if (typeof value === 'number') {
    numericValue = value;
  } else {
    numericValue = normalizeNumericInput(value);
  }

  if (numericValue === null) {
    return String(value);
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE).format(numericValue);
}
