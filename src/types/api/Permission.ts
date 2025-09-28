import type { StaffForPermissionModal } from './Staff';

export type PermissionScope = 'global' | 'owner' | 'branch' | 'self';
export type ResourceType = 'branch' | 'owner' | 'self';
export type UserRole = 'CUSTOMER' | 'STAFF' | 'OWNER' | 'ADMIN' | 'SYSTEM_SUPPORT';
export type JobTitle = 'Manager' | 'Personal Trainer' | 'Technician';

export interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: PermissionScope;
  defaultRoles: UserRole[];
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermission {
  _id: string;
  userId: string;
  permissionId: string;
  scope: PermissionScope;
  resourceId?: string;
  resourceType?: ResourceType;
  assignedBy: string;
  expiresAt?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Virtual fields from population
  permissionInfo?: Permission;
  userInfo?: {
    _id: string;
    fullName: string;
    email: string;
    username: string;
  };
  assignedByInfo?: {
    _id: string;
    fullName: string;
    email: string;
    username: string;
  };
}

export interface AssignPermissionRequest {
  userId: string;
  permissionName: string;
  scope: PermissionScope;
  resourceId?: string;
  resourceType?: ResourceType;
}

export interface AssignMultiplePermissionsRequest {
  userId: string;
  permissions: {
    permissionName: string;
    scope: PermissionScope;
    resourceId?: string;
    resourceType?: ResourceType;
  }[];
}

export interface AssignManagerToBranchRequest {
  userId: string;
  branchId: string;
}

export interface AssignManagerToBranchesRequest {
  userId: string;
  branchId: string[];
}

export interface AssignStaffToBranchesRequest {
  userId: string;
  branchId: string[];
  jobTitle: JobTitle;
}

export interface RevokePermissionRequest {
  userId: string;
  permissionName: string;
  resourceId?: string;
  resourceType?: ResourceType;
}

export interface CheckPermissionQuery {
  userId: string;
  permissionName: string;
  resourceId?: string;
  resourceType?: ResourceType;
}

export interface GetUserPermissionsQuery {
  resourceId?: string;
  resourceType?: ResourceType;
}

export interface GetEffectivePermissionsQuery {
  resourceId?: string;
  resourceType?: ResourceType;
}

export interface PermissionAssignmentResult {
  permission: string;
  success: boolean;
  data: UserPermission;
}

export interface MultiplePermissionAssignmentResult {
  branchId?: string;
  success: boolean;
  permissions: PermissionAssignmentResult[];
}

export interface CheckPermissionResponse {
  hasPermission: boolean;
}

export interface GetEffectivePermissionsResponse {
  permissions: string[];
}

export interface GetManagerBranchesResponse {
  _id: string;
  branchName: string;
  location: string;
  ownerId: {
    _id: string;
    fullName: string;
    email: string;
  };
  managerId: string[];
}

export interface GetBranchManagersResponse {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    username: string;
  };
  jobTitle: JobTitle;
}

// Table/List interfaces for UI components
export interface PermissionTableData {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope: PermissionScope;
  defaultRoles: UserRole[];
  isActive: boolean;
  priority: number;
}

export interface UserPermissionTableData {
  _id: string;
  userName: string;
  userEmail: string;
  permissionName: string;
  permissionDescription: string;
  scope: PermissionScope;
  resourceName?: string;
  resourceType?: ResourceType;
  assignedByName: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ManagerBranchTableData {
  _id: string;
  managerName: string;
  managerEmail: string;
  branchName: string;
  branchLocation: string;
  ownerName: string;
  assignedAt: string;
}

// Form interfaces
export interface AssignPermissionFormData {
  userId: string;
  permissionName: string;
  scope: PermissionScope;
  resourceId: string;
  resourceType: ResourceType;
  notes?: string;
}

export interface AssignManagerFormData {
  userId: string;
  branchId: string[];
}

export interface BulkPermissionFormData {
  userIds: string[];
  permissions: {
    permissionName: string;
    scope: PermissionScope;
    resourceId?: string;
    resourceType?: ResourceType;
  }[];
}

// Filter and search interfaces
export interface PermissionFilters {
  resource?: string;
  action?: string;
  scope?: PermissionScope;
  isActive?: boolean;
  search?: string;
}

export interface UserPermissionFilters {
  userId?: string;
  permissionName?: string;
  scope?: PermissionScope;
  resourceType?: ResourceType;
  isActive?: boolean;
  assignedBy?: string;
  search?: string;
}

// Pagination interface
export interface PermissionPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Staff Permission Modal interfaces
export interface StaffPermissionOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffForPermissionModal | null;
  onSuccess?: () => void;
}

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  permissionName: string;
  resource: string;
  action: string;
  scope: PermissionScope; // Add scope field
  disabled?: boolean; // Add disabled flag for UI
}

export interface PermissionGroup {
  resource: string;
  resourceName: string;
  permissions: PermissionItem[];
}
