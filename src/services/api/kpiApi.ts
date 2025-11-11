import type { ApiResponse, PaginatedApiResponse } from '@/types/api/Api';
import { api } from './api';
import type {
  KPIConfig,
  KPIConfigWithAchievement,
  CreateKPIRequest,
  UpdateKPIRequest,
  KPIListParams,
  KPIDashboardData,
  BranchWideKPIResponse,
  RecalculateKPIResponse,
  RecalculateAllKPIsResponse,
  KPINewCustomer,
  KPIPTSession
} from '@/types/api/KPI';

export const kpiApi = {
  /**
   * Create a new KPI configuration
   * Supports both individual (staffId) and branch-wide (no staffId) KPI creation
   */
  createKPI: async (kpiData: CreateKPIRequest): Promise<ApiResponse<KPIConfig | BranchWideKPIResponse>> => {
    const response = await api.post<ApiResponse<KPIConfig | BranchWideKPIResponse>>('/kpi/configs', kpiData);
    return response.data;
  },

  /**
   * Get paginated list of KPI configurations
   */
  getKPIList: async (params?: KPIListParams): Promise<PaginatedApiResponse<KPIConfig[]>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/kpi/configs?${queryString}` : '/kpi/configs';
    const response = await api.get<PaginatedApiResponse<KPIConfig[]>>(url);
    return response.data;
  },

  /**
   * Get KPI configuration by ID
   */
  getKPIById: async (id: string): Promise<ApiResponse<KPIConfig>> => {
    const response = await api.get<ApiResponse<KPIConfig>>(`/kpi/configs/${id}`);
    return response.data;
  },

  /**
   * Update KPI configuration
   */
  updateKPI: async (id: string, updateData: UpdateKPIRequest): Promise<ApiResponse<KPIConfig>> => {
    const response = await api.patch<ApiResponse<KPIConfig>>(`/kpi/configs/${id}`, updateData);
    return response.data;
  },

  /**
   * Disable KPI configuration (soft delete)
   */
  disableKPI: async (id: string): Promise<ApiResponse<KPIConfig>> => {
    const response = await api.patch<ApiResponse<KPIConfig>>(`/kpi/configs/${id}/disable`);
    return response.data;
  },

  /**
   * Get KPI achievements list (with config and achievement data)
   * Response structure: { success, message, data: KPIConfigWithAchievement[], pagination }
   */
  getAchievements: async (params?: KPIListParams): Promise<PaginatedApiResponse<KPIConfigWithAchievement[]>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/kpi/achievements?${queryString}` : '/kpi/achievements';
    const response = await api.get<PaginatedApiResponse<KPIConfigWithAchievement[]>>(url);
    return response.data;
  },

  /**
   * Get my KPI (for staff - their own KPI)
   */
  getMyKPI: async (): Promise<ApiResponse<KPIConfigWithAchievement[]>> => {
    const response = await api.get<ApiResponse<KPIConfigWithAchievement[]>>('/kpi/achievements/my-kpi');
    return response.data;
  },

  /**
   * Get achievement by ID
   */
  getAchievementById: async (id: string): Promise<ApiResponse<KPIConfigWithAchievement>> => {
    const response = await api.get<ApiResponse<KPIConfigWithAchievement>>(`/kpi/achievements/${id}`);
    return response.data;
  },

  /**
   * Recalculate a specific KPI
   */
  recalculateKPI: async (id: string): Promise<ApiResponse<RecalculateKPIResponse>> => {
    const response = await api.post<ApiResponse<RecalculateKPIResponse>>(`/kpi/configs/${id}/recalculate`);
    return response.data;
  },

  /**
   * Recalculate all KPIs (Owner only)
   */
  recalculateAllKPIs: async (): Promise<ApiResponse<RecalculateAllKPIsResponse>> => {
    const response = await api.post<ApiResponse<RecalculateAllKPIsResponse>>('/kpi/recalculate-all');
    return response.data;
  },

  /**
   * Get KPI dashboard data
   */
  getDashboard: async (params?: { branchId?: string; periodType?: string }): Promise<ApiResponse<KPIDashboardData>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/kpi/dashboard?${queryString}` : '/kpi/dashboard';
    const response = await api.get<ApiResponse<KPIDashboardData>>(url);
    return response.data;
  },

  /**
   * Get KPI statistics (total, active, cancelled)
   */
  getKPIStats: async (
    params?: KPIListParams
  ): Promise<ApiResponse<{ total: number; active: number; cancelled: number }>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/kpi/stats?${queryString}` : '/kpi/stats';
    const response = await api.get<ApiResponse<{ total: number; active: number; cancelled: number }>>(url);
    return response.data;
  },

  /**
   * Get new customers list for a KPI
   */
  getNewCustomers: async (kpiId: string): Promise<ApiResponse<KPINewCustomer[]>> => {
    const response = await api.get<ApiResponse<KPINewCustomer[]>>(`/kpi/achievements/${kpiId}/new-customers`);
    return response.data;
  },

  /**
   * Get PT sessions list for a KPI
   */
  getPTSessions: async (kpiId: string): Promise<ApiResponse<KPIPTSession[]>> => {
    const response = await api.get<ApiResponse<KPIPTSession[]>>(`/kpi/achievements/${kpiId}/pt-sessions`);
    return response.data;
  }
};
