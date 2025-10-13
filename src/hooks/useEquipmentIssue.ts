import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { equipmentIssueApi } from '@/services/api/equipmentIssueApi';
import type {
  CreateEquipmentIssueRequest,
  UpdateEquipmentIssueRequest,
  EquipmentIssueListResponse,
  EquipmentIssueResponse,
  EquipmentIssueStatsResponse
} from '@/types/api/EquipmentIssue';

interface UseEquipmentIssueParams {
  page?: number;
  limit?: number;
  equipment_id?: string;
  reported_by?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const useEquipmentIssue = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEquipmentIssue = useCallback(
    async (data: CreateEquipmentIssueRequest): Promise<EquipmentIssueResponse | null> => {
      setLoading(true);
      setError(null);

      const response = await equipmentIssueApi.createEquipmentIssue(data);

      if (response.success) {
        toast.success(t('equipmentIssue.createSuccess', 'Báo cáo lỗi thiết bị đã được gửi thành công!'));
        return response;
      } else {
        setError(t('equipmentIssue.createError', 'Có lỗi xảy ra khi gửi báo cáo'));
        toast.error(t('equipmentIssue.createError', 'Có lỗi xảy ra khi gửi báo cáo'));
        return null;
      }
    },
    []
  );

  const getEquipmentIssues = useCallback(
    async (params?: UseEquipmentIssueParams): Promise<EquipmentIssueListResponse | null> => {
      setLoading(true);
      setError(null);

      const response = await equipmentIssueApi.getEquipmentIssues(params);

      if (response.success) {
        return response;
      } else {
        setError(t('equipmentIssue.listError', 'Có lỗi xảy ra khi tải danh sách báo cáo'));
        toast.error(t('equipmentIssue.listError', 'Có lỗi xảy ra khi tải danh sách báo cáo'));
        return null;
      }
    },
    []
  );

  const getEquipmentIssueById = useCallback(async (id: string): Promise<EquipmentIssueResponse | null> => {
    setLoading(true);
    setError(null);

    const response = await equipmentIssueApi.getEquipmentIssueById(id);

    if (response.success) {
      return response;
    } else {
      setError(t('equipmentIssue.detailError', 'Có lỗi xảy ra khi tải thông tin báo cáo'));
      toast.error(t('equipmentIssue.detailError', 'Có lỗi xảy ra khi tải thông tin báo cáo'));
      return null;
    }
  }, []);

  const updateEquipmentIssue = useCallback(
    async (id: string, data: UpdateEquipmentIssueRequest): Promise<EquipmentIssueResponse | null> => {
      setLoading(true);
      setError(null);

      const response = await equipmentIssueApi.updateEquipmentIssue(id, data);

      if (response.success) {
        toast.success(t('equipmentIssue.updateSuccess', 'Cập nhật báo cáo thành công!'));
        return response;
      } else {
        setError(t('equipmentIssue.updateError', 'Có lỗi xảy ra khi cập nhật báo cáo'));
        toast.error(t('equipmentIssue.updateError', 'Có lỗi xảy ra khi cập nhật báo cáo'));
        return null;
      }
    },
    []
  );

  const deleteEquipmentIssue = useCallback(async (id: string): Promise<EquipmentIssueResponse | null> => {
    setLoading(true);
    setError(null);

    const response = await equipmentIssueApi.deleteEquipmentIssue(id);

    if (response.success) {
      toast.success(t('equipmentIssue.deleteSuccess', 'Xóa báo cáo thành công!'));
      return response;
    } else {
      setError(t('equipmentIssue.deleteError', 'Có lỗi xảy ra khi xóa báo cáo'));
      toast.error(t('equipmentIssue.deleteError', 'Có lỗi xảy ra khi xóa báo cáo'));
      return null;
    }
  }, []);

  const resolveEquipmentIssue = useCallback(async (id: string): Promise<EquipmentIssueResponse | null> => {
    setLoading(true);
    setError(null);

    const response = await equipmentIssueApi.resolveEquipmentIssue(id);

    if (response.success) {
      toast.success(t('equipmentIssue.resolveSuccess', 'Đã giải quyết báo cáo thành công!'));
      return response;
    } else {
      setError(t('equipmentIssue.resolveError', 'Có lỗi xảy ra khi giải quyết báo cáo'));
      toast.error(t('equipmentIssue.resolveError', 'Có lỗi xảy ra khi giải quyết báo cáo'));
      return null;
    }
  }, []);

  const getEquipmentIssueStats = useCallback(async (branchId?: string): Promise<EquipmentIssueStatsResponse | null> => {
    setLoading(true);
    setError(null);

    const response = await equipmentIssueApi.getEquipmentIssueStats(branchId);

    if (response.success) {
      return response;
    } else {
      setError(t('equipmentIssue.statsError', 'Có lỗi xảy ra khi tải thống kê'));
      toast.error(t('equipmentIssue.statsError', 'Có lỗi xảy ra khi tải thống kê'));
      return null;
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createEquipmentIssue,
    getEquipmentIssues,
    getEquipmentIssueById,
    updateEquipmentIssue,
    deleteEquipmentIssue,
    resolveEquipmentIssue,
    getEquipmentIssueStats,
    resetError
  };
};
