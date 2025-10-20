import type { User } from './User';
import type { Branch } from './Branch';

export type ExpenseStatus = 'ACTIVE' | 'DELETED';

export type ExpenseCategory =
  | 'EQUIPMENT'
  | 'MAINTENANCE'
  | 'UTILITIES'
  | 'RENT'
  | 'STAFF_SALARY'
  | 'MARKETING'
  | 'INSURANCE'
  | 'SUPPLIES'
  | 'CLEANING'
  | 'SECURITY'
  | 'OTHER';

export interface Expense {
  _id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  branchId: string | Branch;
  createdBy: string | User;
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDisplay {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  branchId: string;
  branchName: string;
  createdBy: string;
  createdByName: string;
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateExpenseRequest {
  category: ExpenseCategory;
  description: string;
  amount: number;
  branchId: string;
}

export interface UpdateExpenseRequest {
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
}

export interface ExpenseFormData {
  category: ExpenseCategory;
  description: string;
  amount: string;
}

export interface ExpenseFilters {
  search: string;
  category: ExpenseCategory | 'all';
  startDate: string;
  endDate: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  averageAmount: number;
  categoryBreakdown: {
    category: ExpenseCategory;
    count: number;
    totalAmount: number;
  }[];
  monthlyTrend: {
    month: string;
    totalAmount: number;
    count: number;
  }[];
}

// Category display mappings
export const EXPENSE_CATEGORY_DISPLAY: Record<ExpenseCategory, string> = {
  EQUIPMENT: 'Thiết bị',
  MAINTENANCE: 'Bảo trì',
  UTILITIES: 'Tiện ích',
  RENT: 'Thuê mặt bằng',
  STAFF_SALARY: 'Lương nhân viên',
  MARKETING: 'Marketing',
  INSURANCE: 'Bảo hiểm',
  SUPPLIES: 'Vật tư',
  CLEANING: 'Vệ sinh',
  SECURITY: 'An ninh',
  OTHER: 'Khác'
};

export const EXPENSE_STATUS_DISPLAY: Record<ExpenseStatus, string> = {
  ACTIVE: 'Hoạt động',
  DELETED: 'Đã xóa'
};

export const getExpenseStatusDisplay = (status: ExpenseStatus): string => {
  return EXPENSE_STATUS_DISPLAY[status] || status;
};
