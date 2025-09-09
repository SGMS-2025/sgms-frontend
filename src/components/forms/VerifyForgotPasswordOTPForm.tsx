import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { authApi } from '@/services/api/authApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function VerifyForgotPasswordOTPForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(0, 1);

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = digit;
    setOtpDigits(newOtpDigits);

    // Auto focus to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtpDigits = [...otpDigits];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtpDigits[i] = pastedData[i];
    }

    setOtpDigits(newOtpDigits);

    // Focus on the next empty input or the last input
    const nextEmptyIndex = newOtpDigits.findIndex((digit) => digit === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const otpCode = otpDigits.join('');

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
      // Clear OTP inputs
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
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
        {/* OTP Code Field - 6 separate inputs */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.otp_code')}</label>
          <div className="flex justify-center space-x-3 mb-2">
            {otpDigits.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-14 h-14 bg-white text-gray-900 border-gray-300 rounded-lg text-center text-2xl font-bold font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                maxLength={1}
                required
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center justify-center">
            <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
              i
            </span>
            {t('auth.otp_help_text')}
          </p>
          {otpCode.length > 0 && otpCode.length < 6 && (
            <p className="text-xs text-orange-500 mt-1 text-center">
              {t('auth.enter_remaining_digits', { remaining: 6 - otpCode.length })}
            </p>
          )}
          {otpCode.length === 6 && (
            <p className="text-xs text-green-500 mt-1 text-center font-semibold">✓ {t('auth.otp_complete')}</p>
          )}
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
