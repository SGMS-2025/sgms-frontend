import React from 'react';
import { Loader2, Check, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePublicMatrix } from '@/hooks/usePublicMatrix';

interface ServicePackageComparisonProps {
  branchId: string;
  serviceType: 'PT' | 'CLASS';
  branchName?: string;
}

export const ServicePackageComparison: React.FC<ServicePackageComparisonProps> = ({
  branchId,
  serviceType,
  branchName: _branchName
}) => {
  const { t } = useTranslation();
  const { displayData, loading, error } = usePublicMatrix(branchId, serviceType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          {serviceType === 'PT' ? t('pt_service.loading') : t('class_service.loading')}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!displayData || displayData.services.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{serviceType === 'PT' ? t('pt_service.no_data_title') : t('class_service.no_data_title')}</p>
      </div>
    );
  }

  const services = displayData.services.filter((s) => s.status === 'active');
  const features = displayData.features;

  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{serviceType === 'PT' ? t('pt_service.no_data_title') : t('class_service.no_data_title')}</p>
      </div>
    );
  }

  const featuresBenefitsKey = serviceType === 'PT' ? 'pt_service.features_benefits' : 'class_service.features_benefits';

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center mb-4">
        <Building2 className="w-4 h-4 text-orange-500 mr-2" />
        <span className="text-sm text-orange-500 font-semibold">{t(featuresBenefitsKey)}</span>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="bg-white border border-orange-200 rounded-lg overflow-hidden">
            {/* Header row */}
            <div
              className="grid gap-[5px] p-4 text-orange-500 text-sm font-semibold bg-orange-50"
              style={{
                gridTemplateColumns: `260px repeat(${services.length}, 180px)`
              }}
            >
              <div className="flex items-center justify-center px-2">
                {serviceType === 'PT' ? t('pt_service.features_services') : t('class_service.features_services')}
              </div>
              {services.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-1 min-w-0 px-2">
                  <div className="flex items-center gap-2 justify-center w-full min-w-0">
                    <div
                      className="truncate font-semibold max-w-full min-w-0"
                      style={{
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={s.name}
                    >
                      {s.name}
                    </div>
                  </div>

                  {/* Price and Duration */}
                  <div className="flex flex-col items-center gap-1 text-xs text-orange-400">
                    {s.price && s.price > 0 ? (
                      <div className="font-medium text-green-600">{s.price.toLocaleString('vi-VN')}₫</div>
                    ) : (
                      <div className="text-orange-300 italic text-xs">
                        {serviceType === 'PT' ? t('pt_service.no_price') : t('class_service.no_price')}
                      </div>
                    )}
                    {s.durationInMonths && s.durationInMonths > 0 ? (
                      <div className="text-blue-600">
                        {s.durationInMonths} {serviceType === 'PT' ? t('pt_service.months') : t('class_service.months')}
                      </div>
                    ) : (
                      <div className="text-orange-300 italic text-xs">
                        {serviceType === 'PT' ? t('pt_service.no_duration') : t('class_service.no_duration')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {features.map((f, index) => (
              <div
                key={f.id}
                className={`grid gap-[5px] p-4 text-sm border-t border-gray-200 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
                style={{
                  gridTemplateColumns: `260px repeat(${services.length}, 180px)`
                }}
              >
                {/* Feature name column */}
                <div className="flex items-center justify-center gap-2 px-2">
                  <div className="text-sm font-medium leading-5 text-center text-gray-800 truncate max-w-full">
                    {f.name}
                  </div>
                </div>

                {/* Service columns */}
                {services.map((s) => {
                  const cellKey = `${s.id}__${f.id}`;
                  const cell = displayData.cells[cellKey];
                  return (
                    <div key={cellKey} className="flex items-center justify-center px-2">
                      <div className="flex items-center justify-center py-2">
                        {cell?.isIncluded ? (
                          <div className="flex items-center justify-center w-6 h-6 bg-green-600 rounded-full">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <span className="text-gray-400 text-lg">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
