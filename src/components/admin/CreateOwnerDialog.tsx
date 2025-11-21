import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { User, Mail, Phone, UserCheck } from 'lucide-react';
import {
  validateUsername,
  validateEmail,
  validatePasswordStrength,
  validatePhoneNumber,
  validateFullName
} from '@/utils/authValidation';
import { userApi } from '@/services/api/userApi';
import { toast } from 'sonner';
import { extractAndTranslateApiError } from '@/utils/errorHandler';
import type { User as UserType } from '@/types/api/User';

interface CreateOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (owner: UserType) => void;
}

export const CreateOwnerDialog: React.FC<CreateOwnerDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate username
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid && usernameValidation.error) {
      newErrors.username = usernameValidation.error;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid && emailValidation.error) {
      newErrors.email = emailValidation.error;
    }

    // Validate password
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0] || 'password_invalid';
    }

    // Validate full name (optional but if provided, should be valid)
    if (formData.fullName) {
      const fullNameValidation = validateFullName(formData.fullName);
      if (!fullNameValidation.isValid && fullNameValidation.error) {
        newErrors.fullName = fullNameValidation.error;
      }
    }

    // Validate phone number (optional but if provided, should be valid)
    if (formData.phoneNumber) {
      const phoneValidation = validatePhoneNumber(formData.phoneNumber);
      if (!phoneValidation.isValid && phoneValidation.error) {
        newErrors.phoneNumber = phoneValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Show first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(t(`error.${firstError}`));
      }
      return;
    }

    setIsLoading(true);

    const response = await userApi.createOwnerAccount({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName || undefined,
      phoneNumber: formData.phoneNumber || undefined
    });

    if (response.success && response.data) {
      toast.success(t('admin.accounts.create.success'));
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: ''
      });
      setErrors({});
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(response.data);
      }
    } else {
      // Handle error response (409 conflict or other errors)
      // API interceptor returns error object, doesn't throw
      const errorMessage = extractAndTranslateApiError(response, t, 'admin.accounts.create.failed');
      toast.error(errorMessage);
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: ''
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('admin.accounts.create.title')}</DialogTitle>
          <DialogDescription>{t('admin.accounts.create.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.username')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full ${errors.username ? 'border-red-500' : ''}`}
                placeholder={t('auth.placeholder_username')}
                required
                disabled={isLoading}
              />
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            {errors.username && <p className="mt-1 text-sm text-red-500">{t(`error.${errors.username}`)}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.email')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder={t('auth.placeholder_email')}
                required
                disabled={isLoading}
              />
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-500">{t(`error.${errors.email}`)}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.password')} <span className="text-red-500">*</span>
            </label>
            <PasswordInput
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              placeholder={t('auth.placeholder_password')}
              showRequirements={false}
              showValidationErrors={false}
              disabled={isLoading}
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{t(`error.${errors.password}`)}</p>}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.full_name')}</label>
            <div className="relative">
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full ${errors.fullName ? 'border-red-500' : ''}`}
                placeholder={t('auth.placeholder_full_name')}
                disabled={isLoading}
              />
              <UserCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            {errors.fullName && <p className="mt-1 text-sm text-red-500">{t(`error.${errors.fullName}`)}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.phone_number')}</label>
            <div className="relative">
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className={`w-full ${errors.phoneNumber ? 'border-red-500' : ''}`}
                placeholder={t('auth.placeholder_phone')}
                disabled={isLoading}
              />
              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{t(`error.${errors.phoneNumber}`)}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
              {isLoading ? t('common.creating') : t('admin.accounts.create.button')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
