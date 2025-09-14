import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, Briefcase, BarChart3 } from 'lucide-react';

export const StatsSidebar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="w-4 h-4 text-[#f05a29] mr-2" />
          <span className="text-sm text-[#f05a29] font-medium">{t('dashboard.customer_staff_stats')}</span>
        </div>
        <select className="text-sm border-none">
          <option>{t('dashboard.year_2025')}</option>
        </select>
      </div>

      <div className="space-y-6">
        <div className="flex space-x-2 mb-4">
          <button className="px-4 py-2 text-sm bg-[#f05a29] text-white rounded">{t('dashboard.total')}</button>
          <button className="px-4 py-2 text-sm text-[#9fa5ad] border border-[#d9d9d9] rounded">
            {t('dashboard.branch')}
          </button>
        </div>

        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-[#f05a29] rounded-full mr-4">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-[#000000] font-semibold">{t('dashboard.registered_customers')}</div>
            <a
              href="#"
              className="text-sm text-[#9fa5ad] underline hover:text-[#f05a29] transition-colors cursor-pointer"
            >
              {t('dashboard.view_details')}
            </a>
          </div>
          <div className="ml-auto text-2xl font-bold">584</div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-[#f05a29] rounded-full mr-4">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-[#000000] font-semibold">{t('dashboard.active_pt')}</div>
            <a
              href="#"
              className="text-sm text-[#9fa5ad] underline hover:text-[#f05a29] transition-colors cursor-pointer"
            >
              {t('dashboard.view_details')}
            </a>
          </div>
          <div className="ml-auto text-2xl font-bold">29</div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-[#f05a29] rounded-full mr-4">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-[#000000] font-semibold">{t('dashboard.staff')}</div>
            <a
              href="#"
              className="text-sm text-[#9fa5ad] underline hover:text-[#f05a29] transition-colors cursor-pointer"
            >
              {t('dashboard.view_details')}
            </a>
          </div>
          <div className="ml-auto text-2xl font-bold">76</div>
        </div>
      </div>
    </div>
  );
};
