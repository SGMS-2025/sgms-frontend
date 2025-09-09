import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authApi } from '@/services/api/authApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { validatePasswordResetForm } from '@/utils/validation';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    // Get email and OTP from navigation state
    if (location.state?.email && location.state?.otpCode) {
      setEmail(location.state.email);
      setOtpCode(location.state.otpCode);
    } else {
      // If no data in state, redirect back to forgot password
      navigate('/forgot-password');
    }
  }, [location.state, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const validation = validatePasswordResetForm(formData);

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

    const response = await authApi.resetPassword({
      email,
      otpCode,
      newPassword: formData.newPassword
    });

    if (response.success) {
      toast.success(t('success.password_reset_success'));

      // Navigate to login page
      navigate('/login', {
        state: { message: t('success.password_reset_success') }
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">{t('auth.reset_password_title')}</h1>
        <p className="text-gray-600 text-base">{t('auth.reset_password_prompt')}</p>
        <p className="text-sm text-gray-500 mt-2">
          {t('auth.reset_for')} <span className="font-semibold text-orange-500">{email}</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password Fields */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <PasswordInput
            value={formData.newPassword}
            onChange={(value) => handleInputChange('newPassword', value)}
            label={t('auth.new_password')}
            placeholder={t('auth.placeholder_new_password')}
            showConfirmPassword={true}
            confirmPasswordValue={formData.confirmPassword}
            onConfirmPasswordChange={(value) => handleInputChange('confirmPassword', value)}
            confirmPasswordLabel={t('auth.confirm_new_password')}
            confirmPasswordPlaceholder={t('auth.placeholder_confirm_new_password')}
            showRequirements={false}
            showValidationErrors={false}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 text-base rounded-lg mb-4 disabled:opacity-50 animate-fadeInUp"
          style={{ animationDelay: '0.8s' }}
        >
          {isLoading ? t('auth.resetting') : t('auth.reset_password')}
        </Button>

        {/* Back to Verify OTP */}
        <div className="text-center animate-fadeInUp" style={{ animationDelay: '1.0s' }}>
          <button
            type="button"
            onClick={() => navigate('/verify-forgot-password-otp', { state: { email } })}
            className="flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('auth.back_to_verify_otp')}
          </button>
        </div>
      </form>
    </div>
  );
}
