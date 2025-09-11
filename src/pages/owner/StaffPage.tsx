import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '@/hooks/useAuth';
import { StaffManagement } from '@/components/dashboard/StaffManagement';
import StaffProfileModal from '@/components/modals/StaffProfileModal';
import type { StaffDisplay } from '@/types/api/Staff';

const StaffPage: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading } = useAuthState();
  const [selectedStaff, setSelectedStaff] = useState<StaffDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleViewStaff = (staff: StaffDisplay) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
  };

  return (
    <>
      <StaffManagement onViewStaff={handleViewStaff} />
      <StaffProfileModal isOpen={isModalOpen} onClose={handleCloseModal} staff={selectedStaff} />
    </>
  );
};

export default StaffPage;
