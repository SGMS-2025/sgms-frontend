import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { userApi } from '@/services/api/userApi';
import { useAuthActions } from '@/hooks/useAuth';

export const useZaloCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthActions();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  const status = searchParams.get('status');
  const message = searchParams.get('message');

  const finalizeLogin = async () => {
    setIsLoading(true);
    setError(null);

    const profileResponse = await userApi.getProfile();

    if (profileResponse.success) {
      login(profileResponse.data);
      toast.success(t('auth.welcome_back'));
      navigate('/', { replace: true });
    } else {
      setError(profileResponse.message || t('auth.load_profile_error'));
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    finalizeLogin();
  };

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasProcessedRef.current) return;

    if (status === 'error') {
      setError(message || t('auth.zalo_login_error'));
      setIsLoading(false);
      hasProcessedRef.current = true;
      return;
    }

    if (status === 'success') {
      hasProcessedRef.current = true;
      finalizeLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, message]);

  return {
    isLoading,
    error,
    handleRetry
  };
};
