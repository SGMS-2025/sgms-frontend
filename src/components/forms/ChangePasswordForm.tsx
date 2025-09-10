import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '@/services/api/authApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { validatePasswordResetForm } from '@/utils/authValidation';

export function ChangePasswordForm() {
  const navigate = useNavigate();
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
    const { currentPassword, newPassword, confirmNewPassword } = formData;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error(t('error.fill_all_fields'));
      return false;
    }

    if (currentPassword === newPassword) {
      toast.error(t('error.same_password'));
      return false;
    }

    // Validate new password and confirm password
    const validation = validatePasswordResetForm({
      newPassword,
      confirmPassword: confirmNewPassword
    });

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

      // Navigate back to profile
      navigate('/profile', {
        state: { message: t('success.password_changed_success') }
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-8">
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

        {/* Password Requirements */}
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-fadeInUp"
          style={{ animationDelay: '0.7s' }}
        >
          <p className="text-sm text-blue-800 font-semibold mb-2">{t('auth.password_requirements_title')}</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• {t('auth.password_requirement_1')}</li>
            <li>• {t('auth.password_requirement_2')}</li>
            <li>• {t('auth.password_requirement_3')}</li>
            <li>• {t('auth.password_requirement_4')}</li>
          </ul>
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

        {/* Back to Profile */}
        <div className="text-center animate-fadeInUp" style={{ animationDelay: '1.0s' }}>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('auth.back_to_profile')}
          </button>
        </div>
      </form>
    </div>
  );
}
