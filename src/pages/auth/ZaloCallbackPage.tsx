import { useTranslation } from 'react-i18next';
import { useZaloCallback } from '@/hooks/useZaloCallback';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/error-message';

const ZaloCallbackPage = () => {
  const { t } = useTranslation();
  const { isLoading, error, handleRetry } = useZaloCallback();

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <ErrorMessage message={error} onRetry={handleRetry} className="max-w-md" />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <LoadingSpinner message={t('auth.zalo_login_processing')} className="min-h-screen" />
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <LoadingSpinner message={t('auth.processing_login')} className="min-h-screen" />
    </div>
  );
};

export default ZaloCallbackPage;
