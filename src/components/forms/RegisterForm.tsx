import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { User, Crown, Phone, Mail, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '@/services/api/authApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { validateRegistrationForm } from '@/utils/authValidation';
import type { RegisterRequest } from '@/types/api/Auth';
import { FORM_ANIMATION_DELAYS as ANIMATION_DELAYS } from '@/constants/animations';

export function RegisterForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<'customer' | 'owner'>('customer');
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const validation = validateRegistrationForm({
      ...formData,
      agreeTerms
    });

    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(t(`error.${error}`));
      });
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const registerData: RegisterRequest = {
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: selectedRole
    };

    const response = await authApi.register(registerData);

    if (response.success) {
      toast.success(t('success.otp_sent'));

      // Navigate to verify OTP page with email
      navigate('/verify-otp', {
        state: { email: formData.email }
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 animate-fadeInUp" style={{ animationDelay: ANIMATION_DELAYS.HEADER }}>
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">{t('auth.register_title')}</h1>
        <p className="text-gray-600 text-base">{t('auth.register_prompt')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Role Selection */}
        <div className="animate-fadeInUp" style={{ animationDelay: ANIMATION_DELAYS.ROLE_SELECTION }}>
          <p className="text-md text-gray-600 mb-3 font-semibold">{t('auth.register_role')}</p>
          <div className="flex space-x-2">
            <Button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className={`flex-1 rounded-lg py-4 text-base ${
                selectedRole === 'customer'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
              }`}
            >
              <User className="w-5 h-5 mr-2" />
              {t('auth.customer')}
            </Button>
            <Button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`flex-1 rounded-lg py-4 text-base ${
                selectedRole === 'owner'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
              }`}
            >
              <Crown className="w-5 h-5 mr-2" />
              {t('auth.owner')}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1 md:mt-2 flex items-center">
            <span className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
              i
            </span>
            {t('auth.role_change_warning')}
          </p>
        </div>

        {/* Input Fields */}
        <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: ANIMATION_DELAYS.INPUT_FIELDS }}>
          {/* Row 1: Username and Full Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.username')}</label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
                  placeholder={t('auth.placeholder_username')}
                  required
                />
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.full_name')}</label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
                  placeholder={t('auth.placeholder_full_name')}
                  required
                />
                <UserCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Row 2: Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.email')}</label>
              <div className="relative">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
                  placeholder={t('auth.placeholder_email')}
                  required
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.phone_number')}</label>
              <div className="relative">
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
                  placeholder={t('auth.placeholder_phone')}
                  required
                />
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Row 3: Password Fields */}
          <div>
            <PasswordInput
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              label={t('auth.password')}
              placeholder={t('auth.placeholder_password')}
              showConfirmPassword={true}
              confirmPasswordValue={formData.confirmPassword}
              onConfirmPasswordChange={(value) => handleInputChange('confirmPassword', value)}
              confirmPasswordLabel={t('auth.confirm_password')}
              confirmPasswordPlaceholder={t('auth.placeholder_confirm_password')}
              showRequirements={false}
              showValidationErrors={false}
            />
          </div>
        </div>

        {/* Terms Agreement */}
        <div
          className="flex items-center mb-4 animate-fadeInUp"
          style={{ animationDelay: ANIMATION_DELAYS.TERMS_AGREEMENT }}
        >
          <Checkbox
            id="terms"
            checked={agreeTerms}
            onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
            className="border-gray-300"
          />
          <label htmlFor="terms" className="text-sm text-gray-600 ml-2">
            {t('auth.terms_agreement')}{' '}
            <a href="#" className="text-orange-500 hover:text-orange-400">
              {t('auth.terms_of_use')}
            </a>{' '}
            {t('auth.and')}{' '}
            <a href="#" className="text-orange-500 hover:text-orange-400">
              {t('auth.privacy_policy')}
            </a>
          </label>
        </div>

        {/* Register Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 text-base rounded-lg mb-4 disabled:opacity-50 animate-fadeInUp"
          style={{ animationDelay: ANIMATION_DELAYS.REGISTER_BUTTON }}
        >
          {isLoading ? t('auth.registering') : t('auth.register')}
        </Button>

        {/* Divider */}
        <div className="flex items-center mb-4 animate-fadeInUp" style={{ animationDelay: ANIMATION_DELAYS.DIVIDER }}>
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-base text-gray-600">{t('auth.or')}</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Login Link */}
        <p
          className="text-center text-sm text-gray-500 animate-fadeInUp"
          style={{ animationDelay: ANIMATION_DELAYS.LOGIN_LINK }}
        >
          {t('auth.have_account')}{' '}
          <a href="/login" className="text-orange-500 hover:text-orange-400">
            {t('auth.login_now')}
          </a>
        </p>
      </form>
    </div>
  );
}
