// ===== PACKAGE TYPES =====

export type PackageStatus = 'ACTIVE' | 'INACTIVE';
export type PackageType = 'PT' | 'CLASS';

/**
 * Service Package interface - matches backend API response
 */
export interface ServicePackage {
  _id: string;
  name: string;
  description?: string;
  type: PackageType;
  defaultDurationMonths: number;
  defaultPriceVND?: number;
  minParticipants: number;
  maxParticipants?: number;
  status: PackageStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service Package interface for frontend display
 */
export interface ServicePackageDisplay {
  _id: string;
  name: string;
  description?: string;
  type: PackageType;
  defaultDurationMonths: number;
  defaultPriceVND?: number;
  minParticipants: number;
  maxParticipants?: number;
  status: PackageStatus;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface CreatePackageRequest {
  name: string;
  description?: string;
  type?: PackageType;
  defaultDurationMonths?: number;
  defaultPriceVND?: number;
  minParticipants?: number;
  maxParticipants?: number;
  status?: PackageStatus;
}

export interface UpdatePackageRequest {
  name?: string;
  description?: string;
  type?: PackageType;
  defaultDurationMonths?: number;
  defaultPriceVND?: number;
  minParticipants?: number;
  maxParticipants?: number;
  status?: PackageStatus;
}

export interface PackageListParams {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'type' | 'status' | 'defaultDurationMonths' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  status?: PackageStatus;
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

export interface PackageListResponse {
  success: boolean;
  message: string;
  data: {
    packages: ServicePackage[];
    pagination: BackendPaginationResponse;
  };
}

// Frontend Component Types
export interface PackageFormData {
  name: string;
  description?: string;
  type?: PackageType;
  defaultDurationMonths?: number;
  defaultPriceVND?: number;
  minParticipants?: number;
  maxParticipants?: number;
}

// Tooltip data interface
export interface PackageTooltipData {
  name: string;
  type: PackageType;
  displayPriceVND?: number;
  displayDurationMonths: number;
  displayMinParticipants: number;
  description?: string;
  maxParticipants?: number;
  hasOverride: boolean;
  overrideStatus?: string;
}

// Legacy types for backward compatibility with existing component
export interface LegacyService {
  id: string;
  name: string;
  type?: PackageType;
  price?: number;
  durationInMonths?: number;
  status?: 'active' | 'inactive';
}

// Conversion utilities will be needed to map between legacy and new types
