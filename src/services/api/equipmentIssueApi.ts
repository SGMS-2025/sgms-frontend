import { api } from './api';
import type {
  CreateEquipmentIssueRequest,
  UpdateEquipmentIssueRequest,
  EquipmentIssueListResponse,
  EquipmentIssueResponse,
  EquipmentIssueStatsResponse
} from '@/types/api/EquipmentIssue';

export const equipmentIssueApi = {
  // Tạo báo cáo lỗi thiết bị mới
  createEquipmentIssue: async (data: CreateEquipmentIssueRequest): Promise<EquipmentIssueResponse> => {
    const response = await api.post('/equipment-issues', data);
    return response.data;
  },

  // Lấy danh sách báo cáo lỗi thiết bị
  getEquipmentIssues: async (params?: {
    page?: number;
    limit?: number;
    equipment_id?: string;
    reported_by?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    branchId?: string;
  }): Promise<EquipmentIssueListResponse> => {
    const response = await api.get('/equipment-issues', { params });
    return response.data;
  },

  // Lấy thông tin chi tiết báo cáo lỗi thiết bị
  getEquipmentIssueById: async (id: string): Promise<EquipmentIssueResponse> => {
    const response = await api.get(`/equipment-issues/${id}`);
    return response.data;
  },

  // Cập nhật báo cáo lỗi thiết bị
  updateEquipmentIssue: async (id: string, data: UpdateEquipmentIssueRequest): Promise<EquipmentIssueResponse> => {
    const response = await api.put(`/equipment-issues/${id}`, data);
    return response.data;
  },

  // Xóa báo cáo lỗi thiết bị
  deleteEquipmentIssue: async (id: string): Promise<EquipmentIssueResponse> => {
    const response = await api.delete(`/equipment-issues/${id}`);
    return response.data;
  },

  // Giải quyết báo cáo lỗi thiết bị
  resolveEquipmentIssue: async (id: string): Promise<EquipmentIssueResponse> => {
    const response = await api.put(`/equipment-issues/${id}/resolve`);
    return response.data;
  },

  // Lấy báo cáo lỗi theo thiết bị
  getEquipmentIssuesByEquipment: async (equipmentId: string, status?: string): Promise<EquipmentIssueListResponse> => {
    const params = status ? { status } : {};
    const response = await api.get(`/equipment-issues/equipment/${equipmentId}`, { params });
    return response.data;
  },

  // Lấy báo cáo lỗi theo người báo cáo
  getEquipmentIssuesByReporter: async (reporterId: string, status?: string): Promise<EquipmentIssueListResponse> => {
    const params = status ? { status } : {};
    const response = await api.get(`/equipment-issues/reporter/${reporterId}`, { params });
    return response.data;
  },

  // Lấy báo cáo lỗi theo trạng thái
  getEquipmentIssuesByStatus: async (status: string): Promise<EquipmentIssueListResponse> => {
    const response = await api.get(`/equipment-issues/status/${status}`);
    return response.data;
  },

  // Lấy báo cáo lỗi đang chờ xử lý
  getPendingEquipmentIssues: async (): Promise<EquipmentIssueListResponse> => {
    const response = await api.get('/equipment-issues/pending');
    return response.data;
  },

  // Lấy báo cáo lỗi đã được giải quyết
  getResolvedEquipmentIssues: async (): Promise<EquipmentIssueListResponse> => {
    const response = await api.get('/equipment-issues/resolved');
    return response.data;
  },

  // Lấy báo cáo lỗi đã bị xóa
  getDeletedEquipmentIssues: async (): Promise<EquipmentIssueListResponse> => {
    const response = await api.get('/equipment-issues/deleted');
    return response.data;
  },

  // Lấy thống kê báo cáo lỗi thiết bị
  getEquipmentIssueStats: async (branchId?: string): Promise<EquipmentIssueStatsResponse> => {
    const params = branchId ? { branchId } : {};
    const response = await api.get('/equipment-issues/stats', { params });
    return response.data;
  },

  // Upload hình ảnh cho báo cáo lỗi thiết bị
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/equipment-issues/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
