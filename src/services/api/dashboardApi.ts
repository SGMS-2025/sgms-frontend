import type { ApiResponse } from '@/types/api/Api';
import { api } from './api';

export interface DashboardSummary {
  totalRevenue: number;
  periodRevenue?: number;
  revenueGrowth: number;
  newCustomers: number;
  periodNewCustomers?: number;
  newCustomersGrowth: number;
  activeAccounts: number;
  activeAccountsGrowth: number;
  staffBreakdown?: {
    total: number;
    period: number;
    manager: number;
    pt: number;
    technician: number;
  };
}

export interface RevenueChartDataPoint {
  month: string;
  desktop: number;
  mobile: number;
}

export interface RevenueChartResponse {
  data: RevenueChartDataPoint[];
}

export interface TrendDataPoint {
  period: string;
  value: number;
}

export interface TrendsResponse {
  data: TrendDataPoint[];
}

export interface PackageStatistics {
  packageId: string;
  packageName: string;
  status: string;
  duration: string;
  quantitySold: number;
  unitPrice: number;
  totalRevenue: number;
  totalProfit: number;
  weeklyTrend: Array<{ week: string; value: number }>;
}

export interface PackageStatisticsResponse {
  packages: PackageStatistics[];
}

export interface DashboardSummaryParams {
  branchId?: string;
  period?: 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
}

export interface RevenueChartParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: 'month' | 'week';
  breakdown?: 'method' | 'contractType';
  source?: 'subscription' | 'transaction';
}

export interface TrendsParams {
  type?: 'customers' | 'owners' | 'staff' | 'pt';
  year?: number;
  interval?: 'month' | 'week';
  branchId?: string;
}

export interface PackageStatisticsParams {
  branchId?: string;
  year?: number;
}

export const dashboardApi = {
  /**
   * Get dashboard summary (total revenue, new customers, active accounts)
   */
  getDashboardSummary: async (params?: DashboardSummaryParams): Promise<ApiResponse<DashboardSummary>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/dashboard/summary?${queryString}` : '/dashboard/summary';
    const response = await api.get<ApiResponse<DashboardSummary>>(url);
    return response.data;
  },

  /**
   * Get revenue chart data
   */
  getRevenueChart: async (params?: RevenueChartParams): Promise<ApiResponse<RevenueChartResponse>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/dashboard/revenue-chart?${queryString}` : '/dashboard/revenue-chart';
    const response = await api.get<ApiResponse<RevenueChartResponse>>(url);
    return response.data;
  },

  /**
   * Get trends data (customers, staff, PT)
   */
  getTrends: async (params?: TrendsParams): Promise<ApiResponse<TrendsResponse>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/dashboard/trends?${queryString}` : '/dashboard/trends';
    const response = await api.get<ApiResponse<TrendsResponse>>(url);
    return response.data;
  },

  /**
   * Get package statistics
   */
  getPackageStatistics: async (params?: PackageStatisticsParams): Promise<ApiResponse<PackageStatisticsResponse>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/dashboard/packages?${queryString}` : '/dashboard/packages';
    const response = await api.get<ApiResponse<PackageStatisticsResponse>>(url);
    return response.data;
  }
};
