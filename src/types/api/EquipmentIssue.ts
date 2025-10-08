export interface EquipmentIssueImage {
  publicId: string;
  url: string;
  uploadedAt: string;
}

export interface EquipmentIssue {
  _id: string;
  equipment_id: {
    _id: string;
    equipmentName: string;
    equipmentCode: string;
    category: string;
    branchId?: string;
  };
  reported_by: {
    _id: string;
    fullName: string;
    email: string;
  };
  reason: string;
  images?: EquipmentIssueImage[];
  status: 'pending' | 'resolved' | 'delete';
  resolved_by?: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentIssueRequest {
  equipment_id: string;
  reason: string;
  images?: EquipmentIssueImage[];
}

export interface UpdateEquipmentIssueRequest {
  reason?: string;
  images?: EquipmentIssueImage[];
  status?: 'pending' | 'resolved' | 'delete';
}

export interface EquipmentIssueStats {
  totalIssues: number;
  statusStats: {
    pending: number;
    resolved: number;
    deleted: number;
  };
  statusBreakdown: Array<{
    _id: string;
    count: number;
  }>;
}

export interface EquipmentIssueListResponse {
  success: boolean;
  message: string;
  data: EquipmentIssue[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface EquipmentIssueResponse {
  success: boolean;
  message: string;
  data: EquipmentIssue;
}

export interface EquipmentIssueStatsResponse {
  success: boolean;
  message: string;
  data: EquipmentIssueStats;
}
