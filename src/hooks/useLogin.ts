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

  const handleLogin = async (loginData: LoginRequest, rememberMe: boolean = false) => {
    if (!loginData.emailOrUsername || !loginData.password) {
      toast.error(t('error.fill_all_fields'));
      return;
    }

    setIsLoading(true);

    const response = await authApi.login(loginData);

    if (response.success) {
      // Save user to AuthContext
      login(response.data.user);

      // For HTTP-only cookies, tokens are automatically set by the server
      // But we also save to localStorage as fallback for socket connections
      if (response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
      }

      if (rememberMe) {
        localStorage.setItem('userEmailOrUsername', loginData.emailOrUsername);
      }

      // Navigate based on user role and job title
      const userRole = response.data.user.role;

      if (userRole === 'OWNER') {
        console.log('Redirecting owner to /manage/owner');
        navigate('/manage/owner');
      } else if (userRole === 'CUSTOMER') {
        navigate('/customer');
      } else if (userRole === 'STAFF') {
        // For STAFF, we need to check job title to determine the correct dashboard
        // We'll redirect to /home first, then let HomePage handle the specific redirect
        console.log('Redirecting staff to /home (will be redirected to appropriate dashboard)');
        navigate('/home');
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
