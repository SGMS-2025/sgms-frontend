/**
 * Image Constants
 *
 * Centralized storage for all image URLs used throughout the application
 * This helps reduce code duplication and makes it easier to update image URLs
 */

// Cloudinary base configuration
const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/dqdwaljcc/image/upload';

// Logo and branding images
export const IMAGES = {
  // Main logo used in headers and navigation
  LOGO: `${CLOUDINARY_BASE_URL}/v1756985248/sgms_avatars/lspoumruhhozuzeoszky.png`,

  // Footer logo (different from main logo)
  FOOTER_LOGO: `${CLOUDINARY_BASE_URL}/v1756984782/sgms_avatars/mvwyclpnuicmifn6vof7.png`,

  // Placeholder images
  AVATAR_PLACEHOLDER: '/placeholder.svg'
} as const;

// Export individual images for easier access
export const { LOGO, FOOTER_LOGO, AVATAR_PLACEHOLDER } = IMAGES;

// Helper function to get image URL with fallback
export const getImageUrl = (imageKey: keyof typeof IMAGES, fallback?: string): string => {
  return IMAGES[imageKey] || fallback || '';
};
