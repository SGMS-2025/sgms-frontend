import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { authApi } from '@/services/api/authApi';
import { useAuthActions } from '@/hooks/useAuth';
import type { LoginRequest } from '@/types/api/Auth';

export const useLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthActions();

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (
    loginData: LoginRequest,
    rememberMe: boolean = false,
    selectedRole: 'customer' | 'owner' = 'customer'
  ) => {
    if (!loginData.emailOrUsername || !loginData.password) {
      toast.error(t('error.fill_all_fields'));
      return;
    }

    setIsLoading(true);

    const response = await authApi.login(loginData);

    if (response.success) {
      // Only save user to AuthContext
      login(response.data.user);

      if (rememberMe) {
        localStorage.setItem('userEmailOrUsername', loginData.emailOrUsername);
      }

      // Navigate based on selected role
      if (selectedRole === 'owner') {
        console.log('Redirecting to /manage/owner');
        navigate('/manage/owner');
      } else {
        console.log('Redirecting to /home');
        navigate('/home');
      }
    }

    setIsLoading(false);
  };

  return {
    handleLogin,
    isLoading
  };
};
