import { Button } from '@/components/ui/button';
import { OTPInput } from '@/components/ui/OTPInput';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authApi } from '@/services/api/authApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function VerifyForgotPasswordOTPForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from navigation state
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If no email in state, redirect back to forgot password
      navigate('/forgot-password');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    // Start countdown for resend button
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOTPComplete = (otp: string) => {
    setOtpCode(otp);
  };

  const validateOTP = (otp: string) => {
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      toast.error(t('error.enter_full_otp'));
      return;
    }

    if (!validateOTP(otpCode)) {
      toast.error(t('error.invalid_otp_format'));
      return;
    }

    setIsLoading(true);

    // Verify OTP with backend
    const response = await authApi.verifyForgotPasswordOTP({
      email,
      otpCode
    });

    if (response.success) {
      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 700));

      // Show success toast after loading
      toast.success(t('success.otp_verified'));

      // Navigate to reset password page with email and OTP
      navigate('/reset-password', {
        state: { email, otpCode }
      });
    }

    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsResending(true);

    const response = await authApi.resendForgotPasswordOTP({ email });

    if (response.success) {
      toast.success(t('success.otp_resent'));
      setCountdown(60);
      setOtpCode('');
    }

    setIsResending(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">{t('auth.verify_otp_title')}</h1>
        <p className="text-gray-600 text-base">{t('auth.verify_otp_prompt')}</p>
        <p className="text-sm text-gray-500 mt-2">
          {t('auth.otp_sent_to')} <span className="font-semibold text-orange-500">{email}</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* OTP Code Field */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.otp_code')}</label>
          <OTPInput
            onComplete={handleOTPComplete}
            showInfo={true}
            infoText={t('auth.otp_help_text')}
            showProgress={true}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || otpCode.length !== 6}
          className={`w-full font-semibold py-4 text-base rounded-lg mb-4 animate-fadeInUp ${
            isLoading || otpCode.length !== 6
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
          style={{ animationDelay: '0.6s' }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('auth.verifying')}
            </>
          ) : (
            t('auth.verify_otp')
          )}
        </Button>

        {/* Resend OTP */}
        <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
          <p className="text-sm text-gray-600 mb-2">{t('auth.didnt_receive_code')}</p>
          <Button
            type="button"
            variant="outline"
            onClick={handleResendOTP}
            disabled={countdown > 0 || isResending}
            className="text-orange-500 border-orange-500 hover:bg-orange-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
            {countdown > 0
              ? t('auth.resend_in', { seconds: countdown })
              : isResending
                ? t('auth.resending')
                : t('auth.resend_otp')}
          </Button>
        </div>

        {/* Back to Forgot Password */}
        <div className="text-center animate-fadeInUp" style={{ animationDelay: '1.0s' }}>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('auth.back_to_forgot_password')}
          </button>
        </div>
      </form>
    </div>
  );
}
