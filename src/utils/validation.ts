/**
 * Common validation utilities for forms
 */

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (Vietnamese format)
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone);
};

// Full name validation (Vietnamese characters + spaces)
export const validateFullName = (fullName: string): boolean => {
  const fullnameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔưăâêô\s]+$/;
  return fullnameRegex.test(fullName);
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('password_min_length');
  }

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    errors.push('password_requirements');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// OTP validation
export const validateOTP = (otp: string): boolean => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// Username validation
export const validateUsername = (username: string): boolean => {
  // Username should be 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Full name length validation
export const validateFullNameLength = (fullName: string): boolean => {
  return fullName.length <= 100;
};

// Combined form validation for registration
export const validateRegistrationForm = (formData: {
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (
    !formData.username ||
    !formData.fullName ||
    !formData.email ||
    !formData.phoneNumber ||
    !formData.password ||
    !formData.confirmPassword
  ) {
    errors.push('fill_all_fields');
  }

  // Validate individual fields
  if (formData.username && !validateUsername(formData.username)) {
    errors.push('invalid_username');
  }

  if (formData.fullName) {
    if (!validateFullNameLength(formData.fullName)) {
      errors.push('fullname_too_long');
    }
    if (!validateFullName(formData.fullName)) {
      errors.push('fullname_invalid_characters');
    }
  }

  if (formData.email && !validateEmail(formData.email)) {
    errors.push('invalid_email');
  }

  if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
    errors.push('invalid_phone');
  }

  if (formData.password) {
    const passwordValidation = validatePasswordStrength(formData.password);
    errors.push(...passwordValidation.errors);
  }

  if (
    formData.password &&
    formData.confirmPassword &&
    !validateConfirmPassword(formData.password, formData.confirmPassword)
  ) {
    errors.push('password_mismatch');
  }

  if (!formData.agreeTerms) {
    errors.push('agree_terms');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Combined form validation for password reset
export const validatePasswordResetForm = (formData: {
  newPassword: string;
  confirmPassword: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (!formData.newPassword || !formData.confirmPassword) {
    errors.push('fill_all_fields');
  }

  // Validate password strength
  if (formData.newPassword) {
    const passwordValidation = validatePasswordStrength(formData.newPassword);
    errors.push(...passwordValidation.errors);
  }

  // Validate password match
  if (
    formData.newPassword &&
    formData.confirmPassword &&
    !validateConfirmPassword(formData.newPassword, formData.confirmPassword)
  ) {
    errors.push('password_mismatch');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Combined form validation for profile update
export const validateFormData = (formData: {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bio?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate full name if provided
  if (formData.fullName) {
    if (!validateFullNameLength(formData.fullName)) {
      errors.push('fullname_too_long');
    }
    if (!validateFullName(formData.fullName)) {
      errors.push('fullname_invalid_characters');
    }
  }

  // Validate phone number if provided
  if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
    errors.push('invalid_phone');
  }

  // Validate date of birth if provided
  if (formData.dateOfBirth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dateOfBirth)) {
      errors.push('invalid_date_format');
    }
  }

  // Validate bio length if provided
  if (formData.bio && formData.bio.length > 500) {
    errors.push('bio_too_long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
