/**
 * Authentication validation utilities
 * Synchronized with backend validation rules
 */

// Validation constants (matching backend)
const VALIDATION_CONSTANTS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30, // Updated from 20 to match backend
  EMAIL_MAX_LENGTH: 100, // Added to match backend
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128, // Added to match backend
  FULL_NAME_MAX_LENGTH: 100
} as const;

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'email_required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'email_invalid' };
  }

  if (email.length > VALIDATION_CONSTANTS.EMAIL_MAX_LENGTH) {
    return { isValid: false, error: 'email_max_length' };
  }

  return { isValid: true };
};

// Phone number validation (Vietnamese format - keeping VN format for better UX)
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: false, error: 'phone_required' };
  }

  // Vietnamese phone format: 10-11 digits
  const phoneRegex = /^[0-9]{10,11}$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'phone_invalid' };
  }

  return { isValid: true };
};

// Full name validation (Vietnamese characters + spaces + length check)
export const validateFullName = (fullName: string): { isValid: boolean; error?: string } => {
  if (!fullName) {
    return { isValid: false, error: 'fullname_required' };
  }

  // Check length first
  if (fullName.length > VALIDATION_CONSTANTS.FULL_NAME_MAX_LENGTH) {
    return { isValid: false, error: 'fullname_too_long' };
  }

  // Check characters (Vietnamese characters + spaces)
  // Using Unicode property escapes to match all Vietnamese letters (including all diacritics)
  // This includes: a-z, A-Z, and all Vietnamese accented characters (àáảãạăằắẳẵặâầấẩẫậèéẻẽẵêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ)
  // Also allows spaces, hyphens, and apostrophes for names like "Nguyễn Văn A" or "O'Brien"
  const fullnameRegex = /^[\p{L}\s'-]+$/u;
  if (!fullnameRegex.test(fullName)) {
    return { isValid: false, error: 'fullname_invalid_characters' };
  }

  return { isValid: true };
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password) {
    errors.push('password_required');
    return { isValid: false, errors };
  }

  if (password.length < VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH) {
    errors.push('password_min_length');
  }

  if (password.length > VALIDATION_CONSTANTS.PASSWORD_MAX_LENGTH) {
    errors.push('password_max_length');
  }

  // Strong password regex: at least 1 lowercase, 1 uppercase, 1 number, 1 special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
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
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: 'confirm_password_required' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'password_mismatch' };
  }

  return { isValid: true };
};

// Username validation (updated to match backend: 3-30 characters)
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username) {
    return { isValid: false, error: 'username_required' };
  }

  // Username should be 3-30 characters, alphanumeric and underscores only (updated from 3-20)
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'username_invalid' };
  }

  return { isValid: true };
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

  // Validate username
  const usernameValidation = validateUsername(formData.username);
  if (!usernameValidation.isValid && usernameValidation.error) {
    errors.push(usernameValidation.error);
  }

  // Validate full name
  const fullNameValidation = validateFullName(formData.fullName);
  if (!fullNameValidation.isValid && fullNameValidation.error) {
    errors.push(fullNameValidation.error);
  }

  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid && emailValidation.error) {
    errors.push(emailValidation.error);
  }

  // Validate phone number
  const phoneValidation = validatePhoneNumber(formData.phoneNumber);
  if (!phoneValidation.isValid && phoneValidation.error) {
    errors.push(phoneValidation.error);
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(formData.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  // Validate confirm password
  const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (!confirmPasswordValidation.isValid && confirmPasswordValidation.error) {
    errors.push(confirmPasswordValidation.error);
  }

  // Validate terms agreement
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

// Combined form validation for change password
export const validateChangePasswordForm = (formData: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields
  if (!formData.currentPassword || !formData.newPassword || !formData.confirmNewPassword) {
    errors.push('fill_all_fields');
  }

  // Check if new password is different from current password
  if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
    errors.push('same_password');
  }

  // Validate new password strength
  if (formData.newPassword) {
    const passwordValidation = validatePasswordStrength(formData.newPassword);
    errors.push(...passwordValidation.errors);
  }

  // Validate password match
  if (
    formData.newPassword &&
    formData.confirmNewPassword &&
    !validateConfirmPassword(formData.newPassword, formData.confirmNewPassword)
  ) {
    errors.push('password_mismatch');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
