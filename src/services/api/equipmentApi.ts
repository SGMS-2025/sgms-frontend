import { api } from './api';
import axios from 'axios';
import type { ApiResponse } from '@/types/api/Api';
import type {
  Equipment,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  AddMaintenanceLogRequest,
  UpdateMaintenanceLogRequest,
  MaintenanceLogQueryParams,
  MaintenanceLogListResponse,
  AddEquipmentConditionRequest,
  EquipmentQueryParams,
  EquipmentStats,
  EquipmentListResponse,
  ExcelImportResult,
  MaintenanceLog
} from '../../types/api/Equipment';

class EquipmentApi {
  async createEquipment(data: CreateEquipmentRequest): Promise<ApiResponse<Equipment>> {
    const response = await api.post('/equipments', data);
    return response.data;
  }

  async getEquipments(params: EquipmentQueryParams = {}): Promise<EquipmentListResponse> {
    const response = await api.get<EquipmentListResponse>('/equipments', { params });
    return response.data;
  }

  async getEquipmentById(id: string): Promise<ApiResponse<Equipment>> {
    const response = await api.get(`/equipments/${id}`);
    return response.data;
  }

  async updateEquipment(id: string, data: UpdateEquipmentRequest): Promise<ApiResponse<Equipment>> {
    const response = await api.put(`/equipments/${id}`, data);
    return response.data;
  }

  async deleteEquipment(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/equipments/${id}`);
    return response.data;
  }

  async updateEquipmentStatus(id: string, status: string): Promise<ApiResponse<Equipment>> {
    const response = await api.patch(`/equipments/${id}/status`, { status });
    return response.data;
  }

  async addMaintenanceLog(id: string, data: AddMaintenanceLogRequest): Promise<ApiResponse<Equipment>> {
    const response = await api.post(`/equipments/${id}/maintenance-logs`, data);
    return response.data;
  }

  async getMaintenanceLogs(id: string, params: MaintenanceLogQueryParams = {}): Promise<MaintenanceLogListResponse> {
    const response = await api.get<MaintenanceLogListResponse>(`/equipments/${id}/maintenance-logs`, { params });
    return response.data;
  }

  async getMaintenanceLogById(id: string, logId: string): Promise<ApiResponse<MaintenanceLog>> {
    const response = await api.get(`/equipments/${id}/maintenance-logs/${logId}`);
    return response.data;
  }

  async updateMaintenanceLog(
    id: string,
    logId: string,
    data: UpdateMaintenanceLogRequest
  ): Promise<ApiResponse<MaintenanceLog>> {
    const response = await api.put(`/equipments/${id}/maintenance-logs/${logId}`, data);
    return response.data;
  }

  async deleteMaintenanceLog(id: string, logId: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/equipments/${id}/maintenance-logs/${logId}`);
    return response.data;
  }

  async uploadMaintenanceLogImages(files: File[]): Promise<ApiResponse<{ publicId: string; url: string }[]>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(`images`, file);
    });

    const response = await api.post('/equipments/maintenance-logs/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }

  async addEquipmentCondition(id: string, data: AddEquipmentConditionRequest): Promise<ApiResponse<Equipment>> {
    const response = await api.post(`/equipments/${id}/conditions`, data);
    return response.data;
  }

  async getEquipmentsByBranch(branchId: string, status?: string): Promise<ApiResponse<Equipment[]>> {
    const params = status ? { status } : {};
    const response = await api.get(`/equipments/branch/${branchId}`, { params });
    return response.data;
  }

  async getEquipmentsByCategory(category: string): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get(`/equipments/category/${category}`);
    return response.data;
  }

  async getEquipmentByCode(equipmentCode: string): Promise<ApiResponse<Equipment>> {
    const response = await api.get(`/equipments/code/${equipmentCode}`);
    return response.data;
  }

  async getEquipmentsExpiringWarranty(daysAhead: number = 30): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get(`/equipments/expiring-warranty`, {
      params: { daysAhead }
    });
    return response.data;
  }

  async getEquipmentsNeedingMaintenance(): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get('/equipments/needing-maintenance');
    return response.data;
  }

  async getEquipmentStats(branchId?: string): Promise<ApiResponse<EquipmentStats>> {
    const params = branchId ? { branchId } : {};
    const response = await api.get('/equipments/stats', { params });
    return response.data;
  }

  async uploadImage(file: File): Promise<ApiResponse<{ publicId: string; url: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/equipments/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }

  async generateQRCode(equipmentId: string): Promise<ApiResponse<Equipment>> {
    const response = await api.post(`/equipments/${equipmentId}/generate-qr`);
    return response.data;
  }

  async downloadQRCode(equipmentId: string): Promise<Blob> {
    const response = await api.get(`/equipments/${equipmentId}/qr-download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getQRCodeData(equipmentId: string): Promise<ApiResponse<{ qrData: string; qrImageUrl: string }>> {
    const response = await api.get(`/equipments/${equipmentId}/qr-data`);
    return response.data;
  }

  async downloadAllQRCodes(branchId: string): Promise<Blob> {
    const response = await api.get(`/equipments/branch/${branchId}/qr-download-all`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadEquipmentTemplate(): Promise<Blob> {
    const response = await api.get('/equipments/template/download', {
      responseType: 'blob'
    });
    return response.data;
  }

  async importEquipmentFromExcel(file: File, branchId: string): Promise<ApiResponse<ExcelImportResult>> {
    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('branchId', branchId);

    // Use direct axios call to bypass response interceptor for detailed error handling
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/equipments/import/excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true,
      timeout: 60000, // 60 seconds timeout for large files
      onUploadProgress: (progressEvent) => {
        // Optional: Add progress tracking if needed
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        console.log(`Upload Progress: ${percentCompleted}%`);
      }
    });

    return response.data;
  }
}

export const equipmentApi = new EquipmentApi();
