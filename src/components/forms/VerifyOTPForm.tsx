import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail } from 'lucide-react';
import { authApi } from '@/services/api/authApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { VerifyOTPRequest } from '@/types/api/Auth';

const VerifyOTPForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Get email from location state (passed from register form) or allow manual input
  const [email, setEmail] = useState(location.state?.email || '');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('error.enter_email'));
      return;
    }

    if (otpCode.length !== 6) {
      toast.error(t('error.enter_full_otp'));
      return;
    }

    setIsVerifying(true);

    const verifyData: VerifyOTPRequest = {
      email,
      otpCode
    };

    const response = await authApi.verifyOTP(verifyData);

    if (response.success) {
      toast.success(t('success.otp_verified'));

      // Redirect to login page after successful verification
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }

    setIsVerifying(false);
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error(t('error.enter_email_before_resend'));
      return;
    }

    setIsResending(true);

    const response = await authApi.resendOTP({ email });

    if (response.success) {
      toast.success(t('success.otp_resent'));
      // Clear OTP inputs
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }

    setIsResending(false);
  };

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">{t('auth.verify_otp_title')}</h1>
        <p className="text-gray-600 text-base">{t('auth.verify_otp_prompt')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleVerifyOTP} className="space-y-4">
        {/* Email Display/Input */}
        <div>
          <label className="block text-sm text-gray-600 mb-2 font-semibold">{t('auth.email')}</label>
          {email ? (
            <div className="bg-orange-100 rounded-lg px-4 py-4 flex items-center">
              <Mail className="w-5 h-5 text-orange-500 mr-3" />
              <span className="text-orange-700 text-base font-medium">{email}</span>
            </div>
          ) : (
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
          )}
        </div>

        {/* OTP Code Field - 6 separate inputs */}
        <div>
          <label className="block text-sm text-gray-600 mb-2 font-semibold">{t('auth.otp_code')}</label>
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
            {t('auth.otp_info')}
          </p>
        </div>

        {/* Verify Button */}
        <Button
          type="submit"
          disabled={isVerifying || otpCode.length !== 6}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 text-base rounded-lg mb-4 disabled:opacity-50"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('auth.verifying')}
            </>
          ) : (
            t('auth.verify_otp')
          )}
        </Button>

        {/* Divider */}
        <div className="flex items-center mb-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-base text-gray-600">{t('auth.or')}</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Info Text */}
        <p className="text-center text-sm text-gray-500">
          {t('auth.not_received')}{' '}
          <button
            onClick={handleResendOTP}
            className="text-orange-500 hover:text-orange-400 underline"
            disabled={isResending}
          >
            {isResending ? t('auth.resending') : t('auth.resend')}
          </button>
        </p>
      </form>
    </div>
  );
};

export default VerifyOTPForm;
