// Only keep the used function - sanitizeFeatureKey

/**
 * Sanitize feature key for backend
 */
export const sanitizeFeatureKey = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/(^_|_$)/g, ''); // Remove leading/trailing underscores
};
