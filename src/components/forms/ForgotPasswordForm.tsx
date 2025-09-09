import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '@/services/api/authApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('error.fill_all_fields'));
      return;
    }

    if (!validateEmail(email)) {
      toast.error(t('error.invalid_email'));
      return;
    }

    setIsLoading(true);

    const response = await authApi.forgotPassword({ email });

    if (response.success) {
      toast.success(t('success.otp_sent'));

      // Navigate to verify OTP page with email
      navigate('/verify-forgot-password-otp', {
        state: { email }
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">{t('auth.forgot_password_title')}</h1>
        <p className="text-gray-600 text-base">{t('auth.forgot_password_prompt')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.email')}</label>
          <div className="relative">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
              placeholder={t('auth.placeholder_email')}
              required
            />
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 text-base rounded-lg mb-4 disabled:opacity-50 animate-fadeInUp"
          style={{ animationDelay: '0.6s' }}
        >
          {isLoading ? t('auth.sending') : t('auth.send_reset_code')}
        </Button>

        {/* Back to Login */}
        <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('auth.back_to_login')}
          </button>
        </div>
      </form>
    </div>
  );
}
