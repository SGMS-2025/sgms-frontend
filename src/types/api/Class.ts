import type { BaseEntity, Status, BranchReference, UserReference, PaginationResponse } from '../common/BaseTypes';

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Class extends BaseEntity {
  className: string;
  description?: string;
  duration: number; // in minutes
  maxCapacity: number;
  price: number;
  status: Status;
  branchId: BranchReference;
  instructorId?: UserReference;
  category: string;
  difficulty: Difficulty;
  equipment?: string[];
  requirements?: string[];
}

export interface CreateClassRequest {
  className: string;
  description?: string;
  duration: number;
  maxCapacity: number;
  price: number;
  branchId: string;
  instructorId?: string;
  category: string;
  difficulty: Difficulty;
  equipment?: string[];
  requirements?: string[];
}

export interface UpdateClassRequest {
  className?: string;
  description?: string;
  duration?: number;
  maxCapacity?: number;
  price?: number;
  branchId?: string;
  instructorId?: string;
  category?: string;
  difficulty?: Difficulty;
  equipment?: string[];
  requirements?: string[];
  status?: Status;
}

export interface ClassListParams {
  page?: number;
  limit?: number;
  branchId?: string;
  status?: Status;
  category?: string;
  difficulty?: Difficulty;
  search?: string;
  sortBy?: 'className' | 'createdAt' | 'price' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface ClassListResponse {
  classes: Class[];
  pagination: PaginationResponse;
}
