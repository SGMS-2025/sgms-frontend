// Validation utilities for form fields
import type { UpdateProfileData } from '@/types/api/User';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate phone number (Vietnamese format)
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: true }; // Optional field
  }

  // Remove spaces and special characters
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Check if contains only numbers
  if (!/^\d+$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Số điện thoại chỉ được chứa các chữ số'
    };
  }

  // Check Vietnamese phone number format (10-11 digits, starts with 0)
  if (!/^0[3-9]\d{8,9}$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Số điện thoại không đúng định dạng (10-11 chữ số, bắt đầu bằng 0)'
    };
  }

  return { isValid: true };
};

// Validate full name - very simple version, only check not empty
export const validateFullName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return {
      isValid: false,
      error: 'Họ và tên không được để trống'
    };
  }

  // Check maximum length to prevent extremely long inputs
  if (name.trim().length > 100) {
    return {
      isValid: false,
      error: 'Họ và tên không được vượt quá 100 ký tự'
    };
  }

  return { isValid: true };
};

// Validate address
export const validateAddress = (address: string): ValidationResult => {
  if (!address.trim()) {
    return { isValid: true }; // Optional field
  }

  // Check maximum length
  if (address.trim().length > 255) {
    return {
      isValid: false,
      error: 'Địa chỉ không được vượt quá 255 ký tự'
    };
  }

  return { isValid: true };
};

// Validate bio
export const validateBio = (bio: string): ValidationResult => {
  if (!bio.trim()) {
    return { isValid: true }; // Optional field
  }

  // Check maximum length
  if (bio.trim().length > 500) {
    return {
      isValid: false,
      error: 'Giới thiệu không được vượt quá 500 ký tự'
    };
  }

  return { isValid: true };
};

// Validate date of birth
export const validateDateOfBirth = (dateString: string): ValidationResult => {
  if (!dateString.trim()) {
    return { isValid: true }; // Optional field
  }

  // Parse date (expecting DD/MM/YYYY format)
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    return {
      isValid: false,
      error: 'Ngày sinh phải có định dạng DD/MM/YYYY'
    };
  }

  const [day, month, year] = parts.map(Number);

  // Check if all parts are numbers
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return {
      isValid: false,
      error: 'Ngày sinh không đúng định dạng'
    };
  }

  // Create date object
  const date = new Date(year, month - 1, day);
  const today = new Date();

  // Check if date is valid
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return {
      isValid: false,
      error: 'Ngày sinh không hợp lệ'
    };
  }

  // Check if date is not in the future
  if (date > today) {
    return {
      isValid: false,
      error: 'Ngày sinh không thể là ngày trong tương lai'
    };
  }

  // Check minimum age (must be at least 13 years old)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 16);
  if (date > minDate) {
    return {
      isValid: false,
      error: 'Bạn phải ít nhất 16 tuổi'
    };
  }

  // Check maximum age (must be less than 150 years old)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 150);
  if (date < maxDate) {
    return {
      isValid: false,
      error: 'Ngày sinh không hợp lệ'
    };
  }

  return { isValid: true };
};

// Validate all form data
export const validateFormData = (formData: UpdateProfileData) => {
  const errors: Record<string, string> = {};

  // Validate full name
  const nameValidation = validateFullName(formData.fullName || '');
  if (!nameValidation.isValid) {
    errors.fullName = nameValidation.error!;
  }

  // Validate phone number
  const phoneValidation = validatePhoneNumber(formData.phoneNumber || '');
  if (!phoneValidation.isValid) {
    errors.phoneNumber = phoneValidation.error!;
  }

  // Validate address
  const addressValidation = validateAddress(formData.address || '');
  if (!addressValidation.isValid) {
    errors.address = addressValidation.error!;
  }

  // Validate bio
  const bioValidation = validateBio(formData.bio || '');
  if (!bioValidation.isValid) {
    errors.bio = bioValidation.error!;
  }

  // Validate date of birth
  const dobValidation = validateDateOfBirth(formData.dateOfBirth || '');
  if (!dobValidation.isValid) {
    errors.dateOfBirth = dobValidation.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
