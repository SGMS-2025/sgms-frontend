import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, User, Crown, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/services/api/authApi';
import { useNavigate } from 'react-router-dom';
import { useAuthActions } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { LoginRequest } from '@/types/api/Auth';

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'owner'>('customer');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuthActions();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrUsername || !password) {
      toast.error(t('error.fill_all_fields'));
      return;
    }

    setIsLoading(true);

    const loginData: LoginRequest = {
      emailOrUsername,
      password
    };

    const response = await authApi.login(loginData);

    // Check if response is successful
    if (response.success) {
      // Only save user to AuthContext
      login(response.data.user);

      if (rememberMe) {
        localStorage.setItem('userEmailOrUsername', emailOrUsername);
      }

      // Navigate to home page
      navigate('/home');
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">{t('auth.login_title')}</h1>
        <p className="text-gray-600 text-base">{t('auth.login_prompt')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Role Selection */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
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
        <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
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
        <div className="flex items-center justify-between mb-4 animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
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
          style={{ animationDelay: '1.0s' }}
        >
          {isLoading ? t('auth.logging_in') : t('auth.login_title')}
        </Button>

        {/* Divider */}
        <div className="flex items-center mb-4 animate-fadeInUp" style={{ animationDelay: '1.2s' }}>
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-base text-gray-600">{t('auth.or')}</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Login */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white/20 backdrop-blur-sm text-white border-gray-300 py-4 rounded-lg mb-4 hover:bg-white/30 flex items-center justify-center animate-fadeInUp"
          style={{ animationDelay: '1.4s' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm text-gray-600 ml-2">Google</span>
        </Button>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-500 animate-fadeInUp" style={{ animationDelay: '1.6s' }}>
          {t('auth.no_account_prompt')}{' '}
          <a href="/register" className="text-orange-500 hover:text-orange-400">
            {t('auth.register_now')}
          </a>
        </p>
      </form>
    </div>
  );
}
