import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Safely resolves a Lucide icon by name with fallback
 * @param iconName - Name of the Lucide icon (e.g., 'Sparkles', 'Home')
 * @param fallback - Fallback icon to use if not found (default: Sparkles)
 * @returns LucideIcon component
 */
export const resolveIcon = (iconName: string, fallback: LucideIcon = Icons.Sparkles as LucideIcon): LucideIcon => {
  // Validate icon name exists in lucide-react
  if (iconName in Icons) {
    const IconComponent = Icons[iconName as keyof typeof Icons];

    if (typeof IconComponent === 'function') {
      return IconComponent as LucideIcon;
    }
  }

  // Warn in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Icon "${iconName}" not found in lucide-react, using fallback icon "${fallback.name || 'Sparkles'}"`);
  }

  return fallback;
};

/**
 * Check if an icon name exists in Lucide icons
 * @param iconName - Name of the icon to check
 * @returns boolean indicating if icon exists
 */
export const isValidIconName = (iconName: string): boolean => {
  return iconName in Icons && typeof Icons[iconName as keyof typeof Icons] === 'function';
};

/**
 * Get all available Lucide icon names
 * @returns Array of icon names
 */
export const getAvailableIconNames = (): string[] => {
  return Object.keys(Icons).filter((key) => typeof Icons[key as keyof typeof Icons] === 'function');
};
