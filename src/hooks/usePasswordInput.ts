import { useState, useCallback } from 'react';
import { validatePasswordStrength, validateConfirmPassword } from '@/utils/authValidation';

interface UsePasswordInputOptions {
  showConfirmPassword?: boolean;
  onPasswordChange?: (password: string) => void;
  onConfirmPasswordChange?: (confirmPassword: string) => void;
}

interface UsePasswordInputReturn {
  // Password visibility states
  showPassword: boolean;
  showConfirmPassword: boolean;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;

  // Password values
  password: string;
  confirmPassword: string;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;

  // Validation
  passwordValidation: {
    isValid: boolean;
    errors: string[];
  };
  confirmPasswordValidation: {
    isValid: boolean;
    error: string | null;
  };

  // Combined validation
  isFormValid: boolean;
  getFormErrors: () => string[];
}

export const usePasswordInput = (options: UsePasswordInputOptions = {}): UsePasswordInputReturn => {
  const { showConfirmPassword: hasConfirmPassword = false, onPasswordChange, onConfirmPasswordChange } = options;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPasswordState] = useState('');
  const [confirmPassword, setConfirmPasswordState] = useState('');

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  const setPassword = useCallback(
    (newPassword: string) => {
      setPasswordState(newPassword);
      if (onPasswordChange) {
        onPasswordChange(newPassword);
      }
    },
    [onPasswordChange]
  );

  const setConfirmPassword = useCallback(
    (newConfirmPassword: string) => {
      setConfirmPasswordState(newConfirmPassword);
      if (onConfirmPasswordChange) {
        onConfirmPasswordChange(newConfirmPassword);
      }
    },
    [onConfirmPasswordChange]
  );

  // Password strength validation
  const passwordValidation = validatePasswordStrength(password);

  // Confirm password validation
  const confirmPasswordValidationResult = hasConfirmPassword
    ? validateConfirmPassword(password, confirmPassword)
    : { isValid: true };
  const confirmPasswordValidation = {
    isValid: confirmPasswordValidationResult.isValid,
    error: confirmPasswordValidationResult.error || null
  };

  // Combined form validation
  const isFormValid = passwordValidation.isValid && confirmPasswordValidation.isValid;

  const getFormErrors = useCallback((): string[] => {
    const errors: string[] = [];

    if (!password) {
      errors.push('password_required');
    } else {
      errors.push(...passwordValidation.errors);
    }

    if (hasConfirmPassword) {
      if (!confirmPassword) {
        errors.push('confirm_password_required');
      } else if (confirmPasswordValidation.error) {
        errors.push(confirmPasswordValidation.error);
      }
    }

    return errors;
  }, [password, confirmPassword, passwordValidation.errors, confirmPasswordValidation.error, hasConfirmPassword]);

  return {
    // Password visibility states
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,

    // Password values
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,

    // Validation
    passwordValidation,
    confirmPasswordValidation,

    // Combined validation
    isFormValid,
    getFormErrors
  };
};
