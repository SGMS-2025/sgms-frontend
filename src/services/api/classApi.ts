import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  Class,
  ClassListParams,
  ClassListResponse,
  CreateClassRequest,
  UpdateClassRequest
} from '@/types/api/Class';

export const classApi = {
  // Get all classes with filters
  getClasses: async (params: ClassListParams = {}): Promise<ApiResponse<ClassListResponse>> => {
    const response = await api.get('/classes', { params });
    return response.data;
  },

  // Get class by ID
  getClassById: async (id: string): Promise<ApiResponse<Class>> => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  // Create new class
  createClass: async (data: CreateClassRequest): Promise<ApiResponse<Class>> => {
    const response = await api.post('/classes', data);
    return response.data;
  },

  // Update class
  updateClass: async (id: string, data: UpdateClassRequest): Promise<ApiResponse<Class>> => {
    const response = await api.put(`/classes/${id}`, data);
    return response.data;
  },

  // Delete class
  deleteClass: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  // Get classes by branch
  getClassesByBranch: async (branchId: string): Promise<ApiResponse<Class[]>> => {
    const response = await api.get(`/classes/branch/${branchId}`);
    return response.data;
  },

  // Get classes by instructor
  getClassesByInstructor: async (instructorId: string): Promise<ApiResponse<Class[]>> => {
    const response = await api.get(`/classes/instructor/${instructorId}`);
    return response.data;
  },

  // Search classes
  searchClasses: async (searchTerm: string, branchId?: string): Promise<ApiResponse<Class[]>> => {
    const params = { searchTerm, ...(branchId && { branchId }) };
    const response = await api.get('/classes/search', { params });
    return response.data;
  }
};
