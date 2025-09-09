import React from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { usePasswordInput } from '@/hooks/usePasswordInput';
import { useTranslation } from 'react-i18next';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showConfirmPassword?: boolean;
  confirmPasswordValue?: string;
  onConfirmPasswordChange?: (value: string) => void;
  confirmPasswordPlaceholder?: string;
  confirmPasswordLabel?: string;
  className?: string;
  inputClassName?: string;
  showRequirements?: boolean;
  showValidationErrors?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  showConfirmPassword = false,
  confirmPasswordValue = '',
  onConfirmPasswordChange,
  confirmPasswordPlaceholder,
  confirmPasswordLabel,
  className = '',
  inputClassName = '',
  showRequirements = false,
  showValidationErrors = true,
  disabled = false,
  required = true
}) => {
  const { t } = useTranslation();

  const {
    showPassword,
    showConfirmPassword: showConfirmPasswordVisibility,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    passwordValidation,
    confirmPasswordValidation
  } = usePasswordInput({
    showConfirmPassword,
    onPasswordChange: onChange,
    onConfirmPasswordChange
  });

  const defaultInputClassName = `w-full bg-gray-50 backdrop-blur-sm text-black border-gray-300 rounded-lg px-4 py-4 pl-12 pr-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-300 ${inputClassName}`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Password Input */}
      <div>
        {label && <label className="block text-md text-gray-600 mb-2 font-semibold">{label}</label>}
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={defaultInputClassName}
            placeholder={placeholder || t('auth.placeholder_password')}
            disabled={disabled}
            required={required}
          />
          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600"
            disabled={disabled}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password validation errors */}
        {showValidationErrors && passwordValidation.errors.length > 0 && (
          <div className="mt-2 space-y-1">
            {passwordValidation.errors.map((error, index) => (
              <p key={index} className="text-xs text-red-500">
                • {t(`error.${error}`)}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Password Input */}
      {showConfirmPassword && (
        <div>
          {confirmPasswordLabel && (
            <label className="block text-md text-gray-600 mb-2 font-semibold">{confirmPasswordLabel}</label>
          )}
          <div className="relative">
            <Input
              type={showConfirmPasswordVisibility ? 'text' : 'password'}
              value={confirmPasswordValue}
              onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
              className={defaultInputClassName}
              placeholder={confirmPasswordPlaceholder || t('auth.placeholder_confirm_password')}
              disabled={disabled}
              required={required}
            />
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600"
              disabled={disabled}
            >
              {showConfirmPasswordVisibility ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirm password validation error */}
          {showValidationErrors && confirmPasswordValidation.error && (
            <p className="text-xs text-red-500 mt-2">• {t(`error.${confirmPasswordValidation.error}`)}</p>
          )}
        </div>
      )}

      {/* Password Requirements */}
      {showRequirements && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-semibold mb-2">{t('auth.password_requirements_title')}</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• {t('auth.password_requirement_1')}</li>
            <li>• {t('auth.password_requirement_2')}</li>
            <li>• {t('auth.password_requirement_3')}</li>
            <li>• {t('auth.password_requirement_4')}</li>
          </ul>
        </div>
      )}
    </div>
  );
};
