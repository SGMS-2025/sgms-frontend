import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';

const getEquipmentData = (t: (key: string) => string) => [
  {
    code: 'ABC12345',
    name: 'Máy chạy bộ Kingsport',
    date: '10/5/2025',
    price: '8.900.000',
    status: t('dashboard.in_use')
  },
  {
    code: 'AHB13677',
    name: 'Máy chạy bộ ELIP Q7',
    date: '23/3/2025',
    price: '6.500.000',
    status: t('dashboard.in_use')
  },
  {
    code: 'AMN12456',
    name: 'Máy Chạy Bộ Điện Impulse...',
    date: '23/3/2025',
    price: '7.500.000',
    status: t('dashboard.maintenance')
  }
];

export const EquipmentManagement: React.FC = () => {
  const { t } = useTranslation();
  const equipmentData = getEquipmentData(t);

  return (
    <div className="bg-white rounded-lg p-6 mb-6 border-2 border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Settings className="w-4 h-4 text-[#f05a29] mr-2" />
          <span className="text-sm text-[#f05a29] font-semibold">{t('dashboard.facility_management')}</span>
        </div>
        <button className="px-4 py-2 text-sm text-[#0d1523] border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors flex items-center leading-none">
          {t('dashboard.detailed_report')} <span className="ml-2">→</span>
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-[#0d1523] mb-3">{t('dashboard.training_equipment')}</h3>
        <div className="flex space-x-4">
          <select className="px-4 py-2 text-sm border border-[#d9d9d9] rounded">
            <option>{t('dashboard.facility_1')}</option>
          </select>
          <select className="px-4 py-2 text-sm border border-[#d9d9d9] rounded">
            <option>{t('dashboard.gym_room')}</option>
          </select>
          <select className="px-4 py-2 text-sm border border-[#d9d9d9] rounded">
            <option>{t('dashboard.treadmill')}</option>
          </select>
        </div>
      </div>

      <div className="bg-[#f05a29] rounded-lg overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 text-white text-sm font-semibold">
          <div>{t('dashboard.machine_code')}</div>
          <div>{t('dashboard.machine_name')}</div>
          <div>{t('dashboard.import_time')}</div>
          <div>{t('dashboard.unit_price')}</div>
          <div>{t('dashboard.condition')}</div>
        </div>
        {equipmentData.map((item, index) => (
          <div
            key={index}
            className={`grid grid-cols-5 gap-4 p-4 text-sm border-t border-white/20 ${
              index % 2 === 0 ? 'bg-white/10' : 'bg-white/5'
            }`}
          >
            <div className="text-white">{item.code}</div>
            <div className="text-white">{item.name}</div>
            <div className="text-white">{item.date}</div>
            <div className="text-white">{item.price}</div>
            <div className="text-white">{item.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
