import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, User, Crown, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '@/hooks/useLogin';
import type { LoginRequest } from '@/types/api/Auth';
import { FORM_ANIMATION_DELAYS as ANIMATION_DELAYS } from '@/constants/animations';

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'owner'>('customer');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { handleLogin, isLoading } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loginData: LoginRequest = {
      emailOrUsername,
      password
    };

    await handleLogin(loginData, rememberMe, selectedRole);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 animate-fadeInUp" style={{ animationDelay: ANIMATION_DELAYS.HEADER }}>
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">{t('auth.login_title')}</h1>
        <p className="text-gray-600 text-base">{t('auth.login_prompt')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection */}
        <div className="animate-fadeInUp" style={{ animationDelay: ANIMATION_DELAYS.ROLE_SELECTION }}>
          <p className="text-md text-gray-600 mb-3 font-semibold">{t('auth.login_role')}</p>
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
            {t('auth.role_selection_warning')}
          </p>
        </div>

        {/* Input Fields */}
        <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: ANIMATION_DELAYS.INPUT_FIELDS }}>
          {/* Email or Username Field */}
          <div>
            <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.email_or_username')}</label>
            <div className="relative">
              <Input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
                placeholder={t('auth.placeholder_email_or_username')}
                required
              />
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-md text-gray-600 mb-2 font-semibold">{t('auth.password')}</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 backdrop-blur-sm text-black border-gray-300 rounded-lg px-4 py-4 pl-12 pr-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-300"
                placeholder={t('auth.placeholder_password')}
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
        </div>

        {/* Remember Me & Forgot Password */}
        <div
          className="flex items-center justify-between mb-4 animate-fadeInUp"
          style={{ animationDelay: ANIMATION_DELAYS.REMEMBER_ME }}
        >
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-gray-300"
            />
            <label htmlFor="remember" className="text-sm text-gray-600">
              {t('auth.remember_me')}
            </label>
          </div>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-orange-500 hover:text-orange-400"
          >
            {t('auth.forgot_pass')}
          </button>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 text-base rounded-lg mb-4 disabled:opacity-50 animate-fadeInUp"
          style={{ animationDelay: ANIMATION_DELAYS.LOGIN_BUTTON }}
        >
          {isLoading ? t('auth.logging_in') : t('auth.login_title')}
        </Button>

        {/* Divider */}
        <div className="flex items-center mb-4 animate-fadeInUp" style={{ animationDelay: ANIMATION_DELAYS.DIVIDER }}>
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-base text-gray-600">{t('auth.or')}</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Zalo Login */}
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL}/auth/zalo/login`)}
          className="w-full bg-white/20 backdrop-blur-sm text-white border-gray-300 py-4 rounded-lg mb-4 hover:bg-white/30 flex items-center justify-center animate-fadeInUp"
          style={{ animationDelay: ANIMATION_DELAYS.ZALO_LOGIN }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="#0068ff">
            <circle cx="12" cy="12" r="10" />
            <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">
              Z
            </text>
          </svg>
          <span className="text-sm text-gray-600 ml-2">Zalo</span>
        </Button>

        {/* Register Link */}
        <p
          className="text-center text-sm text-gray-500 animate-fadeInUp"
          style={{ animationDelay: ANIMATION_DELAYS.REGISTER_LINK }}
        >
          {t('auth.no_account_prompt')}{' '}
          <a href="/register" className="text-orange-500 hover:text-orange-400">
            {t('auth.register_now')}
          </a>
        </p>
      </form>
    </div>
  );
}
