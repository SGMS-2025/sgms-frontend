import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

export const ServicesList: React.FC = () => {
  const { t } = useTranslation();
  const uid = React.useId().replace(/:/g, '');

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Package className="w-4 h-4 text-orange-500 mr-2" />
          <span className="text-sm text-orange-500 font-semibold">{t('dashboard.services_packages')}</span>
        </div>
        <div className="flex space-x-2">
          <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200">
            <option>{t('dashboard.year_2025')}</option>
          </select>
          <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200">
            <option>{t('dashboard.month')}</option>
          </select>
        </div>
      </header>

      {/* Name + status pill + sparkline */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.package_name')}</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 ring-1 ring-orange-200">
            {t('dashboard.ongoing')}
          </span>
        </div>
        <div className="h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { m: 'W1', v: 10 },
                { m: 'W2', v: 14 },
                { m: 'W3', v: 13 },
                { m: 'W4', v: 18 }
              ]}
              margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`svcGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f05a29" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f05a29" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#f05a29" strokeWidth={2} fill={`url(#svcGrad-${uid})`} />
              <XAxis hide dataKey="m" />
              <YAxis hide />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.status')}</div>
            <div className="text-sm font-semibold text-gray-800">{t('dashboard.ongoing')}</div>
          </div>
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.duration')}</div>
            <div className="text-sm font-semibold text-gray-800">1/8 - 30/8</div>
          </div>
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.quantity_sold')}</div>
            <div className="text-sm font-semibold text-gray-800">154 {t('dashboard.times')}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.unit_price')}</div>
            <div className="text-sm font-semibold text-gray-800">150.000</div>
          </div>
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.total_revenue')}</div>
            <div className="text-sm font-semibold text-gray-800">23.100.000</div>
          </div>
          <div>
            <div className="text-xs text-orange-500 font-medium mb-1">{t('dashboard.total_profit')}</div>
            <div className="text-sm font-semibold text-gray-800">5.000.000</div>
          </div>
        </div>
      </section>
    </div>
  );
};
