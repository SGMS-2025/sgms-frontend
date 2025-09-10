import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';

export const ServicesList: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Package className="w-4 h-4 text-[#f05a29] mr-2" />
          <span className="text-sm text-[#f05a29] font-semibold">{t('dashboard.services_packages')}</span>
        </div>
        <div className="flex space-x-2">
          <select className="text-sm border border-gray-200 rounded px-2 py-1 bg-white">
            <option>{t('dashboard.year_2025')}</option>
          </select>
          <select className="text-sm border border-gray-200 rounded px-2 py-1 bg-white">
            <option>{t('dashboard.month')}</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-[#0d1523] mb-4">{t('dashboard.package_name')}</h3>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <div className="text-sm text-[#f05a29] font-medium mb-1">{t('dashboard.status')}</div>
            <div className="text-base font-semibold text-[#0d1523]">{t('dashboard.ongoing')}</div>
          </div>
          <div>
            <div className="text-sm text-[#f05a29] font-medium mb-1">{t('dashboard.duration')}</div>
            <div className="text-base font-semibold text-[#0d1523]">1/8 - 30/8</div>
          </div>
          <div>
            <div className="text-sm text-[#f05a29] font-medium mb-1">{t('dashboard.quantity_sold')}</div>
            <div className="text-base font-semibold text-[#0d1523]">154 {t('dashboard.times')}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-[#f05a29] font-medium mb-1">{t('dashboard.unit_price')}</div>
            <div className="text-base font-semibold text-[#0d1523]">150.000</div>
          </div>
          <div>
            <div className="text-sm text-[#f05a29] font-medium mb-1">{t('dashboard.total_revenue')}</div>
            <div className="text-base font-semibold text-[#0d1523]">23.100.000</div>
          </div>
          <div>
            <div className="text-sm text-[#f05a29] font-medium mb-1">{t('dashboard.total_profit')}</div>
            <div className="text-base font-semibold text-[#0d1523]">5.000.000</div>
          </div>
        </div>
      </div>

      <div className="justify-items-normal">
        <button className="px-4 py-2 text-sm text-[#0d1523] border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors flex items-center leading-none">
          {t('dashboard.detailed_report')} <span className="ml-2">→</span>
        </button>
      </div>
    </div>
  );
};
