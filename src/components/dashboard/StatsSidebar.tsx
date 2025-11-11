import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, Briefcase, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { useStaffStats } from '@/hooks/useStaff';
import { customerApi } from '@/services/api/customerApi';

type SparkProps = { data: { m: string; v: number }[]; color?: string };
const Sparkline: React.FC<SparkProps> = ({ data, color = '#f05a29' }) => {
  const uid = React.useId().replaceAll(':', '');
  const gradId = `sparkGrad-${uid}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} />
        <XAxis hide dataKey="m" />
        <YAxis hide />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const StatsSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { stats: staffStats, loading: staffLoading } = useStaffStats();
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [customerLoading, setCustomerLoading] = useState(true);

  // Fetch customer count
  useEffect(() => {
    const fetchCustomerCount = async () => {
      try {
        setCustomerLoading(true);
        const response = await customerApi.getCustomerList({ limit: 1, page: 1 });
        if (response.success && response.data?.pagination) {
          setCustomerCount(response.data.pagination.totalItems || 0);
        }
      } catch (error) {
        // Error is not critical, just log it
        console.warn('Failed to fetch customer count:', error);
      } finally {
        setCustomerLoading(false);
      }
    };

    fetchCustomerCount();
  }, []);

  // Calculate stats from API data
  const registeredCustomers = customerLoading ? 0 : customerCount;
  const activePT = staffStats?.staffByJobTitle?.find((item) => item._id === 'Personal Trainer')?.count || 0;
  const totalStaff = staffStats?.totalStaff || 0;

  // Mock trend data (will be replaced in Phase 2)
  const customersTrend = [
    { m: 'Jan', v: 20 },
    { m: 'Feb', v: 24 },
    { m: 'Mar', v: 22 },
    { m: 'Apr', v: 28 },
    { m: 'May', v: 27 },
    { m: 'Jun', v: 30 }
  ];
  const ptTrend = [
    { m: 'Jan', v: 10 },
    { m: 'Feb', v: 11 },
    { m: 'Mar', v: 12 },
    { m: 'Apr', v: 12 },
    { m: 'May', v: 13 },
    { m: 'Jun', v: 14 }
  ];
  const staffTrend = [
    { m: 'Jan', v: 70 },
    { m: 'Feb', v: 72 },
    { m: 'Mar', v: 73 },
    { m: 'Apr', v: 74 },
    { m: 'May', v: 75 },
    { m: 'Jun', v: 76 }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center">
          <BarChart3 className="w-4 h-4 text-orange-500 mr-2" />
          <span className="text-sm text-orange-500 font-medium">{t('dashboard.customer_staff_stats')}</span>
        </div>
        <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:border-orange-300 focus:ring-1 focus:ring-orange-200">
          <option>{t('dashboard.year_2025')}</option>
        </select>
      </div>

      <div className="space-y-4 flex-1">
        <div className="flex space-x-2 mb-4">
          <button className="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">
            {t('dashboard.total')}
          </button>
          <button className="px-4 py-2 text-sm text-gray-500 border border-gray-300 rounded hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500 transition-colors">
            {t('dashboard.branch')}
          </button>
        </div>

        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-full mr-4">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-gray-900 font-semibold">{t('dashboard.registered_customers')}</div>
            <button className="text-sm text-gray-500 hover:text-orange-500 transition-colors cursor-pointer">
              {t('dashboard.view_details')}
            </button>
          </div>
          <div className="ml-4 w-24 h-8 hidden md:block">
            <Sparkline data={customersTrend} />
          </div>
          <div className="ml-auto text-xl font-bold text-gray-900">{customerLoading ? '...' : registeredCustomers}</div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-full mr-4">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-gray-900 font-semibold">{t('dashboard.active_pt')}</div>
            <button className="text-sm text-gray-500 hover:text-orange-500 transition-colors cursor-pointer">
              {t('dashboard.view_details')}
            </button>
          </div>
          <div className="ml-4 w-24 h-8 hidden md:block">
            <Sparkline data={ptTrend} />
          </div>
          <div className="ml-auto text-xl font-bold text-gray-900">{staffLoading ? '...' : activePT}</div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-full mr-4">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm text-gray-900 font-semibold">{t('dashboard.staff')}</div>
            <button className="text-sm text-gray-500 hover:text-orange-500 transition-colors cursor-pointer">
              {t('dashboard.view_details')}
            </button>
          </div>
          <div className="ml-4 w-24 h-8 hidden md:block">
            <Sparkline data={staffTrend} />
          </div>
          <div className="ml-auto text-xl font-bold text-gray-900">{staffLoading ? '...' : totalStaff}</div>
        </div>
      </div>
    </div>
  );
};
