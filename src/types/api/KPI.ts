import type { Staff } from './Staff';
import type { Branch } from './Branch';

// KPI Period Types
export type KPIPeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

// KPI Status
export type KPIStatus = 'ACTIVE' | 'CANCELLED';

// KPI Achievement Status
export type KPIAchievementStatus = 'IN_PROGRESS' | 'COMPLETED';

// KPI Actuals
export interface KPIActual {
  revenue: {
    total: number;
    newMember: number;
    ptSession: number;
    vipRevenue: number;
  };
  members: {
    newMembers: number;
    vipNewMembers: number;
  };
  sessions: {
    ptSessions: number;
    vipPtSessions: number;
  };
}

// KPI Commission
export interface KPICommission {
  baseRate: number;
  applicableRate: number;
  amount: number;
  breakdown: {
    newMember: number;
    ptSession: number;
    vipBonus: number;
  };
}

// KPI Bonus
export interface KPIBonus {
  qualified: boolean;
  amount: number;
  reason?: string;
}

// KPI Rankings
export interface KPIRankings {
  branch?: number;
  owner?: number;
}

// KPI Config
export interface KPIConfig {
  _id: string;
  ownerId: string;
  branchId: string | Branch;
  staffId?: string | Staff;
  roleType?: string;
  isTemplate?: boolean;
  periodType: KPIPeriodType;
  startDate: string;
  endDate: string;
  commissionRate?: number;
  newCustomerBonus?: number; // Tiền mời khách hàng mới (VND)
  status: KPIStatus;
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// KPI Achievement
export interface KPIAchievement {
  _id: string;
  kpiConfigId: string;
  ownerId: string;
  branchId: string | Branch;
  staffId: string | Staff;
  periodType: KPIPeriodType;
  startDate: string;
  endDate: string;
  actual: KPIActual;
  commission: KPICommission;
  bonus: KPIBonus;
  rankings: KPIRankings;
  status: KPIAchievementStatus;
  lastCalculatedAt: string;
  calculationVersion: number;
  createdAt: string;
  updatedAt: string;
}

// KPI Config with Achievement
export interface KPIConfigWithAchievement {
  config: KPIConfig;
  achievement: KPIAchievement;
}

// Create KPI Request
export interface CreateKPIRequest {
  staffId?: string; // Optional - if not provided, creates branch-wide KPI
  branchId: string;
  periodType: KPIPeriodType;
  startDate: string;
  endDate: string;
  commissionRate?: number;
  newCustomerBonus?: number; // Tiền mời khách hàng mới (VND)
  notes?: string;
  roleType?: string; // Required if staffId is not provided
}

// Update KPI Request
export interface UpdateKPIRequest {
  commissionRate?: number;
  newCustomerBonus?: number; // Tiền mời khách hàng mới (VND)
  notes?: string;
  status?: KPIStatus;
}

// KPI List Params
export interface KPIListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  branchId?: string;
  staffId?: string;
  status?: KPIStatus;
  periodType?: KPIPeriodType;
  startDate?: string;
  endDate?: string;
}

// KPI List Response
export interface KPIListResponse {
  kpiConfigs: KPIConfig[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// KPI Achievements Response
export interface KPIAchievementsResponse {
  achievements: KPIConfigWithAchievement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// KPI New Customer Data
export interface KPINewCustomer {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageName: string;
  packageType: string;
  amount: number;
  transactionDate: string;
  contractId: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

// KPI PT Session Data
export interface KPIPTSession {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  ptId: string;
  ptName: string;
  ptEmail: string;
  ptJobTitle: string;
  packageName: string;
  packageType: string;
  amount: number;
  transactionDate: string;
  contractId: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

// KPI Dashboard Data
export interface KPIDashboardData {
  totalStaff: number;
  totalRevenue: number;
  avgAchievementRate: number;
  topPerformers: Array<{
    staffId: string;
    staffName: string;
    achievementRate: number;
    revenue: number;
  }>;
  kpiStats: {
    active: number;
    cancelled: number;
  };
}

// KPI Display (for UI)
export interface KPIDisplay {
  id: string;
  staffName: string;
  branchName: string;
  period: string;
  actualRevenue: number;
  commission: number;
  ranking?: number;
  status: KPIStatus;
}

// Branch-wide KPI Creation Response
export interface BranchWideKPIResponse {
  message: string;
  count: number;
  kpiConfigs: KPIConfig[];
}

// Recalculate KPI Response
export interface RecalculateKPIResponse {
  achievement: KPIAchievement;
  recalculatedAt: string;
}

// Recalculate All KPIs Response
export interface RecalculateAllKPIsResponse {
  totalRecalculated: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    kpiConfigId: string;
    success: boolean;
    error?: string;
  }>;
}

// Type guard for Branch-wide KPI Response
export function isBranchWideKPIResponse(data: KPIConfig | BranchWideKPIResponse): data is BranchWideKPIResponse {
  return typeof data === 'object' && data !== null && 'count' in data && 'message' in data;
}

// Populated Staff (for KPI Config with populated staffId)
export interface PopulatedStaff {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    username: string;
    email: string;
  };
  jobTitle: string;
}

// Populated Branch (for KPI Config with populated branchId)
export interface PopulatedBranch {
  _id: string;
  branchName: string;
  location: string;
}

// Populated User (for Staff.userId when populated)
export interface PopulatedUser {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  gender?: string;
  avatar?: {
    publicId?: string;
    url?: string;
  };
  status?: string;
}

// Type guard for Populated User in Staff.userId
export function isPopulatedUser(userId: string | PopulatedUser | undefined): userId is PopulatedUser {
  return typeof userId === 'object' && userId !== null && userId !== undefined && 'fullName' in userId;
}

// Type guard for Populated Staff in KPIConfig
export function isKPIConfigPopulatedStaff(staffId: string | Staff | undefined): staffId is Staff {
  return typeof staffId === 'object' && staffId !== null && staffId !== undefined && 'userId' in staffId;
}

// Type guard for Populated Branch in KPIConfig
export function isKPIConfigPopulatedBranch(branchId: string | Branch): branchId is Branch {
  return typeof branchId === 'object' && branchId !== null && 'branchName' in branchId;
}

// ===== Hook Return Types =====

// KPI List Pagination (for hooks)
export interface KPIListPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Hook: useKPIList return type
export interface UseKPIListReturn {
  kpiList: KPIDisplay[];
  loading: boolean;
  error: string | null;
  pagination: KPIListPagination | null;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: Partial<KPIListParams>) => void;
  goToPage: (page: number) => void;
}

// Hook: useMyKPI return type
export interface UseMyKPIReturn {
  myKPIs: KPIConfigWithAchievement[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Hook: useKPIDetails return type
export interface UseKPIDetailsReturn {
  kpiConfig: KPIConfig | null;
  achievement: KPIAchievement | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Hook: useKPIDashboard params
export interface UseKPIDashboardParams {
  branchId?: string;
  periodType?: string;
}

// Hook: useKPIDashboard return type
export interface UseKPIDashboardReturn {
  dashboardData: KPIDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
