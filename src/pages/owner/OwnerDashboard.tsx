import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuth';
import { useOverviewTour } from '@/hooks/useOverviewTour';
import { Button } from '@/components/ui/button';
import { SectionCards } from '@/components/dashboard/SectionCards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StatsSidebar } from '@/components/dashboard/StatsSidebar';
import { BranchList } from '@/components/dashboard/BranchList';
import { KPILeaderboard } from '@/components/dashboard/KPILeaderboard';
import { EquipmentManagement } from '@/components/dashboard/EquipmentManagement';

const OwnerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading } = useAuthState();
  const { startOverviewTour } = useOverviewTour();

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
    <div>
      {/* Header with Tour Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full border-gray-300 hover:bg-gray-50"
          onClick={startOverviewTour}
          title={t('overview.tour.button', 'Hướng dẫn')}
        >
          <HelpCircle className="w-4 h-4 text-gray-500 hover:text-orange-500" />
        </Button>
      </div>

      {/* Top Section */}
      <div className="mb-6">
        <SectionCards />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-12 gap-6 mb-6 items-stretch">
        <div className="col-span-12 xl:col-span-8">
          <RevenueChart />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <StatsSidebar />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <BranchList />
        <KPILeaderboard />
      </div>

      {/* Equipment Management */}
      <EquipmentManagement />
    </div>
  );
};

export default OwnerDashboard;
