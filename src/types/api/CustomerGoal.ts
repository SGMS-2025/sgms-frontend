// Customer Goal API Types

export interface CustomerGoalTargets {
  weight?: number;
  bmi?: number;
  strength?: number;
  bodyFatPercentage?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  muscleMassPercentage?: number;
  bodyWaterPercentage?: number;
  metabolicAge?: number;
}

export interface CustomerGoal {
  _id: string;
  id?: string;
  customerId: string;
  serviceContractId?: string;
  trainerId?: string;
  branchId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  targets: CustomerGoalTargets;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  customerName?: string;
  customerAvatar?: string;
  trainerName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  // Virtual fields
  daysRemaining?: number;
  totalDays?: number;
  daysElapsed?: number;
  timeProgress?: number;
}

export interface CustomerGoalDisplay extends CustomerGoal {
  // Computed fields for display
  progressPercentage?: number; // Overall progress based on current vs target
}

export interface CreateCustomerGoalRequest {
  customerId: string;
  serviceContractId?: string;
  trainerId?: string;
  branchId?: string; // Optional - backend will extract from serviceContract if available
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  targets: CustomerGoalTargets;
}

export interface UpdateCustomerGoalRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  targets?: Partial<CustomerGoalTargets>;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
}

export interface CustomerGoalListParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'startDate' | 'endDate';
  sortOrder?: 'asc' | 'desc';
  customerId?: string;
  trainerId?: string;
  branchId?: string;
  serviceContractId?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
}

export interface BackendPaginationResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CustomerGoalListResponse {
  goals: CustomerGoal[];
  pagination: BackendPaginationResponse;
}
