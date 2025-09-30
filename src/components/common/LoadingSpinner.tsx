import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, className = 'min-h-screen' }) => {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message || t('common.loading')}</p>
      </div>
    </div>
  );
};
