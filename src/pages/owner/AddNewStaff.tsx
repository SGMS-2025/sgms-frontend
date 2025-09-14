import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '@/hooks/useAuth';
import AddStaffForm from '@/components/forms/AddStaffForm';

const AddNewStaff: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useAuthState();

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('staff.loading')}</p>
        </div>
      </div>
    );
  }

  return <AddStaffForm />;
};

export default AddNewStaff;
