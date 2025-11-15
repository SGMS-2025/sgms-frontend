import { useState, useCallback } from 'react';
import { packageApi } from '@/services/api/packageApi';
import { featureApi } from '@/services/api/featureApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Hook for updating service
export const useUpdateService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const updateService = useCallback(
    async (
      id: string,
      data: {
        name: string;
        price?: number;
        durationInMonths?: number;
        sessionCount?: number;
        minParticipants?: number;
        maxParticipants?: number;
        type: 'CLASS' | 'PT';
      }
    ) => {
      setLoading(true);
      setError(null);

      const response = await packageApi.updatePackage(id, {
        name: data.name,
        type: data.type,
        defaultPriceVND: data.price,
        defaultDurationMonths: data.durationInMonths,
        sessionCount: data.sessionCount,
        minParticipants: data.minParticipants || (data.type === 'CLASS' ? 5 : 1),
        maxParticipants: data.maxParticipants || (data.type === 'CLASS' ? 20 : 1)
      });

      if (response.success) {
        setLoading(false);
        toast.success(t(`${data.type.toLowerCase()}_service.update_success`, { name: data.name }));
        return response.data;
      } else {
        setError(response.message || 'Failed to update service');
        setLoading(false);
        throw new Error(response.message || 'Failed to update service');
      }
    },
    [t]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateService,
    loading,
    error,
    resetError
  };
};

// Hook for updating feature
export const useUpdateFeature = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const updateFeature = useCallback(
    async (id: string, data: { name: string }, serviceType: 'CLASS' | 'PT') => {
      setLoading(true);
      setError(null);

      const response = await featureApi.updateFeature(id, {
        name: data.name
      });

      if (response.success) {
        setLoading(false);
        toast.success(t(`${serviceType.toLowerCase()}_service.update_feature_success`, { name: data.name }));
        return response.data;
      } else {
        setError(response.message || 'Failed to update feature');
        setLoading(false);
        throw new Error(response.message || 'Failed to update feature');
      }
    },
    [t]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateFeature,
    loading,
    error,
    resetError
  };
};
