import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '@/hooks/useAuth';
import { TestimonialManagement } from '@/components/dashboard/TestimonialManagement';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

const TestimonialPage: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading } = useAuthState();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('testimonial.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <DashboardHeader />
      <div className="mt-4">
        <TestimonialManagement />
      </div>
    </div>
  );
};

export default TestimonialPage;
