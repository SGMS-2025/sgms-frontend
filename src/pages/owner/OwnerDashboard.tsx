import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '@/hooks/useAuth';
import { SectionCards } from '@/components/dashboard/SectionCards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StatsSidebar } from '@/components/dashboard/StatsSidebar';
import { BranchList } from '@/components/dashboard/BranchList';
import { ServicesList } from '@/components/dashboard/ServicesList';
import { EquipmentManagement } from '@/components/dashboard/EquipmentManagement';
import { BusinessVerificationAlert } from '@/components/business/BusinessVerificationAlert';
import BusinessVerificationModal from '@/components/business/BusinessVerificationModal';

const OwnerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading } = useAuthState();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

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
      {/* Business Verification Alert */}
      <BusinessVerificationAlert onOpenVerificationModal={() => setIsVerificationModalOpen(true)} />

      {/* Business Verification Modal */}
      <BusinessVerificationModal open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen} />

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
        <ServicesList />
      </div>

      {/* Equipment Management */}
      <EquipmentManagement />
    </div>
  );
};

export default OwnerDashboard;
