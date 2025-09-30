import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { featureApi } from '@/services/api/featureApi';
import { packageApi } from '@/services/api/packageApi';
import { matrixApi } from '@/services/api/matrixApi';
import { useBranch } from '@/contexts/BranchContext';
import type { MatrixDisplayData, MatrixCellData } from '@/types/api/Matrix';
import type { LegacyService } from '@/types/api/Package';
import type { FeatureFormData } from '@/types/api/Feature';
import { convertMatrixToLegacyFormat, createMatrixCellKey } from '@/utils/matrixUtils';
import { sanitizeFeatureKey } from '@/utils/featureUtils';
import { validatePackageData } from '@/utils/packageUtils';
import { toast } from 'sonner';

export function useMatrix(serviceType?: 'PT' | 'CLASS') {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const [matrixData, setMatrixData] = useState<MatrixDisplayData>({
    services: [],
    features: [],
    cells: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load matrix data for current branch
  const loadMatrix = useCallback(async () => {
    if (!currentBranch) return;

    if (!currentBranch._id || typeof currentBranch._id !== 'string') {
      setError(t('matrix.invalid_branch'));
      return;
    }

    setLoading(true);
    setError(null);

    const response = await matrixApi.getMatrixForBranch({
      branchId: currentBranch._id,
      type: serviceType
    });

    // Check if response indicates an error
    if (!response.success) {
      setLoading(false);
      throw new Error(response.message || 'Failed to load matrix');
    }

    if (response?.data) {
      const legacyData = convertMatrixToLegacyFormat(response.data);
      setMatrixData(legacyData);
    } else {
      setMatrixData({
        services: [],
        features: [],
        cells: {}
      });
    }

    setLoading(false);
  }, [t, currentBranch, serviceType]);

  // Load matrix when branch changes
  useEffect(() => {
    if (currentBranch?._id) {
      loadMatrix();
    } else {
      setMatrixData({
        services: [],
        features: [],
        cells: {}
      });
      setError(null);
    }
  }, [currentBranch?._id, loadMatrix]);

  // Sort features by rowOrder
  const sortedFeatures = useMemo(() => {
    const features = [...matrixData.features];

    return features.sort((a, b) => a.rowOrder - b.rowOrder);
  }, [matrixData.features]);

  // Filter services by type if specified
  const filteredServices = useMemo(() => {
    if (!serviceType) return matrixData.services;

    // Filter services based on their actual type field
    return matrixData.services.filter((service) => {
      // Check if service has type field and matches the requested type
      return (service as LegacyService).type === serviceType;
    });
  }, [matrixData.services, serviceType]);

  // Ensure cells exist for all service-feature combinations
  const ensureCellsForNew = useCallback((serviceId?: string, featureId?: string) => {
    setMatrixData((prev) => {
      const next = { ...prev, cells: { ...prev.cells } };

      if (serviceId) {
        // Create cells for new service with all existing features
        for (const feature of prev.features) {
          const key = createMatrixCellKey(serviceId, feature.id);
          if (!next.cells[key]) {
            next.cells[key] = {
              serviceId,
              featureId: feature.id,
              isIncluded: false,
              valueNumber: null,
              valueText: null
            };
          }
        }
      }

      if (featureId) {
        // Create cells for new feature with all existing services
        for (const service of prev.services) {
          const key = createMatrixCellKey(service.id, featureId);
          if (!next.cells[key]) {
            next.cells[key] = {
              serviceId: service.id,
              featureId,
              isIncluded: false,
              valueNumber: null,
              valueText: null
            };
          }
        }
      }

      return next;
    });
  }, []);

  // Ensure all matrix cells exist
  const ensureAllCells = useCallback(() => {
    setMatrixData((prev) => {
      const next = { ...prev, cells: { ...prev.cells } };

      // Create cells for all service-feature combinations
      for (const service of prev.services) {
        for (const feature of prev.features) {
          const key = createMatrixCellKey(service.id, feature.id);
          if (!next.cells[key]) {
            next.cells[key] = {
              serviceId: service.id,
              featureId: feature.id,
              isIncluded: false,
              valueNumber: null,
              valueText: null
            };
          }
        }
      }

      return next;
    });
  }, []);

  // Ensure cells exist after data changes
  useEffect(() => {
    if (matrixData.services.length > 0 && matrixData.features.length > 0) {
      ensureAllCells();
    }
  }, [matrixData.services.length, matrixData.features.length, ensureAllCells]);

  // Add new service (package)
  const addService = useCallback(
    async (
      payload: Pick<LegacyService, 'name' | 'price' | 'durationInMonths'> & {
        minParticipants?: number;
        maxParticipants?: number;
      }
    ) => {
      const validation = validatePackageData({
        name: payload.name,
        defaultDurationMonths: payload.durationInMonths
      });

      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      setLoading(true);
      setError(null);

      const defaultMinParticipants = serviceType === 'CLASS' ? 5 : 1;
      const defaultMaxParticipants = serviceType === 'CLASS' ? 20 : 1;

      const createData = {
        name: payload.name,
        type: serviceType || 'PT',
        defaultDurationMonths: payload.durationInMonths || 1,
        defaultPriceVND: payload.price || undefined,
        minParticipants: payload.minParticipants || defaultMinParticipants,
        maxParticipants: payload.maxParticipants || defaultMaxParticipants
      };

      const response = await packageApi.createPackage(createData, currentBranch?._id);

      // Check if response indicates an error
      if (!response.success) {
        setLoading(false);
        throw new Error(response.message || 'Failed to create service');
      }

      const newService: LegacyService = {
        id: response.data._id,
        name: response.data.name,
        price: payload.price,
        durationInMonths: response.data.defaultDurationMonths,
        status: response.data.status === 'ACTIVE' ? 'active' : 'inactive'
      };

      setMatrixData((prev) => ({
        ...prev,
        services: [...prev.services, newService]
      }));

      ensureCellsForNew(newService.id);
      await loadMatrix();
      setLoading(false);
      toast.success(
        t('matrix.add_service_success', {
          type: serviceType === 'CLASS' ? t('matrix.class_type') : t('matrix.pt_type'),
          name: payload.name
        })
      );
    },
    [t, ensureCellsForNew, loadMatrix, serviceType, currentBranch?._id]
  );

  // Remove service
  const removeService = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await packageApi.deactivatePackage(id);

      // Check if response indicates an error
      if (!response.success) {
        setLoading(false);
        throw new Error(response.message || 'Failed to remove service');
      }

      await loadMatrix();
      setLoading(false);
      toast.success(
        t('matrix.remove_service_success', {
          type: serviceType === 'CLASS' ? t('matrix.class_type') : t('matrix.pt_type')
        })
      );
    },
    [t, loadMatrix, serviceType]
  );

  // Add new feature
  const addFeature = useCallback(
    async (payload: FeatureFormData) => {
      setLoading(true);
      setError(null);

      const featureType: 'PT' | 'CLASS' | 'GENERAL' = serviceType || 'GENERAL';

      const createData = {
        key: sanitizeFeatureKey(payload.name),
        name: payload.name,
        type: featureType
      };

      const response = await featureApi.createFeature(createData, currentBranch?._id);

      // Check if response indicates an error
      if (!response.success) {
        setLoading(false);
        throw new Error(response.message || 'Failed to create feature');
      }

      const maxOrder = matrixData.features.reduce((m, f) => Math.max(m, f.rowOrder), 0);
      const newFeature = {
        id: response.data._id,
        name: response.data.name as string,
        type: 'BOOLEAN' as const,
        unit: null,
        rowOrder: maxOrder + 1
      };

      setMatrixData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature]
      }));

      ensureCellsForNew(undefined, newFeature.id);
      await loadMatrix();
      setLoading(false);
      toast.success(t('matrix.add_feature_success', { name: payload.name }));
    },
    [t, matrixData.features, ensureCellsForNew, loadMatrix, currentBranch, serviceType]
  );

  // Remove feature
  const removeFeature = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await featureApi.archiveFeature(id);

      // Check if response indicates an error
      if (!response.success) {
        setLoading(false);
        throw new Error(response.message || 'Failed to remove feature');
      }

      await loadMatrix();
      setLoading(false);
      toast.success(t('matrix.remove_feature_success'));
    },
    [t, loadMatrix]
  );

  // Update matrix cell
  const updateCell = useCallback((serviceId: string, featureId: string, patch: Partial<MatrixCellData>) => {
    const key = createMatrixCellKey(serviceId, featureId);
    setMatrixData((prev) => ({
      ...prev,
      cells: {
        ...prev.cells,
        [key]: {
          isIncluded: false,
          valueNumber: null,
          valueText: null,
          ...prev.cells[key],
          serviceId,
          featureId,
          ...patch
        }
      }
    }));
  }, []);

  // Save matrix changes to backend
  const saveMatrix = useCallback(async () => {
    if (!currentBranch) return;

    setLoading(true);
    setError(null);

    const changes: Record<
      string,
      {
        features?: Record<string, { isIncluded: boolean | null }>;
      }
    > = {};

    matrixData.services.forEach((service) => {
      const serviceChanges: {
        features?: Record<string, { isIncluded: boolean | null }>;
      } = {};

      const featureChanges: Record<string, { isIncluded: boolean | null }> = {};
      matrixData.features.forEach((feature) => {
        const cellKey = createMatrixCellKey(service.id, feature.id);
        const cell = matrixData.cells[cellKey];

        if (cell) {
          featureChanges[feature.id] = {
            isIncluded: cell.isIncluded ?? null
          };
        }
      });

      if (Object.keys(featureChanges).length > 0) {
        serviceChanges.features = featureChanges;
      }

      if (Object.keys(serviceChanges).length > 0) {
        changes[service.id] = serviceChanges;
      }
    });

    const response = await matrixApi.saveMatrixChanges(currentBranch._id, changes);

    // Check if response indicates an error
    if (!response.success) {
      setLoading(false);
      throw new Error(response.message || 'Failed to save matrix');
    }

    await loadMatrix();
    setLoading(false);
    toast.success(t('matrix.save_success'));
  }, [t, currentBranch, matrixData, loadMatrix]);

  // Test API connectivity
  const testConnection = useCallback(async () => {
    await featureApi.getActiveFeatures();
    return true;
  }, []);

  return {
    services: filteredServices,
    features: sortedFeatures,
    cells: matrixData.cells,
    loading,
    error,
    addService,
    removeService,
    addFeature,
    removeFeature,
    updateCell,
    saveMatrix,
    reloadMatrix: loadMatrix,
    clearError: () => setError(null),
    testConnection,
    setLoading,
    setError
  };
}
