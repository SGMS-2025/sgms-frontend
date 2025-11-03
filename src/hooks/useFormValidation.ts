import { useState, useCallback } from 'react';
import type { ValidationResult } from '@/utils/validation';

/**
 * Validator function type
 */
export type ValidatorFunction = (value: string) => ValidationResult;

/**
 * Validators configuration map
 */
export type ValidatorsConfig<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidatorFunction | ((value: string, formData: T) => ValidationResult);
};

/**
 * Options for useFormValidation hook
 */
export interface UseFormValidationOptions<T extends Record<string, unknown>> {
  /** Validators for each field */
  validators: ValidatorsConfig<T>;
  /** Required fields (will be validated even if empty) */
  requiredFields?: (keyof T)[];
  /** Optional fields (only validated if they have values) */
  optionalFields?: (keyof T)[];
  /** Custom field value extractor (for handling File types, arrays, etc.) */
  getFieldValue?: (field: keyof T, value: unknown) => string;
}

/**
 * Return type of useFormValidation hook
 */
export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  /** Current errors state */
  errors: Record<string, string>;
  /** Validate a single field */
  validateField: (field: keyof T, value: unknown, formData: T) => string | null;
  /** Validate entire form */
  validateForm: (formData: T) => boolean;
  /** Clear all errors */
  clearErrors: () => void;
  /** Clear error for a specific field */
  clearFieldError: (field: keyof T) => void;
  /** Set error for a specific field */
  setFieldError: (field: keyof T, error: string) => void;
  /** Set multiple errors at once */
  setErrors: (errors: Record<string, string>) => void;
}

/**
 * Hook for form validation with centralized error management
 *
 * @param options - Validation configuration
 * @returns Validation functions and error state
 *
 * @example
 * const { errors, validateField, validateForm, setErrors } = useFormValidation({
 *   validators: {
 *     email: validateEmail,
 *     phone: validatePhoneNumber
 *   },
 *   requiredFields: ['email', 'phone'],
 *   optionalFields: ['address']
 * });
 */
export function useFormValidation<T extends Record<string, unknown>>(
  options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
  const { validators, requiredFields = [], optionalFields = [], getFieldValue } = options;

  const [errors, setErrorsState] = useState<Record<string, string>>({});

  /**
   * Get string value from field value (handles File, arrays, etc.)
   */
  const getStringValue = useCallback(
    (field: keyof T, value: unknown): string => {
      if (getFieldValue) {
        return getFieldValue(field, value);
      }

      // Default: convert to string
      if (value === null || value === undefined) {
        return '';
      }

      if (value instanceof File) {
        return '';
      }

      if (Array.isArray(value)) {
        return value.length > 0 ? String(value[0]) : '';
      }

      return String(value);
    },
    [getFieldValue]
  );

  /**
   * Get validation result for a field
   */
  const getValidationResult = useCallback(
    (fieldName: keyof T, value: string, formData: T): ValidationResult => {
      const validator = validators[fieldName];

      if (!validator) {
        return { isValid: true };
      }

      // Check if validator is a function that takes formData
      if (validator.length > 1) {
        return (validator as (value: string, formData: T) => ValidationResult)(value, formData);
      } else {
        return (validator as ValidatorFunction)(value);
      }
    },
    [validators]
  );

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof T, value: unknown, formData: T): string | null => {
      const stringValue = getStringValue(field, value);
      const result = getValidationResult(field, stringValue, formData);
      return result.isValid ? null : result.error || '';
    },
    [getStringValue, getValidationResult]
  );

  /**
   * Validate entire form
   */
  const validateForm = useCallback(
    (formData: T): boolean => {
      const newErrors: Record<string, string> = {};

      // Validate required fields
      requiredFields.forEach((field) => {
        const fieldValue = formData[field];

        // Special handling for arrays (e.g., branchId)
        if (Array.isArray(fieldValue)) {
          if (fieldValue.length === 0) {
            newErrors[String(field)] = `${String(field)} is required`;
          }
        } else {
          const error = validateField(field, fieldValue, formData);
          if (error) {
            newErrors[String(field)] = error;
          }
        }
      });

      // Validate optional fields (only if they have values)
      optionalFields.forEach((field) => {
        const fieldValue = formData[field];

        // Skip File types
        if (fieldValue instanceof File) {
          return;
        }

        // Skip null/undefined
        if (fieldValue === null || fieldValue === undefined) {
          return;
        }

        // For strings, check if not empty
        if (typeof fieldValue === 'string' && fieldValue.trim()) {
          const error = validateField(field, fieldValue, formData);
          if (error) {
            newErrors[String(field)] = error;
          }
        }

        // For arrays, validate if not empty
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          const error = validateField(field, fieldValue, formData);
          if (error) {
            newErrors[String(field)] = error;
          }
        }
      });

      setErrorsState(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [requiredFields, optionalFields, validateField]
  );

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrorsState({});
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((field: keyof T) => {
    setErrorsState((prev) => {
      const newErrors = { ...prev };
      delete newErrors[String(field)];
      return newErrors;
    });
  }, []);

  /**
   * Set error for a specific field
   */
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrorsState((prev) => ({
      ...prev,
      [String(field)]: error
    }));
  }, []);

  /**
   * Set multiple errors at once
   */
  const setErrors = useCallback((newErrors: Record<string, string>) => {
    setErrorsState(newErrors);
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    setFieldError,
    setErrors
  };
}
