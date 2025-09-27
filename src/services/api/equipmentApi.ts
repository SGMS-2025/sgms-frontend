import { api } from './api';
import axios from 'axios';
import type { ApiResponse } from '@/types/api/Api';
import type {
  Equipment,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  AddMaintenanceLogRequest,
  AddEquipmentConditionRequest,
  EquipmentQueryParams,
  EquipmentStats,
  EquipmentListResponse,
  ExcelImportResult
} from '../../types/api/Equipment';

class EquipmentApi {
  // Tạo thiết bị mới
  async createEquipment(data: CreateEquipmentRequest): Promise<ApiResponse<Equipment>> {
    const response = await api.post('/equipments', data);
    return response.data;
  }

  // Lấy danh sách thiết bị
  async getEquipments(params: EquipmentQueryParams = {}): Promise<EquipmentListResponse> {
    const response = await api.get<EquipmentListResponse>('/equipments', { params });
    return response.data;
  }

  // Lấy thông tin chi tiết thiết bị
  async getEquipmentById(id: string): Promise<ApiResponse<Equipment>> {
    const response = await api.get(`/equipments/${id}`);
    return response.data;
  }

  // Cập nhật thiết bị
  async updateEquipment(id: string, data: UpdateEquipmentRequest): Promise<ApiResponse<Equipment>> {
    const response = await api.put(`/equipments/${id}`, data);
    return response.data;
  }

  // Xóa thiết bị
  async deleteEquipment(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/equipments/${id}`);
    return response.data;
  }

  // Cập nhật trạng thái thiết bị
  async updateEquipmentStatus(id: string, status: string): Promise<ApiResponse<Equipment>> {
    const response = await api.patch(`/equipments/${id}/status`, { status });
    return response.data;
  }

  // Thêm log bảo trì
  async addMaintenanceLog(id: string, data: AddMaintenanceLogRequest): Promise<ApiResponse<Equipment>> {
    const response = await api.post(`/equipments/${id}/maintenance-logs`, data);
    return response.data;
  }

  // Thêm tình trạng thiết bị
  async addEquipmentCondition(id: string, data: AddEquipmentConditionRequest): Promise<ApiResponse<Equipment>> {
    const response = await api.post(`/equipments/${id}/conditions`, data);
    return response.data;
  }

  // Lấy thiết bị theo chi nhánh
  async getEquipmentsByBranch(branchId: string, status?: string): Promise<ApiResponse<Equipment[]>> {
    const params = status ? { status } : {};
    const response = await api.get(`/equipments/branch/${branchId}`, { params });
    return response.data;
  }

  // Lấy thiết bị theo loại
  async getEquipmentsByCategory(category: string): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get(`/equipments/category/${category}`);
    return response.data;
  }

  // Lấy thiết bị theo mã thiết bị
  async getEquipmentByCode(equipmentCode: string): Promise<ApiResponse<Equipment>> {
    const response = await api.get(`/equipments/code/${equipmentCode}`);
    return response.data;
  }

  // Lấy thiết bị sắp hết bảo hành
  async getEquipmentsExpiringWarranty(daysAhead: number = 30): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get(`/equipments/expiring-warranty`, {
      params: { daysAhead }
    });
    return response.data;
  }

  // Lấy thiết bị cần bảo trì
  async getEquipmentsNeedingMaintenance(): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get('/equipments/needing-maintenance');
    return response.data;
  }

  // Lấy thống kê thiết bị
  async getEquipmentStats(branchId?: string): Promise<ApiResponse<EquipmentStats>> {
    const params = branchId ? { branchId } : {};
    const response = await api.get('/equipments/stats', { params });
    return response.data;
  }

  // Upload hình ảnh
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

  // Generate QR code cho thiết bị
  async generateQRCode(equipmentId: string): Promise<ApiResponse<Equipment>> {
    const response = await api.post(`/equipments/${equipmentId}/generate-qr`);
    return response.data;
  }

  // Download QR code
  async downloadQRCode(equipmentId: string): Promise<Blob> {
    const response = await api.get(`/equipments/${equipmentId}/qr-download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Lấy QR code data
  async getQRCodeData(equipmentId: string): Promise<ApiResponse<{ qrData: string; qrImageUrl: string }>> {
    const response = await api.get(`/equipments/${equipmentId}/qr-data`);
    return response.data;
  }

  // Download tất cả QR codes của chi nhánh
  async downloadAllQRCodes(branchId: string): Promise<Blob> {
    const response = await api.get(`/equipments/branch/${branchId}/qr-download-all`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Download Excel template
  async downloadEquipmentTemplate(): Promise<Blob> {
    const response = await api.get('/equipments/template/download', {
      responseType: 'blob'
    });
    return response.data;
  }

  // Import equipment from Excel
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
