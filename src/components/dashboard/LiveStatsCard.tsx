import React from 'react';
import { useTranslation } from 'react-i18next';

export const LiveStatsCard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-[#f05a29] rounded-lg p-6 text-white h-full flex flex-col justify-center border-2 border-orange-300 shadow-sm">
      <div className="flex items-center mb-3">
        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
        <span className="text-sm font-medium">{t('dashboard.live')}</span>
      </div>
      <h2 className="text-xl font-semibold mb-6">{t('dashboard.today')}</h2>
      <div className="text-6xl font-bold mb-3 text-center">0</div>
      <div className="text-sm text-center">{t('dashboard.visitors')}</div>
    </div>
  );
};
