import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '@/hooks/useAuth';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { StaffManagement } from '@/components/dashboard/StaffManagement';
import type { StaffDisplay } from '@/types/api/Staff';

const StaffPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuthState();

  // Handle redirects using useEffect - must be called before any early returns
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else if (user.role === 'CUSTOMER') {
      navigate('/home');
    }
  }, [isAuthenticated, user, navigate]);

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

  // Show loading if not authenticated or wrong role
  if (!isAuthenticated || !user || user.role === 'CUSTOMER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('staff.redirecting')}</p>
        </div>
      </div>
    );
  }

  const handleViewStaff = (staff: StaffDisplay) => {
    // TODO: {t('staff.view_staff_todo')}
    console.log('View staff:', staff);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f4] flex flex-col">
      <div className="flex flex-1">
        <OwnerSidebar />

        <div className="flex-1 p-6">
          <StaffManagement onViewStaff={handleViewStaff} />
        </div>
      </div>
    </div>
  );
};

export default StaffPage;
