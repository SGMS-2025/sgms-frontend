import type React from 'react';

export interface ImageUploadResult {
  imageUrl: string;
  file: File;
}

export interface ImageUploadOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Validates and processes an image file
 * @param file - The file to process
 * @param options - Upload options and constraints
 * @returns Promise with image URL and file
 */
export const processImageFile = (file: File, options: ImageUploadOptions = {}): Promise<ImageUploadResult> => {
  return new Promise((resolve, reject) => {
    const {
      maxSizeInMB = 5,
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxWidth = 1024,
      maxHeight = 1024,
      quality = 0.8
    } = options;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      reject(new Error('Loại file không hợp lệ. Chỉ cho phép file ảnh.'));
      return;
    }

    // Validate file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      reject(new Error(`Kích thước file phải nhỏ hơn ${maxSizeInMB}MB`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;

      // If resize is needed, resize the image
      if (maxWidth && maxHeight && (maxWidth < 2000 || maxHeight < 2000)) {
        resizeImage(imageUrl, maxWidth, maxHeight, quality)
          .then((resizedUrl) => {
            resolve({
              imageUrl: resizedUrl,
              file
            });
          })
          .catch(reject);
      } else {
        resolve({
          imageUrl,
          file
        });
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.readAsDataURL(file);
  });
};

/**
 * Resizes an image to fit within specified dimensions
 * @param imageUrl - Base64 image URL
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @param quality - Image quality (0-1)
 * @returns Promise with resized image URL
 */
export const resizeImage = (
  imageUrl: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      const aspectRatio = width / height;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const resizedUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(resizedUrl);
    };

    img.src = imageUrl;
  });
};

/**
 * Creates a reusable image upload handler for form inputs
 * @param onSuccess - Callback when upload succeeds
 * @param onError - Callback when upload fails
 * @param options - Upload options
 * @returns Event handler for file input
 */
export const createImageUploadHandler = (
  onSuccess: (result: ImageUploadResult) => void,
  options?: ImageUploadOptions
) => {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await processImageFile(file, options);
    onSuccess(result);
  };
};

/**
 * Validates if a file is a valid image
 * @param file - File to validate
 * @returns boolean indicating if file is valid image
 */
export const isValidImageFile = (
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Formats file size to human readable string
 * @param bytes - File size in bytes
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Default options for staff profile images
 */
export const STAFF_IMAGE_OPTIONS: ImageUploadOptions = {
  maxSizeInMB: 2,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.85
};

/**
 * Default options for branch/facility images
 */
export const FACILITY_IMAGE_OPTIONS: ImageUploadOptions = {
  maxSizeInMB: 5,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxWidth: 1200,
  maxHeight: 800,
  quality: 0.9
};

/**
 * Default options for training progress photos
 */
export const TRAINING_PHOTO_OPTIONS: ImageUploadOptions = {
  maxSizeInMB: 3,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8
};

/**
 * Advanced image compression with progressive quality reduction
 * @param file - File or Blob to compress
 * @param targetSizeKB - Target file size in KB
 * @param options - Compression options
 * @returns Promise<File> - Compressed file
 */
export const compressImageAdvanced = async (
  file: File | Blob,
  targetSizeKB: number = 500,
  options: ImageUploadOptions = {}
): Promise<File> => {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

  // Create image element
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Load image
  const imageUrl = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });

  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = img;

  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;

    if (width > height) {
      width = Math.min(maxWidth, width);
      height = width / aspectRatio;
    } else {
      height = Math.min(maxHeight, height);
      width = height * aspectRatio;
    }
  }

  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Clean up
  URL.revokeObjectURL(imageUrl);

  // Progressive compression - start with desired quality and reduce if needed
  let currentQuality = quality;
  let compressedBlob: Blob | null = null;
  const targetSizeBytes = targetSizeKB * 1024;

  do {
    compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', currentQuality);
    });

    if (!compressedBlob) {
      throw new Error('Failed to compress image');
    }

    // If size is acceptable or quality too low, break
    if (compressedBlob.size <= targetSizeBytes || currentQuality <= 0.1) {
      break;
    }

    currentQuality -= 0.1;
  } while (currentQuality > 0.1);

  // Create File from compressed blob
  const originalName = file instanceof File ? file.name : 'compressed-image';
  const filename = originalName.replace(/\.[^/.]+$/, '') + '_optimized.jpg';

  const compressedFile = new File([compressedBlob], filename, {
    type: 'image/jpeg',
    lastModified: Date.now()
  });

  return compressedFile;
};

/**
 * Batch compress multiple images
 * @param files - Array of files to compress
 * @param targetSizeKB - Target size for each file
 * @param onProgress - Progress callback
 * @returns Promise<File[]> - Array of compressed files
 */
export const compressBatchImages = async (
  files: File[],
  targetSizeKB: number = 500,
  onProgress?: (current: number, total: number) => void
): Promise<File[]> => {
  const compressedFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i + 1, files.length);
    const compressed = await compressImageAdvanced(files[i], targetSizeKB, TRAINING_PHOTO_OPTIONS);
    compressedFiles.push(compressed);
  }

  return compressedFiles;
};

/**
 * Validate and prepare image files for upload
 * @param files - Files to validate
 * @returns Object with valid files and errors
 */
export const validateAndPrepareImages = (
  files: FileList | File[]
): {
  validFiles: File[];
  errors: string[];
  totalSize: number;
} => {
  const validFiles: File[] = [];
  const errors: string[] = [];
  let totalSize = 0;

  const fileArray = Array.from(files);

  fileArray.forEach((file, index) => {
    // Validate file type
    if (!isValidImageFile(file)) {
      errors.push(`File ${index + 1}: Invalid image format`);
      return;
    }

    // Validate file size (10MB individual limit)
    if (file.size > 10 * 1024 * 1024) {
      errors.push(`File ${index + 1}: File too large (max 10MB)`);
      return;
    }

    validFiles.push(file);
    totalSize += file.size;
  });

  // Check total size (50MB limit for batch)
  if (totalSize > 50 * 1024 * 1024) {
    errors.push('Total file size exceeds 50MB limit');
  }

  return { validFiles, errors, totalSize };
};

/**
 * Get image metadata
 * @param file - Image file
 * @returns Promise with metadata
 */
export const getImageMetadata = async (
  file: File
): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
        name: file.name
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image metadata'));
    };

    img.src = url;
  });
};
