// Validation utilities for form fields
import type { UpdateProfileData } from '@/types/api/User';
import i18n from '@/configs/i18n';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Clean phone number by removing spaces and special characters
 */
const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-()]/g, '');
};

/**
 * Validate phone number contains only digits
 */
const validatePhoneDigits = (cleanPhone: string): ValidationResult | null => {
  if (!/^\d+$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: i18n.t('validation.phone_only_digits')
    };
  }
  return null;
};

/**
 * Validate phone number format (Vietnamese format: 10-11 digits starting with 0)
 */
const validatePhoneFormat = (cleanPhone: string): ValidationResult | null => {
  if (!/^0[3-9]\d{8,9}$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: i18n.t('validation.phone_invalid_format')
    };
  }
  return null;
};

/**
 * Validate phone number length range
 */
const validatePhoneLength = (cleanPhone: string, minLength: number, maxLength: number): ValidationResult | null => {
  if (cleanPhone.length < minLength || cleanPhone.length > maxLength) {
    return {
      isValid: false,
      error: `Phone number must be ${minLength}-${maxLength} digits`
    };
  }
  return null;
};

/**
 * Parse salary string to number
 */
const parseSalary = (salaryStr: string): number | null => {
  const salary = parseInt(salaryStr);
  return isNaN(salary) ? null : salary;
};

/**
 * Validate salary range
 */
const validateSalaryRange = (
  salary: number,
  min: number,
  max: number,
  minErrorKey: string,
  maxErrorKey: string
): ValidationResult | null => {
  if (salary < min) {
    return {
      isValid: false,
      error: i18n.t(minErrorKey)
    };
  }
  if (salary > max) {
    return {
      isValid: false,
      error: i18n.t(maxErrorKey)
    };
  }
  return null;
};

/**
 * Generic date of birth validator with configurable age limits
 */
const validateDateOfBirthGeneric = (
  dateString: string,
  minAge: number,
  maxAge: number,
  minAgeErrorKey: string,
  maxAgeErrorKey: string
): ValidationResult => {
  if (!dateString.trim()) {
    return { isValid: true }; // Optional field
  }

  let date: Date;

  // Check if it's YYYY-MM-DD format (from HTML date input)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    date = new Date(dateString);
  } else {
    // Use existing DD/MM/YYYY validation
    return validateDateOfBirth(dateString);
  }

  const today = new Date();

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: i18n.t('validation.date_not_valid')
    };
  }

  // Check if date is not in the future
  if (date > today) {
    return {
      isValid: false,
      error: i18n.t('validation.date_future')
    };
  }

  // Check minimum age
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - minAge);
  if (date > minDate) {
    return {
      isValid: false,
      error: i18n.t(minAgeErrorKey)
    };
  }

  // Check maximum age
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - maxAge);
  if (date < maxDate) {
    return {
      isValid: false,
      error: i18n.t(maxAgeErrorKey)
    };
  }

  return { isValid: true };
};

// Validate phone number (original - optional field)
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: true }; // Optional field
  }

  const cleanPhone = cleanPhoneNumber(phone);
  const digitError = validatePhoneDigits(cleanPhone);
  if (digitError) return digitError;

  const formatError = validatePhoneFormat(cleanPhone);
  if (formatError) return formatError;

  return { isValid: true };
};

// Validate phone number for staff form (required field, 10-11 digits)
export const validatePhoneNumberStaff = (phone: string): ValidationResult => {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.phone_required')
    };
  }

  const cleanPhone = cleanPhoneNumber(phone);
  const digitError = validatePhoneDigits(cleanPhone);
  if (digitError) return digitError;

  const lengthError = validatePhoneLength(cleanPhone, 10, 11);
  if (lengthError) return lengthError;

  return { isValid: true };
};

// Validate phone number for edit form (required field)
export const validatePhoneNumberEdit = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.phone_required')
    };
  }

  const cleanPhone = cleanPhoneNumber(phone);
  const digitError = validatePhoneDigits(cleanPhone);
  if (digitError) return digitError;

  const formatError = validatePhoneFormat(cleanPhone);
  if (formatError) return formatError;

  return { isValid: true };
};

// Validate full name - very simple version, only check not empty
export const validateFullName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.fullname_required')
    };
  }

  // Check maximum length to prevent extremely long inputs
  if (name.trim().length > 100) {
    return {
      isValid: false,
      error: i18n.t('validation.fullname_max_length')
    };
  }

  return { isValid: true };
};

// Validate address (original - optional field)
export const validateAddress = (address: string): ValidationResult => {
  if (!address.trim()) {
    return { isValid: true }; // Optional field
  }

  // Check maximum length
  if (address.trim().length > 255) {
    return {
      isValid: false,
      error: i18n.t('validation.address_max_length')
    };
  }

  return { isValid: true };
};

// Validate address for edit form (required field)
export const validateAddressEdit = (address: string): ValidationResult => {
  if (!address.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.address_required')
    };
  }

  // Check minimum length
  if (address.trim().length < 5) {
    return {
      isValid: false,
      error: i18n.t('validation.address_min_length')
    };
  }

  // Check maximum length
  if (address.trim().length > 255) {
    return {
      isValid: false,
      error: i18n.t('validation.address_max_length')
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
      error: i18n.t('validation.bio_max_length')
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
      error: i18n.t('validation.date_invalid_format')
    };
  }

  const [day, month, year] = parts.map(Number);

  // Check if all parts are numbers
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return {
      isValid: false,
      error: i18n.t('validation.date_invalid')
    };
  }

  // Create date object
  const date = new Date(year, month - 1, day);
  const today = new Date();

  // Check if date is valid
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return {
      isValid: false,
      error: i18n.t('validation.date_not_valid')
    };
  }

  // Check if date is not in the future
  if (date > today) {
    return {
      isValid: false,
      error: i18n.t('validation.date_future')
    };
  }

  // Check minimum age (must be at least 13 years old)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 16);
  if (date > minDate) {
    return {
      isValid: false,
      error: i18n.t('validation.age_minimum')
    };
  }

  // Check maximum age (must be less than 150 years old)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 150);
  if (date < maxDate) {
    return {
      isValid: false,
      error: i18n.t('validation.age_maximum')
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

// ==================== ADDITIONAL VALIDATIONS FOR STAFF FORM ====================

// Validate email address
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.email_required')
    };
  }

  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      error: i18n.t('validation.email_invalid')
    };
  }

  // Check maximum length
  if (email.trim().length > 100) {
    return {
      isValid: false,
      error: i18n.t('validation.email_max_length')
    };
  }

  return { isValid: true };
};

// Validate username
export const validateUsername = (username: string): ValidationResult => {
  if (!username.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.username_required')
    };
  }

  // Username should be 3-20 characters, alphanumeric and underscore only
  if (!/^\w{3,20}$/.test(username.trim())) {
    return {
      isValid: false,
      error: i18n.t('validation.username_invalid')
    };
  }

  // Should not start or end with underscore
  if (username.startsWith('_') || username.endsWith('_')) {
    return {
      isValid: false,
      error: i18n.t('validation.username_underscore')
    };
  }

  return { isValid: true };
};

// Validate password
export const validatePassword = (password: string): ValidationResult => {
  if (!password.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.password_required')
    };
  }

  // Password should be at least 8 characters
  if (password.length < 8) {
    return {
      isValid: false,
      error: i18n.t('validation.password_min_length')
    };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: i18n.t('validation.password_missing_uppercase')
    };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: i18n.t('validation.password_missing_lowercase')
    };
  }

  // Check for number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: i18n.t('validation.password_missing_number')
    };
  }

  // Check for special character
  if (!/[@$!%*?&]/.test(password)) {
    return {
      isValid: false,
      error: i18n.t('validation.password_missing_special')
    };
  }

  // Check maximum length
  if (password.length > 128) {
    return {
      isValid: false,
      error: i18n.t('validation.password_max_length')
    };
  }

  return { isValid: true };
};

// Validate password confirmation
export const validatePasswordConfirmation = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.confirm_password_required')
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: i18n.t('validation.password_mismatch')
    };
  }

  return { isValid: true };
};

/**
 * Validate password for customer modal
 * Returns error message string or empty string if valid
 * @param value - Password value to validate
 * @param isEditMode - Whether in edit mode (password is optional)
 * @param t - Translation function from useTranslation hook
 * @returns Error message string or empty string if valid
 */
export const validateCustomerPassword = (value: string, isEditMode: boolean, t: (key: string) => string): string => {
  // In edit mode, password is optional (only validate if provided)
  if (isEditMode) {
    // If password is provided in edit mode, validate it
    if (value && value.trim() !== '') {
      if (value.length < 8) return t('customer_modal.validation.password_length');
      if (!/[A-Z]/.test(value)) return t('customer_modal.validation.password_uppercase');
      if (!/[0-9]/.test(value)) return t('customer_modal.validation.password_number');
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return t('customer_modal.validation.password_special');
    }
    return '';
  }

  // In create mode, password is required
  if (!value.trim()) return t('customer_modal.validation.password_required');
  if (value.length < 8) return t('customer_modal.validation.password_length');
  if (!/[A-Z]/.test(value)) return t('customer_modal.validation.password_uppercase');
  if (!/[0-9]/.test(value)) return t('customer_modal.validation.password_number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return t('customer_modal.validation.password_special');
  return '';
};

// Validate job title
export const validateJobTitle = (jobTitle: string): ValidationResult => {
  if (!jobTitle.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.job_title_required')
    };
  }

  // Valid job titles from backend STAFF_JOB_TITLES enum
  const validJobTitles = ['Manager', 'Admin', 'Owner', 'Personal Trainer', 'Technician'];
  if (!validJobTitles.includes(jobTitle.trim())) {
    return {
      isValid: false,
      error: i18n.t('validation.job_title_invalid')
    };
  }

  return { isValid: true };
};

// Validate salary (original - optional field, 1M to 1B VND)
export const validateSalary = (salaryStr: string): ValidationResult => {
  if (!salaryStr.trim()) {
    return { isValid: true }; // Optional field with default value
  }

  const salary = parseSalary(salaryStr);
  if (salary === null) {
    return {
      isValid: false,
      error: i18n.t('validation.salary_invalid')
    };
  }

  const rangeError = validateSalaryRange(salary, 1000000, 1000000000, 'validation.salary_min', 'validation.salary_max');
  if (rangeError) return rangeError;

  return { isValid: true };
};

// Validate salary for edit form (required field, 1M to 50M VND)
export const validateSalaryEdit = (salaryStr: string): ValidationResult => {
  if (!salaryStr.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.salary_required')
    };
  }

  const salary = parseSalary(salaryStr);
  if (salary === null) {
    return {
      isValid: false,
      error: i18n.t('validation.salary_invalid')
    };
  }

  const rangeError = validateSalaryRange(
    salary,
    1000000,
    50000000,
    'validation.salary_min',
    'validation.salary_max_50m'
  );
  if (rangeError) return rangeError;

  return { isValid: true };
};

// Validate branch selection
export const validateBranchId = (branchId: string): ValidationResult => {
  if (!branchId.trim()) {
    return {
      isValid: false,
      error: i18n.t('validation.branch_required')
    };
  }

  return { isValid: true };
};

// Enhanced date validation for staff form (accepts both DD/MM/YYYY and YYYY-MM-DD formats)
export const validateDateOfBirthStaff = (dateString: string): ValidationResult => {
  return validateDateOfBirthGeneric(
    dateString,
    18,
    80,
    'validation.staff_age_minimum_18',
    'validation.staff_age_maximum'
  );
};

// Enhanced date validation for customer form (accepts both DD/MM/YYYY and YYYY-MM-DD formats, minimum age 5)
export const validateDateOfBirthCustomer = (dateString: string): ValidationResult => {
  return validateDateOfBirthGeneric(dateString, 5, 150, 'validation.customer_age_minimum_5', 'validation.age_maximum');
};
