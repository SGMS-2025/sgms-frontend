// Validation utilities for testimonial forms
import i18n from '@/configs/i18n';
import type { TestimonialFormData } from '@/types/api/Testimonial';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate testimonial title
export const validateTestimonialTitle = (title: string): ValidationResult => {
  if (!title.trim()) {
    return {
      isValid: false,
      error: i18n.t('testimonial_form.title_required')
    };
  }

  // Check minimum length
  if (title.trim().length < 3) {
    return {
      isValid: false,
      error: i18n.t('testimonial_form.title_min_length')
    };
  }

  // Check maximum length (200 characters as per backend)
  if (title.trim().length > 200) {
    return {
      isValid: false,
      error: i18n.t('testimonial_form.title_max_length')
    };
  }

  return { isValid: true };
};

// Validate testimonial content
export const validateTestimonialContent = (content: string): ValidationResult => {
  if (!content.trim()) {
    return {
      isValid: false,
      error: i18n.t('testimonial_form.content_required')
    };
  }

  // Check minimum length
  if (content.trim().length < 10) {
    return {
      isValid: false,
      error: i18n.t('testimonial_form.content_min_length')
    };
  }

  // Check maximum length (2000 characters as per backend)
  if (content.trim().length > 2000) {
    return {
      isValid: false,
      error: i18n.t('testimonial_form.content_max_length')
    };
  }

  return { isValid: true };
};

// Validate testimonial status
export const validateTestimonialStatus = (status: string): ValidationResult => {
  const validStatuses = ['ACTIVE', 'INACTIVE'];

  if (!validStatuses.includes(status)) {
    return {
      isValid: false,
      error: i18n.t('testimonial_form.status_invalid')
    };
  }

  return { isValid: true };
};

// Validate image file
export const validateImageFile = (file: File): ValidationResult => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: i18n.t('testimonial_form.invalid_file_type')
    };
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: i18n.t('testimonial_form.file_too_large')
    };
  }

  return { isValid: true };
};

// Validate all testimonial form data
export const validateTestimonialFormData = (formData: TestimonialFormData) => {
  const errors: Record<string, string> = {};

  // Validate title
  const titleValidation = validateTestimonialTitle(formData.title);
  if (!titleValidation.isValid) {
    errors.title = titleValidation.error!;
  }

  // Validate content
  const contentValidation = validateTestimonialContent(formData.content);
  if (!contentValidation.isValid) {
    errors.content = contentValidation.error!;
  }

  // Validate status
  const statusValidation = validateTestimonialStatus(formData.status);
  if (!statusValidation.isValid) {
    errors.status = statusValidation.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
