import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Input } from '@/components/ui/input';
import { useMemo, useState } from 'react';
import { authApi } from '@/services/api/authApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/useAuth';
import { Shield, Mail, KeyRound, CheckCircle2, AlertCircle, Clock3 } from 'lucide-react';
import { validateChangePasswordForm } from '@/utils/authValidation';

type ResetStep = 'init' | 'otp' | 'reset';

export function ResetPasswordFormForAuthenticated() {
  const { t } = useTranslation();
  const user = useUser();
  const [step, setStep] = useState<ResetStep>('init');
  const [otpCode, setOtpCode] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'otpCode') {
      setOtpCode(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSendOTP = async () => {
    if (!user?.email) {
      toast.error(t('error.user_not_found'));
      return;
    }

    setIsLoading(true);
    const response = await authApi.forgotPassword({ email: user.email });

    if (response.success) {
      toast.success(t('success.otp_sent'));
      setStep('otp');
    }

    setIsLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!user?.email) {
      toast.error(t('error.user_not_found'));
      return;
    }

    if (!otpCode) {
      toast.error(t('error.fill_all_fields'));
      return;
    }

    setIsLoading(true);
    const response = await authApi.verifyForgotPasswordOTP({
      email: user.email,
      otpCode
    });

    if (response.success) {
      toast.success(t('success.otp_verified'));
      setStep('reset');
    }

    setIsLoading(false);
  };

  const validateForm = () => {
    const validation = validateChangePasswordForm({
      currentPassword: '', // Not needed for reset
      newPassword: formData.newPassword,
      confirmNewPassword: formData.confirmNewPassword
    });

    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(t(`error.${error}`));
      });
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      toast.error(t('error.user_not_found'));
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const response = await authApi.resetPassword({
      email: user.email,
      otpCode,
      newPassword: formData.newPassword
    });

    if (response.success) {
      toast.success(t('success.password_reset_success'));

      // Reset form
      setStep('init');
      setOtpCode('');
      setFormData({
        newPassword: '',
        confirmNewPassword: ''
      });
    }

    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    if (!user?.email) {
      toast.error(t('error.user_not_found'));
      return;
    }

    setIsLoading(true);
    const response = await authApi.resendForgotPasswordOTP({ email: user.email });

    if (response.success) {
      toast.success(t('success.otp_sent'));
      setOtpCode(''); // Clear OTP input
    }

    setIsLoading(false);
  };

  const passwordChecks = useMemo(
    () => [
      { label: 'Tối thiểu 12 ký tự', passed: formData.newPassword.length >= 12 },
      {
        label: 'Có chữ hoa và chữ thường',
        passed: /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword)
      },
      { label: 'Chứa số', passed: /\d/.test(formData.newPassword) },
      { label: 'Có ký tự đặc biệt', passed: /[^A-Za-z0-9]/.test(formData.newPassword) }
    ],
    [formData.newPassword]
  );
  const passedChecks = passwordChecks.filter((item) => item.passed).length;
  const hasMismatch = formData.confirmNewPassword.length > 0 && formData.confirmNewPassword !== formData.newPassword;

  return (
    <div className="w-full space-y-5">
      {/* Step 1: Init - Send OTP */}
      {step === 'init' && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-orange-100 p-2">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-gray-500">Bước 1/3</p>
              <h3 className="text-lg font-semibold text-gray-900">Đặt lại mật khẩu</h3>
              <p className="text-sm text-gray-600">Chúng tôi sẽ gửi mã OTP đến email để xác thực yêu cầu đặt lại.</p>
              <div className="flex items-center gap-2 text-sm text-gray-700 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <Mail className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{user?.email}</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSendOTP}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl"
          >
            {isLoading ? t('auth.sending') : 'Gửi mã OTP'}
          </Button>
        </div>
      )}

      {/* Step 2: Verify OTP */}
      {step === 'otp' && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-orange-100 p-2">
              <KeyRound className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-gray-500">Bước 2/3</p>
              <h3 className="text-lg font-semibold text-gray-900">Nhập mã OTP</h3>
              <p className="text-sm text-gray-600">Vui lòng nhập mã OTP 6 chữ số đã gửi tới email của bạn.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Mã OTP</label>
            <Input
              type="text"
              value={otpCode}
              onChange={(e) => handleInputChange('otpCode', e.target.value)}
              placeholder="Nhập mã OTP 6 chữ số"
              className="w-full text-center tracking-[0.4em] text-lg py-3"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('init');
                setOtpCode('');
              }}
              className="flex-1 border-gray-200 hover:bg-gray-50"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={handleVerifyOTP}
              disabled={isLoading || !otpCode}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isLoading ? t('auth.verifying') : 'Xác nhận OTP'}
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock3 className="w-4 h-4" />
              Mã hết hạn sau 5 phút
            </span>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="text-orange-600 hover:text-orange-700 font-semibold disabled:opacity-50"
            >
              Gửi lại mã OTP
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Reset Password */}
      {step === 'reset' && (
        <form
          onSubmit={handleResetPassword}
          className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-orange-100 p-2">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-gray-500">Bước 3/3</p>
              <h3 className="text-lg font-semibold text-gray-900">Đặt mật khẩu mới</h3>
              <p className="text-sm text-gray-600">
                Chọn mật khẩu mới đủ mạnh và khác mật khẩu cũ để bảo vệ tài khoản.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordInput
              value={formData.newPassword}
              onChange={(value) => handleInputChange('newPassword', value)}
              label={t('auth.new_password')}
              placeholder={t('auth.placeholder_new_password')}
              showValidationErrors={false}
              required={true}
            />

            <PasswordInput
              value={formData.confirmNewPassword}
              onChange={(value) => handleInputChange('confirmNewPassword', value)}
              label={t('auth.confirm_new_password')}
              placeholder={t('auth.placeholder_confirm_new_password')}
              showValidationErrors={false}
              required={true}
            />
          </div>

          {hasMismatch && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4" />
              <span>Mật khẩu xác nhận chưa trùng khớp.</span>
            </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <CheckCircle2 className="w-4 h-4 text-orange-500" />
              Yêu cầu bảo mật
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {passwordChecks.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-2 ${
                    item.passed
                      ? 'border-green-100 bg-green-50 text-green-700'
                      : 'border-gray-100 bg-white text-gray-700'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${item.passed ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all"
                style={{ width: `${(passedChecks / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('otp');
                setFormData({
                  newPassword: '',
                  confirmNewPassword: ''
                });
              }}
              className="flex-1 border-gray-200 hover:bg-gray-50"
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isLoading ? t('auth.resetting') : 'Đặt lại mật khẩu'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
