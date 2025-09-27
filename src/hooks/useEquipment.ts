import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { equipmentApi } from '@/services/api/equipmentApi';
import type {
  Equipment,
  EquipmentQueryParams,
  EquipmentStats,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  AddMaintenanceLogRequest,
  AddEquipmentConditionRequest,
  EquipmentCategory,
  EquipmentStatus
} from '@/types/api/Equipment';

// Hook result interfaces
export interface UseEquipmentListReturn {
  equipments: Equipment[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: Partial<EquipmentQueryParams>) => void;
  goToPage: (page: number) => void;
}

export interface UseEquipmentDetailsReturn {
  equipment: Equipment | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseEquipmentStatsReturn {
  stats: EquipmentStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseEquipmentMutationsReturn {
  loading: boolean;
  error: string | null;
  resetError: () => void;
}

// Main hook for equipment list with pagination and filtering
export const useEquipmentList = (initialParams: EquipmentQueryParams = {}): UseEquipmentListReturn => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseEquipmentListReturn['pagination']>(null);
  const [params, setParams] = useState<EquipmentQueryParams>(initialParams);

  const fetchEquipments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      page: 1,
      limit: 10,
      ...params
    };

    // Filter out empty values to avoid backend validation errors
    const filteredParams = Object.fromEntries(
      Object.entries(requestParams).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

    const response = await equipmentApi.getEquipments(filteredParams);

    if (response.success) {
      setEquipments(response.data || response.equipments || []);

      // Transform pagination data to match frontend interface
      const paginationData = response.meta || response.pagination;
      if (paginationData) {
        const transformedPagination = {
          currentPage: paginationData.page,
          totalPages: paginationData.totalPages,
          totalItems: paginationData.total,
          itemsPerPage: paginationData.limit,
          hasNextPage: paginationData.hasNext,
          hasPrevPage: paginationData.hasPrev
        };
        setPagination(transformedPagination);
      }
    } else {
      setError(response.message || 'Failed to fetch equipment list');
    }

    setLoading(false);
  }, [params]);

  const refetch = useCallback(async () => {
    await fetchEquipments();
  }, [fetchEquipments]);

  const updateFilters = useCallback((newFilters: Partial<EquipmentQueryParams>) => {
    setParams((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  return {
    equipments,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    goToPage
  };
};

// Hook for equipment stats
export const useEquipmentStats = (branchId?: string): UseEquipmentStatsReturn => {
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await equipmentApi.getEquipmentStats(branchId);

    if (response.success) {
      setStats(response.data);
    } else {
      setError(response.message || 'Failed to fetch equipment stats');
    }

    setLoading(false);
  }, [branchId]);

  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch
  };
};

// Hook for getting equipment details by ID
export const useEquipmentDetails = (equipmentId: string | null): UseEquipmentDetailsReturn => {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipmentDetails = useCallback(async () => {
    if (!equipmentId) {
      return;
    }

    setLoading(true);
    setError(null);

    const response = await equipmentApi.getEquipmentById(equipmentId);

    if (response.success) {
      setEquipment(response.data);
    } else {
      setError(response.message || 'Failed to fetch equipment details');
    }

    setLoading(false);
  }, [equipmentId]);

  const refetch = useCallback(async () => {
    await fetchEquipmentDetails();
  }, [fetchEquipmentDetails]);

  // Auto-fetch when equipmentId changes
  useEffect(() => {
    fetchEquipmentDetails();
  }, [fetchEquipmentDetails]);

  return {
    equipment,
    loading,
    error,
    refetch
  };
};

// Hook for creating new equipment
export const useCreateEquipment = (): UseEquipmentMutationsReturn & {
  createEquipment: (equipmentData: CreateEquipmentRequest) => Promise<Equipment>;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEquipment = useCallback(async (equipmentData: CreateEquipmentRequest): Promise<Equipment> => {
    setLoading(true);
    setError(null);

    const response = await equipmentApi.createEquipment(equipmentData);

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      setError(response.message || 'Failed to create equipment');
      setLoading(false);
      throw new Error(response.message || 'Failed to create equipment');
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createEquipment,
    loading,
    error,
    resetError
  };
};

// Hook for updating equipment
export const useUpdateEquipment = (): UseEquipmentMutationsReturn & {
  updateEquipment: (equipmentId: string, updateData: UpdateEquipmentRequest) => Promise<Equipment>;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateEquipment = useCallback(
    async (equipmentId: string, updateData: UpdateEquipmentRequest): Promise<Equipment> => {
      setLoading(true);
      setError(null);

      const response = await equipmentApi.updateEquipment(equipmentId, updateData);

      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.message || 'Failed to update equipment');
        setLoading(false);
        throw new Error(response.message || 'Failed to update equipment');
      }
    },
    []
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateEquipment,
    loading,
    error,
    resetError
  };
};

// Hook for deleting equipment
export const useDeleteEquipment = (): UseEquipmentMutationsReturn & {
  deleteEquipment: (equipmentId: string) => Promise<void>;
} => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteEquipment = useCallback(
    async (equipmentId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      const response = await equipmentApi.deleteEquipment(equipmentId).catch((error) => {
        console.error('Delete equipment error:', error);
        setError(error.response?.data?.message || error.message || t('equipment.delete_network_error'));
        setLoading(false);
        return null;
      });

      if (response && response.success) {
        setLoading(false);
      } else if (response) {
        setError(response.message || t('equipment.delete_failed'));
        setLoading(false);
      }
    },
    [t]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    deleteEquipment,
    loading,
    error,
    resetError
  };
};

// Hook for updating equipment status
export const useUpdateEquipmentStatus = (): UseEquipmentMutationsReturn & {
  updateStatus: (equipmentId: string, status: EquipmentStatus) => Promise<Equipment>;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (equipmentId: string, status: EquipmentStatus): Promise<Equipment> => {
    setLoading(true);
    setError(null);

    const response = await equipmentApi.updateEquipmentStatus(equipmentId, status);

    if (response.success) {
      setLoading(false);
      return response.data;
    } else {
      setError(response.message || 'Failed to update equipment status');
      setLoading(false);
      throw new Error(response.message || 'Failed to update equipment status');
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateStatus,
    loading,
    error,
    resetError
  };
};

// Hook for adding maintenance log
export const useAddMaintenanceLog = (): UseEquipmentMutationsReturn & {
  addMaintenanceLog: (equipmentId: string, logData: AddMaintenanceLogRequest) => Promise<Equipment>;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMaintenanceLog = useCallback(
    async (equipmentId: string, logData: AddMaintenanceLogRequest): Promise<Equipment> => {
      setLoading(true);
      setError(null);

      const response = await equipmentApi.addMaintenanceLog(equipmentId, logData);

      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.message || 'Failed to add maintenance log');
        setLoading(false);
        throw new Error(response.message || 'Failed to add maintenance log');
      }
    },
    []
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    addMaintenanceLog,
    loading,
    error,
    resetError
  };
};

// Hook for adding equipment condition
export const useAddEquipmentCondition = (): UseEquipmentMutationsReturn & {
  addCondition: (equipmentId: string, conditionData: AddEquipmentConditionRequest) => Promise<Equipment>;
} => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCondition = useCallback(
    async (equipmentId: string, conditionData: AddEquipmentConditionRequest): Promise<Equipment> => {
      setLoading(true);
      setError(null);

      const response = await equipmentApi.addEquipmentCondition(equipmentId, conditionData);

      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.message || 'Failed to add equipment condition');
        setLoading(false);
        throw new Error(response.message || 'Failed to add equipment condition');
      }
    },
    []
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    addCondition,
    loading,
    error,
    resetError
  };
};

// Hook for getting equipments by branch
export const useEquipmentsByBranch = (branchId: string, status?: EquipmentStatus) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipmentsByBranch = useCallback(async () => {
    if (!branchId) return;

    setLoading(true);
    setError(null);

    const response = await equipmentApi.getEquipmentsByBranch(branchId, status);

    if (response.success) {
      setEquipments(response.data);
    } else {
      setError(response.message || 'Failed to fetch equipments by branch');
    }

    setLoading(false);
  }, [branchId, status]);

  const refetch = useCallback(async () => {
    await fetchEquipmentsByBranch();
  }, [fetchEquipmentsByBranch]);

  useEffect(() => {
    fetchEquipmentsByBranch();
  }, [fetchEquipmentsByBranch]);

  return {
    equipments,
    loading,
    error,
    refetch
  };
};

// Hook for getting equipments by category
export const useEquipmentsByCategory = (category: EquipmentCategory) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipmentsByCategory = useCallback(async () => {
    if (!category) return;

    setLoading(true);
    setError(null);

    const response = await equipmentApi.getEquipmentsByCategory(category);

    if (response.success) {
      setEquipments(response.data);
    } else {
      setError(response.message || 'Failed to fetch equipments by category');
    }

    setLoading(false);
  }, [category]);

  const refetch = useCallback(async () => {
    await fetchEquipmentsByCategory();
  }, [fetchEquipmentsByCategory]);

  useEffect(() => {
    fetchEquipmentsByCategory();
  }, [fetchEquipmentsByCategory]);

  return {
    equipments,
    loading,
    error,
    refetch
  };
};

// Hook for getting equipments expiring warranty
export const useEquipmentsExpiringWarranty = (daysAhead: number = 30) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiringWarranty = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await equipmentApi.getEquipmentsExpiringWarranty(daysAhead);

    if (response.success) {
      setEquipments(response.data);
    } else {
      setError(response.message || 'Failed to fetch equipments expiring warranty');
    }

    setLoading(false);
  }, [daysAhead]);

  const refetch = useCallback(async () => {
    await fetchExpiringWarranty();
  }, [fetchExpiringWarranty]);

  useEffect(() => {
    fetchExpiringWarranty();
  }, [fetchExpiringWarranty]);

  return {
    equipments,
    loading,
    error,
    refetch
  };
};

// Hook for getting equipments needing maintenance
export const useEquipmentsNeedingMaintenance = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNeedingMaintenance = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await equipmentApi.getEquipmentsNeedingMaintenance();

    if (response.success) {
      setEquipments(response.data);
    } else {
      setError(response.message || 'Failed to fetch equipments needing maintenance');
    }

    setLoading(false);
  }, []);

  const refetch = useCallback(async () => {
    await fetchNeedingMaintenance();
  }, [fetchNeedingMaintenance]);

  useEffect(() => {
    fetchNeedingMaintenance();
  }, [fetchNeedingMaintenance]);

  return {
    equipments,
    loading,
    error,
    refetch
  };
};
