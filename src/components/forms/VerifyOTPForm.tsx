import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OTPInput } from '@/components/ui/OTPInput';
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
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleOTPComplete = (otp: string) => {
    setOtpCode(otp);
  };

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
      setOtpCode('');
    }

    setIsResending(false);
  };

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

        {/* OTP Code Field */}
        <div>
          <label className="block text-sm text-gray-600 mb-2 font-semibold">{t('auth.otp_code')}</label>
          <OTPInput onComplete={handleOTPComplete} showInfo={true} showProgress={true} />
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
