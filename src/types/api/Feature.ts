// import type { ApiResponse } from './Api';

// ===== FEATURE TYPES =====

/**
 * Feature interface - matches backend API response
 */
export interface Feature {
  _id: string;
  key: string;
  name: string | { vi: string; en: string };
  type: 'PT' | 'CLASS' | 'GENERAL';
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feature interface for frontend display
 */
export interface FeatureDisplay {
  _id: string;
  key: string;
  name: string;
  type: 'PT' | 'CLASS' | 'GENERAL';
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface CreateFeatureRequest {
  key?: string;
  name: string | { vi: string; en: string };
  type?: 'PT' | 'CLASS' | 'GENERAL';
}

export interface UpdateFeatureRequest {
  name?: string | { vi: string; en: string };
  type?: 'PT' | 'CLASS' | 'GENERAL';
  isArchived?: boolean;
}

export interface FeatureListParams {
  page?: number;
  limit?: number;
  sortBy?: 'key' | 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  type?: 'PT' | 'CLASS' | 'GENERAL';
  isArchived?: boolean;
  search?: string;
}

export interface BackendPaginationResponse {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FeatureListResponse {
  success: boolean;
  message: string;
  data: {
    features: Feature[];
    pagination: BackendPaginationResponse;
  };
}

// Frontend Component Types
export interface FeatureFormData {
  name: string;
}

export interface FeatureValue {
  featureId: string;
  value: boolean | number | string | null;
}

export interface FeatureValueDisplay {
  featureId: string;
  featureKey: string;
  featureName: string;
  value: boolean | number | string | null;
  displayValue: string;
  isOverridden?: boolean;
}
