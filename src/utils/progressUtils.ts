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
 * @param dateString - Date string to format
 * @returns Formatted date string for input
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return new Date().toISOString().split('T')[0];

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return new Date().toISOString().split('T')[0];
  }

  return date.toISOString().split('T')[0];
};

/**
 * Convert blob URLs to File objects for upload
 * @param blobUrls - Array of blob URLs
 * @returns Promise of File array
 */
export const convertBlobUrlsToFiles = async (blobUrls: string[]): Promise<File[]> => {
  const files: File[] = [];

  for (const [index, blobUrl] of blobUrls.entries()) {
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

    const file = new File([blob], filename, { type: mimeType });
    files.push(file);
  }

  return files;
};
