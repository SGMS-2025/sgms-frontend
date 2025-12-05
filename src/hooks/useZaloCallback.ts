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

    try {
      // Đợi cookies được browser lưu sau cross-origin redirect
      // Đặc biệt quan trọng với cross-origin redirect (gymsmart.site → gym1smart.io.vn)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const profileResponse = await userApi.getProfile();

      if (profileResponse.success) {
        login(profileResponse.data);
        toast.success(t('auth.welcome_back'));
        navigate('/', { replace: true });
      } else {
        // Nếu lỗi 401, có thể cookies chưa được set - thử lại sau delay dài hơn
        // Check if response has error property (might be ApiErrorResponse)
        const errorResponse = profileResponse as unknown as { error?: { statusCode?: number } };
        if (errorResponse.error?.statusCode === 401) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const retryResponse = await userApi.getProfile();

          if (retryResponse.success) {
            login(retryResponse.data);
            toast.success(t('auth.welcome_back'));
            navigate('/', { replace: true });
            return;
          }
        }

        setError(profileResponse.message || t('auth.load_profile_error'));
        setIsLoading(false);
      }
    } catch (error) {
      // Nếu có exception (ví dụ: network error), hiển thị lỗi
      const errorMessage = error instanceof Error ? error.message : t('auth.load_profile_error');
      setError(errorMessage);
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
