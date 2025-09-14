import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useState } from 'react';
import { authApi } from '@/services/api/authApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { validateChangePasswordForm } from '@/utils/authValidation';

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const validation = validateChangePasswordForm(formData);

    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(t(`error.${error}`));
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const response = await authApi.changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmNewPassword: formData.confirmNewPassword
    });

    if (response.success) {
      toast.success(t('success.password_changed_success'));

      // Clear form after successful password change
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">{t('auth.change_password_title')}</h1>
        <p className="text-gray-600 text-base">{t('auth.change_password_prompt')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <PasswordInput
            value={formData.currentPassword}
            onChange={(value) => handleInputChange('currentPassword', value)}
            label={t('auth.current_password')}
            placeholder={t('auth.placeholder_current_password')}
            showValidationErrors={false}
            required={true}
          />
        </div>

        {/* New Password */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
          <PasswordInput
            value={formData.newPassword}
            onChange={(value) => handleInputChange('newPassword', value)}
            label={t('auth.new_password')}
            placeholder={t('auth.placeholder_new_password')}
            showValidationErrors={false}
            required={true}
          />
        </div>

        {/* Confirm New Password */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          <PasswordInput
            value={formData.confirmNewPassword}
            onChange={(value) => handleInputChange('confirmNewPassword', value)}
            label={t('auth.confirm_new_password')}
            placeholder={t('auth.placeholder_confirm_new_password')}
            showValidationErrors={false}
            required={true}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 text-base rounded-lg mb-4 disabled:opacity-50 animate-fadeInUp"
          style={{ animationDelay: '0.8s' }}
        >
          {isLoading ? t('auth.changing') : t('auth.change_password')}
        </Button>
      </form>
    </div>
  );
}
