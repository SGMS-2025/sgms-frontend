import type React from 'react';
import { toast } from 'sonner';

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
  onError?: (error: string) => void,
  options?: ImageUploadOptions
) => {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await processImageFile(file, options);
      onSuccess(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload thất bại';

      if (onError) {
        onError(errorMessage);
      } else {
        toast.error(`Lỗi upload ảnh: ${errorMessage}`);
      }
    }
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
