import type { SortState, SortOrder } from '@/types/utils/sort';

/**
 * Generic sort function for arrays
 * @param array - Array to sort
 * @param sortState - Current sort state
 * @param getValue - Function to extract value for sorting
 * @returns Sorted array
 */
export function sortArray<T>(
  array: T[],
  sortState: SortState,
  getValue: (item: T, field: string) => string | number
): T[] {
  if (!sortState.field || !sortState.order) {
    return array;
  }

  return [...array].sort((a, b) => {
    const aValue = getValue(a, sortState.field!);
    const bValue = getValue(b, sortState.field!);

    if (aValue < bValue) {
      return sortState.order === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortState.order === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Get next sort order when clicking on a field
 * @param currentField - Currently sorted field
 * @param currentOrder - Current sort order
 * @param clickedField - Field that was clicked
 * @returns Next sort state
 */
export function getNextSortState<T extends string>(
  currentField: T | null,
  currentOrder: SortOrder,
  clickedField: T
): SortState<T> {
  if (currentField === clickedField) {
    // Same field clicked, cycle through: asc -> desc -> null
    if (currentOrder === 'asc') {
      return { field: clickedField, order: 'desc' };
    } else if (currentOrder === 'desc') {
      return { field: null, order: null };
    }
  }
  // New field clicked, start with asc
  return { field: clickedField, order: 'asc' };
}

/**
 * Create a value extractor function for common data types
 * @param field - Field name to extract
 * @param type - Type of data ('string' | 'number' | 'date')
 * @returns Function to extract value from object
 */
export function createValueExtractor<T>(field: string, type: 'string' | 'number' | 'date' = 'string') {
  return (item: T): string | number => {
    const value = (item as Record<string, unknown>)[field];

    switch (type) {
      case 'number':
        return typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) || 0 : Number(value) || 0;
      case 'date':
        return new Date(value as string | number | Date).getTime();
      case 'string':
      default:
        return typeof value === 'string' ? value.toLowerCase() : String(value || '').toLowerCase();
    }
  };
}

/**
 * Sort configuration for staff data
 */
export const staffSortConfig = {
  name: createValueExtractor('name', 'string'),
  jobTitle: createValueExtractor('jobTitle', 'string'),
  email: createValueExtractor('email', 'string'),
  phone: createValueExtractor('phone', 'string'),
  salary: createValueExtractor('salary', 'number'),
  status: createValueExtractor('status', 'string')
};

/**
 * Sort configuration for testimonial data
 */
export const testimonialSortConfig = {
  title: createValueExtractor('title', 'string'),
  createdAt: createValueExtractor('createdAt', 'date'),
  status: createValueExtractor('status', 'string')
};
