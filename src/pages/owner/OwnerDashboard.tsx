import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LiveStatsCard } from '@/components/dashboard/LiveStatsCard';
import { CheckInCharts } from '@/components/dashboard/CheckInCharts';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StatsSidebar } from '@/components/dashboard/StatsSidebar';
import { BranchList } from '@/components/dashboard/BranchList';
import { ServicesList } from '@/components/dashboard/ServicesList';
import { EquipmentManagement } from '@/components/dashboard/EquipmentManagement';

const OwnerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading } = useAuthState();

  // Display loading while fetching
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('staff.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader />

      {/* Top Section */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-3">
          <LiveStatsCard />
        </div>
        <div className="col-span-4">
          <CheckInCharts
            title={t('dashboard.checkin_pt_hourly')}
            data={[
              { time: '6', value: 0 },
              { time: '8', value: 0.3 },
              { time: '10', value: 0.1 },
              { time: '12', value: 0 },
              { time: '14', value: 0.4 },
              { time: '16', value: 0.7 },
              { time: '18', value: 0.5 }
            ]}
          />
        </div>
        <div className="col-span-5">
          <CheckInCharts
            title={t('dashboard.checkin_customer_hourly')}
            data={[
              { time: '6', value: 0.2 },
              { time: '8', value: 0.5 },
              { time: '10', value: 0.3 },
              { time: '12', value: 0 },
              { time: '14', value: 1.0 },
              { time: '16', value: 1.4 },
              { time: '18', value: 1.1 }
            ]}
          />
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-8">
          <RevenueChart />
        </div>
        <div className="col-span-4">
          <StatsSidebar />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <BranchList />
        <ServicesList />
      </div>

      {/* Equipment Management */}
      <EquipmentManagement />
    </>
  );
};

export default OwnerDashboard;
