import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authApi } from '@/services/api/authApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const { newPassword, confirmPassword } = formData;

    if (!newPassword || !confirmPassword) {
      toast.error(t('error.fill_all_fields'));
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('error.password_mismatch'));
      return false;
    }

    // Check password strength according to backend requirements
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (newPassword.length < 8) {
      toast.error(t('error.password_min_length'));
      return false;
    }

    if (!strongPasswordRegex.test(newPassword)) {
      toast.error(t('error.password_requirements'));
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
        <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          {/* New Password */}
          <div>
            <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.new_password')}</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className="w-full bg-gray-50 backdrop-blur-sm text-black border-gray-300 rounded-lg px-4 py-4 pl-12 pr-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-300"
                placeholder={t('auth.placeholder_new_password')}
                required
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.confirm_new_password')}</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full bg-gray-50 backdrop-blur-sm text-black border-gray-300 rounded-lg px-4 py-4 pl-12 pr-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-300"
                placeholder={t('auth.placeholder_confirm_new_password')}
                required
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Password Requirements */}
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-fadeInUp"
          style={{ animationDelay: '0.6s' }}
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
