import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { equipmentInventoryApi } from '@/services/api/equipmentInventoryApi';
import { toast } from 'sonner';
import { EQUIPMENT_INVENTORY_STATUS } from '@/constants/equipmentInventory';
import type {
  EquipmentInventorySession,
  EquipmentToCheck,
  InventoryStats,
  StartInventorySessionRequest,
  CheckEquipmentRequest,
  GetInventoryHistoryParams
} from '@/types/api/EquipmentInventory';

interface UseEquipmentInventoryReturn {
  // State
  sessions: EquipmentInventorySession[];
  currentSession: EquipmentInventorySession | null;
  equipments: EquipmentToCheck[];
  stats: InventoryStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  startInventorySession: (data: StartInventorySessionRequest) => Promise<EquipmentInventorySession | null>;
  getEquipmentToCheck: (branchId: string, inventoryDate: string) => Promise<EquipmentToCheck[] | null>;
  checkEquipment: (sessionId: string, data: CheckEquipmentRequest) => Promise<boolean>;
  saveInventoryResults: (
    sessionId: string,
    data: Array<{ equipmentId: string; status: string; notes?: string }>
  ) => Promise<boolean>;
  getInventoryHistory: (params: GetInventoryHistoryParams) => Promise<EquipmentInventorySession[] | null>;
  getInventorySessionById: (sessionId: string) => Promise<EquipmentInventorySession | null>;
  getInventoryStats: (branchId: string, startDate: string, endDate: string) => Promise<InventoryStats | null>;
  getMissingEquipment: (branchId: string, startDate: string, endDate: string) => Promise<unknown[] | null>;
  getCurrentInventorySession: (branchId: string) => Promise<unknown | null>;

  // Utilities
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setEquipments: (equipments: EquipmentToCheck[]) => void;
}

export const useEquipmentInventory = (): UseEquipmentInventoryReturn => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<EquipmentInventorySession[]>([]);
  const [currentSession, setCurrentSession] = useState<EquipmentInventorySession | null>(null);
  const [equipments, setEquipments] = useState<EquipmentToCheck[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Start inventory session
  const startInventorySession = useCallback(
    async (data: StartInventorySessionRequest): Promise<EquipmentInventorySession | null> => {
      setLoading(true);
      setError(null);

      const response = await equipmentInventoryApi.startInventorySession(data);

      if (response.success && response.data) {
        setCurrentSession(response.data.session);
        setEquipments(response.data.equipments || []);
        toast.success(t('equipmentInventory.startSessionSuccess'));
        setLoading(false);
        return response.data.session;
      } else {
        const errorMessage = response.message || t('equipmentInventory.startSessionError');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return null;
      }
    },
    []
  );

  // Get equipment to check
  const getEquipmentToCheck = useCallback(
    async (branchId: string, inventoryDate: string): Promise<EquipmentToCheck[] | null> => {
      setLoading(true);
      setError(null);

      const response = await equipmentInventoryApi.getEquipmentToCheck(branchId, inventoryDate);

      if (response.success && response.data) {
        // Chỉ set session nếu nó không null (tránh ghi đè session hiện tại)
        if (response.data.session) {
          setCurrentSession(response.data.session);
        }
        // Đảm bảo tất cả equipment đều có checkStatus: 'PRESENT' mặc định
        const equipmentList = (response.data.equipments || []).map((equipment) => ({
          ...equipment,
          checkStatus: equipment.checkStatus || EQUIPMENT_INVENTORY_STATUS.PRESENT, // Default to PRESENT nếu chưa có
          checkNotes: equipment.checkNotes || '',
          checkedAt: equipment.checkedAt || undefined
        }));
        setEquipments(equipmentList);
        setLoading(false);
        return response.data.equipments;
      } else {
        const errorMessage = response.message || t('equipmentInventory.getEquipmentError');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return null;
      }
    },
    []
  );

  // Check equipment
  const checkEquipment = useCallback(async (sessionId: string, data: CheckEquipmentRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const response = await equipmentInventoryApi.checkEquipment(sessionId, data);

    if (response.success && response.data) {
      setCurrentSession(response.data);
      // Update local equipment state
      setEquipments((prev) =>
        prev.map((equipment) =>
          equipment._id === data.equipmentId
            ? {
                ...equipment,
                checkStatus: data.status,
                checkNotes: data.notes || '',
                checkedAt: new Date().toISOString()
              }
            : equipment
        )
      );
      toast.success(
        `${t('equipmentInventory.checkEquipmentSuccess')}: ${data.status === EQUIPMENT_INVENTORY_STATUS.PRESENT ? t('equipmentInventory.present') : t('equipmentInventory.missing')}`
      );
      setLoading(false);
      return true;
    } else {
      const errorMessage = response.message || t('equipmentInventory.checkEquipmentError');
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
      return false;
    }
  }, []);

  // Save inventory results
  const saveInventoryResults = useCallback(
    async (
      sessionId: string,
      data: Array<{ equipmentId: string; status: string; notes?: string }>
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      const response = await equipmentInventoryApi.saveInventoryResults(sessionId, data);

      if (response.success && response.data) {
        setCurrentSession(response.data);
        toast.success(t('equipmentInventory.saveResultsSuccess'));
        setLoading(false);
        return true;
      } else {
        const errorMessage = response.message || t('equipmentInventory.saveResultsError');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return false;
      }
    },
    []
  );

  // Get inventory history
  const getInventoryHistory = useCallback(
    async (params: GetInventoryHistoryParams): Promise<EquipmentInventorySession[] | null> => {
      setLoading(true);
      setError(null);

      const response = await equipmentInventoryApi.getInventoryHistory(params);

      if (response.success && response.data) {
        setSessions(response.data);
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = response.message || t('equipmentInventory.getHistoryError');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return null;
      }
    },
    []
  );

  // Get inventory session by ID
  const getInventorySessionById = useCallback(async (sessionId: string): Promise<EquipmentInventorySession | null> => {
    setLoading(true);
    setError(null);

    const response = await equipmentInventoryApi.getInventorySessionById(sessionId);

    if (response.success && response.data) {
      setCurrentSession(response.data);
      // If session already has checks, populate equipments from it
      if (response.data.equipmentChecks.length > 0) {
        const equipmentList = response.data.equipmentChecks.map((check) => {
          const equipment = check.equipmentId as unknown as EquipmentToCheck; // Proper type conversion
          return {
            _id: equipment._id,
            equipmentName: equipment.equipmentName || t('equipmentInventory.unknownEquipment'),
            equipmentCode: equipment.equipmentCode || '',
            category: equipment.category || t('equipmentInventory.unknown'),
            location: equipment.location || t('equipmentInventory.unknown'),
            manufacturer: equipment.manufacturer || t('equipmentInventory.unknown'),
            dateOfPurchase: equipment.dateOfPurchase || '',
            status: equipment.status || 'ACTIVE',
            checkStatus: check.status,
            checkNotes: check.notes,
            checkedAt: check.checkedAt
          };
        });
        setEquipments(equipmentList);
      }
      setLoading(false);
      return response.data;
    } else {
      const errorMessage = response.message || t('equipmentInventory.getSessionError');
      setError(errorMessage);
      toast.error(errorMessage);
      setCurrentSession(null); // Clear session on error
      setLoading(false);
      return null;
    }
  }, []);

  // Get inventory stats
  const getInventoryStats = useCallback(
    async (branchId: string, startDate: string, endDate: string): Promise<InventoryStats | null> => {
      setLoading(true);
      setError(null);

      const response = await equipmentInventoryApi.getInventoryStats({ branchId, startDate, endDate });

      if (response.success && response.data) {
        setStats(response.data);
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = response.message || t('equipmentInventory.getStatsError');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return null;
      }
    },
    []
  );

  // Get missing equipment
  const getMissingEquipment = useCallback(
    async (branchId: string, startDate: string, endDate: string): Promise<unknown[] | null> => {
      setLoading(true);
      setError(null);

      const response = await equipmentInventoryApi.getMissingEquipment({ branchId, startDate, endDate });

      if (response.success && response.data) {
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = response.message || t('equipmentInventory.getMissingEquipmentError');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return null;
      }
    },
    []
  );

  // Get current inventory session
  const getCurrentInventorySession = useCallback(async (branchId: string): Promise<unknown | null> => {
    setLoading(true);
    setError(null);

    const response = await equipmentInventoryApi.getCurrentInventorySession(branchId);

    if (response.success && response.data) {
      setCurrentSession(response.data.session);
      setEquipments(response.data.equipments || []);
      setLoading(false);
      return response.data;
    } else {
      const errorMessage = response.message || t('equipmentInventory.getCurrentSessionError');
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
      return null;
    }
  }, []);

  return {
    // State
    sessions,
    currentSession,
    equipments,
    stats,
    loading,
    error,

    // Actions
    startInventorySession,
    getEquipmentToCheck,
    checkEquipment,
    saveInventoryResults,
    getInventoryHistory,
    getInventorySessionById,
    getInventoryStats,
    getMissingEquipment,
    getCurrentInventorySession,

    // Utilities
    clearError,
    setLoading,
    setEquipments
  };
};
