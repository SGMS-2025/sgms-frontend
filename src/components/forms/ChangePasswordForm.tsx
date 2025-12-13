import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useState, useMemo } from 'react';
import { authApi } from '@/services/api/authApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { validateChangePasswordForm } from '@/utils/authValidation';
import { Shield, CheckCircle2, AlertCircle, Mail, Send } from 'lucide-react';
import { useUser } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const user = useUser();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const passwordChecks = useMemo(
    () => [
      { label: t('auth.password_check_min_length'), passed: formData.newPassword.length >= 12 },
      {
        label: t('auth.password_check_uppercase_lowercase'),
        passed: /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword)
      },
      { label: t('auth.password_check_number'), passed: /\d/.test(formData.newPassword) },
      { label: t('auth.password_check_special'), passed: /[^A-Za-z0-9]/.test(formData.newPassword) }
    ],
    [formData.newPassword, t]
  );
  const passedChecks = passwordChecks.filter((item) => item.passed).length;
  const hasMismatch = formData.confirmNewPassword.length > 0 && formData.confirmNewPassword !== formData.newPassword;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendForgotOtp = async () => {
    if (!user?.email) {
      toast.error(t('error.user_not_found'));
      return;
    }

    setIsSendingOtp(true);
    const response = await authApi.forgotPassword({ email: user.email });

    if (response.success) {
      toast.success(t('success.otp_sent'));
      setIsForgotOpen(false);
    }

    setIsSendingOtp(false);
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
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5 flex items-start gap-3 justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-orange-100 p-2">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500">{t('auth.account_protection')}</p>
            <h2 className="text-lg font-semibold text-gray-900">{t('auth.change_password_title')}</h2>
            <p className="text-sm text-gray-600">{t('auth.change_password_prompt')}</p>
          </div>
        </div>
        <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50">
              {t('auth.forgot_password_question')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                {t('auth.reset_password_title')}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-xs font-semibold border border-orange-100">
                  {t('auth.step_one_of_three')}
                </span>
                {t('auth.reset_password_dialog_description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-800">{t('auth.email_receive_otp')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <Input
                  value={user?.email || ''}
                  readOnly
                  className="pl-9"
                  placeholder={t('auth.placeholder_email_missing')}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{t('auth.otp_expire_notice')}</span>
              </div>
              <div className="flex gap-3">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1 border-gray-200 hover:bg-gray-50">
                    {t('common.cancel')}
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleSendForgotOtp}
                  disabled={isSendingOtp}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  {isSendingOtp ? t('auth.sending') : t('auth.send_otp')}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5 space-y-4">
          <PasswordInput
            value={formData.currentPassword}
            onChange={(value) => handleInputChange('currentPassword', value)}
            label={t('auth.current_password')}
            placeholder={t('auth.placeholder_current_password')}
            showValidationErrors={false}
            required={true}
          />

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
              <span>{t('error.password_confirm_mismatch')}</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Shield className="w-4 h-4 text-orange-500" />
              {t('auth.password_strength')}
            </div>
            <span className="text-sm text-gray-600">
              {t('auth.password_criteria_progress', { count: passedChecks })}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all"
              style={{ width: `${(passedChecks / 4) * 100}%` }}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {passwordChecks.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-2 ${
                  item.passed
                    ? 'border-green-100 bg-green-50 text-green-700'
                    : 'border-gray-100 bg-gray-50 text-gray-700'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${item.passed ? 'text-green-500' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {isLoading ? t('auth.changing') : t('auth.change_password')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() =>
              setFormData({
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
              })
            }
            className="flex-1 border-gray-200 hover:bg-gray-50"
          >
            {t('auth.reset_form')}
          </Button>
        </div>
      </form>
    </div>
  );
}
