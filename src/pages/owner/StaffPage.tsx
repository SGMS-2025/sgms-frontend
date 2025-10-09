import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '@/hooks/useAuth';
import { StaffManagement } from '@/components/dashboard/StaffManagement';

const StaffPage: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading } = useAuthState();

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
      <StaffManagement />
    </div>
  );
};

export default StaffPage;
