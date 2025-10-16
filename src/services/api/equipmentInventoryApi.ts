import { api } from './api';
import type { ApiResponse } from '@/types/api/Api';
import type {
  EquipmentInventorySession,
  InventorySessionData,
  InventoryStats,
  MissingEquipment,
  StartInventorySessionRequest,
  CheckEquipmentRequest,
  GetInventoryHistoryParams,
  GetInventoryStatsParams,
  GetMissingEquipmentParams
} from '@/types/api/EquipmentInventory';

export const equipmentInventoryApi = {
  // Bắt đầu phiên điểm danh mới
  startInventorySession: async (data: StartInventorySessionRequest): Promise<ApiResponse<InventorySessionData>> => {
    const response = await api.post<ApiResponse<InventorySessionData>>('/equipment-inventory/start-session', data);
    return response.data;
  },

  // Lấy danh sách thiết bị cần điểm danh
  getEquipmentToCheck: async (branchId: string, inventoryDate: string): Promise<ApiResponse<InventorySessionData>> => {
    const response = await api.get<ApiResponse<InventorySessionData>>(
      `/equipment-inventory/equipment/${branchId}/${inventoryDate}`
    );
    return response.data;
  },

  // Lấy phiên điểm danh hiện tại (hôm nay)
  getCurrentInventorySession: async (branchId: string): Promise<ApiResponse<InventorySessionData>> => {
    const response = await api.get<ApiResponse<InventorySessionData>>(
      `/equipment-inventory/current-session/${branchId}`
    );
    return response.data;
  },

  // Điểm danh một thiết bị
  checkEquipment: async (
    sessionId: string,
    data: CheckEquipmentRequest
  ): Promise<ApiResponse<EquipmentInventorySession>> => {
    const response = await api.post<ApiResponse<EquipmentInventorySession>>(
      `/equipment-inventory/check-equipment/${sessionId}`,
      data
    );
    return response.data;
  },

  // Lưu kết quả điểm danh
  saveInventoryResults: async (
    sessionId: string,
    equipmentResults: Array<{ equipmentId: string; status: string; notes?: string }>
  ): Promise<ApiResponse<EquipmentInventorySession>> => {
    const response = await api.post<ApiResponse<EquipmentInventorySession>>(
      `/equipment-inventory/save-results/${sessionId}`,
      {
        equipmentResults
      }
    );
    return response.data;
  },

  // Hoàn thành phiên điểm danh
  completeInventorySession: async (sessionId: string): Promise<ApiResponse<EquipmentInventorySession>> => {
    const response = await api.post<ApiResponse<EquipmentInventorySession>>(
      `/equipment-inventory/complete-session/${sessionId}`
    );
    return response.data;
  },

  // Lấy lịch sử điểm danh
  getInventoryHistory: async (
    params: GetInventoryHistoryParams = {}
  ): Promise<ApiResponse<EquipmentInventorySession[]>> => {
    const response = await api.get<ApiResponse<EquipmentInventorySession[]>>('/equipment-inventory/sessions', {
      params
    });
    return response.data;
  },

  // Lấy chi tiết phiên điểm danh
  getInventorySessionById: async (sessionId: string): Promise<ApiResponse<EquipmentInventorySession>> => {
    const response = await api.get<ApiResponse<EquipmentInventorySession>>(
      `/equipment-inventory/sessions/${sessionId}`
    );
    return response.data;
  },

  // Lấy thống kê điểm danh
  getInventoryStats: async (params: GetInventoryStatsParams): Promise<ApiResponse<InventoryStats>> => {
    const response = await api.get<ApiResponse<InventoryStats>>('/equipment-inventory/stats', { params });
    return response.data;
  },

  // Lấy thiết bị mất tích
  getMissingEquipment: async (params: GetMissingEquipmentParams): Promise<ApiResponse<MissingEquipment[]>> => {
    const response = await api.get<ApiResponse<MissingEquipment[]>>('/equipment-inventory/missing-equipment', {
      params
    });
    return response.data;
  }
};
