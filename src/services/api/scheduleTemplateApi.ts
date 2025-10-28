import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  ScheduleTemplate,
  ScheduleTemplateListParams,
  ScheduleTemplateApiResponse,
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest,
  AutoGenerateSettings,
  ScheduleTemplateStats
} from '@/types/api/ScheduleTemplate';

export const scheduleTemplateApi = {
  // Get all schedule templates with filters
  getScheduleTemplates: async (params: ScheduleTemplateListParams = {}): Promise<ScheduleTemplateApiResponse> => {
    const response = await api.get('/schedule-templates', { params });
    return response.data;
  },

  // Get schedule template by ID
  getScheduleTemplateById: async (id: string): Promise<ApiResponse<ScheduleTemplate>> => {
    const response = await api.get(`/schedule-templates/${id}`);
    return response.data;
  },

  // Check if template name exists
  checkTemplateNameExists: async (name: string): Promise<ApiResponse<{ exists: boolean }>> => {
    const response = await api.get(`/schedule-templates/check-name`, {
      params: { name }
    });
    return response.data;
  },

  // Create new schedule template
  createScheduleTemplate: async (data: CreateScheduleTemplateRequest): Promise<ApiResponse<ScheduleTemplate>> => {
    const response = await api.post('/schedule-templates', data);
    return response.data;
  },

  // Update schedule template
  updateScheduleTemplate: async (
    id: string,
    data: UpdateScheduleTemplateRequest
  ): Promise<ApiResponse<ScheduleTemplate>> => {
    const response = await api.put(`/schedule-templates/${id}`, data);
    return response.data;
  },

  // Activate schedule template
  activateScheduleTemplate: async (id: string): Promise<ApiResponse<ScheduleTemplate>> => {
    const response = await api.patch(`/schedule-templates/${id}/activate`);
    return response.data;
  },

  // Deactivate schedule template
  deactivateScheduleTemplate: async (id: string): Promise<ApiResponse<ScheduleTemplate>> => {
    const response = await api.patch(`/schedule-templates/${id}/deactivate`);
    return response.data;
  },

  // Update auto generation settings
  updateAutoGenerateSettings: async (
    id: string,
    data: AutoGenerateSettings
  ): Promise<ApiResponse<ScheduleTemplate>> => {
    const response = await api.patch(`/schedule-templates/${id}/auto-generate`, data);
    return response.data;
  },

  // Get templates for auto generation
  getAutoGenerateTemplates: async (): Promise<ApiResponse<ScheduleTemplate[]>> => {
    const response = await api.get('/schedule-templates/auto-generate');
    return response.data;
  },

  // Get templates by branch
  getTemplatesByBranch: async (
    branchId: string,
    activeOnly: boolean = true
  ): Promise<ApiResponse<ScheduleTemplate[]>> => {
    const response = await api.get(`/schedule-templates/branch/${branchId}?activeOnly=${activeOnly}`);
    return response.data;
  },

  // Get templates by type
  getTemplatesByType: async (type: string, branchId?: string): Promise<ApiResponse<ScheduleTemplate[]>> => {
    const params = branchId ? { branchId } : {};
    const response = await api.get(`/schedule-templates/type/${type}`, { params });
    return response.data;
  },

  // Search templates
  searchTemplates: async (searchTerm: string, branchId?: string): Promise<ApiResponse<ScheduleTemplate[]>> => {
    const params = { searchTerm, ...(branchId && { branchId }) };
    const response = await api.get('/schedule-templates/search', { params });
    return response.data;
  },

  // Get template statistics
  getTemplateStats: async (branchId?: string): Promise<ApiResponse<ScheduleTemplateStats>> => {
    const params = branchId && branchId !== 'all' ? { branchId } : {};
    const response = await api.get('/schedule-templates/stats', { params });
    return response.data;
  },

  // Increment template usage
  incrementTemplateUsage: async (id: string): Promise<ApiResponse<ScheduleTemplate>> => {
    const response = await api.post(`/schedule-templates/${id}/increment-usage`);
    return response.data;
  },

  // Delete schedule template (soft delete)
  deleteScheduleTemplate: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/schedule-templates/${id}`);
    return response.data;
  }
};
