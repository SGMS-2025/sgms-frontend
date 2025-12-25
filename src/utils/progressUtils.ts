/**
 * Calculate BMI (Body Mass Index) from weight and height
 * @param weight - Weight in kilograms
 * @param height - Height in centimeters
 * @returns BMI value
 */
export const calculateBMI = (weight: number, height: number): number => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

/**
 * Get BMI category based on BMI value
 * @param bmi - BMI value
 * @returns BMI category string
 */
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Format date string for input field (YYYY-MM-DD)
 * @param dateString - Date string to format (can be in various formats: YYYY-MM-DD, dd/MM/yyyy, etc.)
 * @returns Formatted date string for input (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return new Date().toISOString().split('T')[0];

  // Try to parse different date formats
  let date: Date | null = null;

  // First, try parsing as ISO string or standard format
  date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // If that fails, try parsing dd/MM/yyyy format (Vietnamese format)
  const ddmmyyyyMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    // Create date in local timezone at noon to avoid timezone issues
    // Then format as YYYY-MM-DD manually to avoid timezone conversion
    const yearNum = Number.parseInt(year, 10);
    const monthNum = Number.parseInt(month, 10) - 1;
    const dayNum = Number.parseInt(day, 10);

    // Validate date
    date = new Date(yearNum, monthNum, dayNum);
    if (
      !isNaN(date.getTime()) &&
      date.getFullYear() === yearNum &&
      date.getMonth() === monthNum &&
      date.getDate() === dayNum
    ) {
      // Format manually as YYYY-MM-DD to avoid timezone issues
      const formattedMonth = String(monthNum + 1).padStart(2, '0');
      const formattedDay = String(dayNum).padStart(2, '0');
      return `${yearNum}-${formattedMonth}-${formattedDay}`;
    }
  }

  // If all parsing fails, log warning and return today's date
  console.warn('Invalid date string:', dateString);
  return new Date().toISOString().split('T')[0];
};

/**
 * Convert blob URLs to File objects for upload with compression
 * @param blobUrls - Array of blob URLs
 * @param compress - Whether to compress images (default: true)
 * @returns Promise of File array
 */
export const convertBlobUrlsToFiles = async (blobUrls: string[], compress: boolean = true): Promise<File[]> => {
  const { compressImageAdvanced } = await import('@/utils/imageUtils');
  const files: File[] = [];

  for (const [index, blobUrl] of blobUrls.entries()) {
    if (!blobUrl || !blobUrl.startsWith('blob:')) {
      continue;
    }

    const fetchResponse = await fetch(blobUrl);
    const blob = await fetchResponse.blob();

    // Detect proper MIME type from blob
    let mimeType = blob.type;
    if (!mimeType || !mimeType.startsWith('image/')) {
      // Fallback to jpeg if MIME type is not detected or invalid
      mimeType = 'image/jpeg';
    }

    // Generate unique filename with proper extension using crypto for security
    const extension = mimeType.split('/')[1] || 'jpg';
    const randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const filename = `photo_${Date.now()}_${index}_${randomPart}.${extension}`;

    let file = new File([blob], filename, { type: mimeType });

    // Compress image if requested and file is larger than 500KB
    if (compress && file.size > 500 * 1024) {
      file = await compressImageAdvanced(file, 500); // Target 500KB
    }

    files.push(file);
  }

  return files;
};

/**
 * Validate image files for training progress
 * @param files - Files to validate
 * @returns Validation result
 */
export const validateProgressImages = (
  files: File[]
): {
  isValid: boolean;
  errors: string[];
  validFiles: File[];
} => {
  const errors: string[] = [];
  const validFiles: File[] = [];

  // Check maximum number of files
  if (files.length > 5) {
    errors.push('Maximum 5 photos allowed');
    return { isValid: false, errors, validFiles };
  }

  files.forEach((file, index) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push(`File ${index + 1}: Must be an image file`);
      return;
    }

    // Check file size (10MB limit per file)
    if (file.size > 10 * 1024 * 1024) {
      errors.push(`File ${index + 1}: File size must be less than 10MB`);
      return;
    }

    validFiles.push(file);
  });

  return {
    isValid: errors.length === 0,
    errors,
    validFiles
  };
};

/**
 * Calculate total file size
 * @param files - Array of files
 * @returns Total size in bytes
 */
export const calculateTotalFileSize = (files: File[]): number => {
  return files.reduce((total, file) => total + file.size, 0);
};

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};
