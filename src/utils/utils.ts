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
