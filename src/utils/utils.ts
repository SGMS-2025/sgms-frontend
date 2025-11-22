import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Color utility types
 */
export type ColorVariant = 'orange' | 'green' | 'purple';

export interface ColorClasses {
  textColor: string;
  bgColor: string;
  dotColor: string;
}

/**
 * Get color classes based on color variant
 * @param color - The color variant
 * @returns Object containing text, background, and dot color classes
 */
export function getColorClasses(color: string): ColorClasses {
  switch (color) {
    case 'orange':
      return {
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-100',
        dotColor: 'bg-orange-500'
      };
    case 'green':
      return {
        textColor: 'text-green-500',
        bgColor: 'bg-green-100',
        dotColor: 'bg-green-500'
      };
    case 'purple':
      return {
        textColor: 'text-purple-500',
        bgColor: 'bg-purple-100',
        dotColor: 'bg-purple-500'
      };
    default:
      return {
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-100',
        dotColor: 'bg-orange-500'
      };
  }
}

/**
 * Format date to DD/MM/YYYY format
 * @param dateString - Date string or Date object
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Debounce function - delays execution until after wait milliseconds have elapsed
 * since the last time it was invoked
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
