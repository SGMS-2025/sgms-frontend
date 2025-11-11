import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthState } from '@/hooks/useAuth';
import { useMyKPI } from '@/hooks/useKPI';
import { MyKPICard } from '@/components/kpi/MyKPICard';
import { AlertCircle } from 'lucide-react';

const MyKPIPage: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading } = useAuthState();
  const { myKPIs, loading, error } = useMyKPI();

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading', 'Đang tải...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (myKPIs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">{t('kpi.no_kpi_assigned', 'Bạn chưa có KPI nào được gán')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {myKPIs.map((kpiData) => (
        <MyKPICard key={kpiData.config._id} kpiData={kpiData} />
      ))}
    </div>
  );
};

export default MyKPIPage;
