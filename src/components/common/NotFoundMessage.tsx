import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface NotFoundMessageProps {
  message?: string;
  backPath?: string;
  backButtonText?: string;
  className?: string;
}

export const NotFoundMessage: React.FC<NotFoundMessageProps> = ({
  message,
  backPath = '/manage/technician/equipment',
  backButtonText,
  className = 'min-h-screen'
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <p className="text-gray-600">{message || t('equipment.not_found')}</p>
        <button
          onClick={() => navigate(backPath)}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          {backButtonText || t('equipment.back_to_list')}
        </button>
      </div>
    </div>
  );
};
