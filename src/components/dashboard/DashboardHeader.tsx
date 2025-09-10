import React from 'react';
import { useTranslation } from 'react-i18next';

export const DashboardHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold text-[#0d1523]">{t('dashboard.overview')}</h1>
    </div>
  );
};
