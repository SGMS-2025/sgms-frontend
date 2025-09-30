export interface EquipmentImage {
  publicId: string;
  url: string;
}

export interface EquipmentQRCode {
  publicId: string;
  url: string;
  data: string;
  generatedAt: string;
}

export interface MaintenanceLog {
  _id: string;
  description: string;
  loggedBy: string;
  createdAt: string;
}

export interface EquipmentCondition {
  _id: string;
  condition: EquipmentConditionType;
  images: EquipmentImage[];
  checkDate: string;
  checkedBy?: string;
}

export type EquipmentStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REPAIR' | 'RETIRED';

export type EquipmentCategory =
  | 'CARDIO'
  | 'STRENGTH'
  | 'FUNCTIONAL'
  | 'FLEXIBILITY'
  | 'SPORTS'
  | 'ACCESSORIES'
  | 'OTHER';

export type EquipmentConditionType = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'NEEDS_MAINTENANCE' | 'OUT_OF_ORDER';

export interface Equipment {
  _id: string;
  equipmentCode: string;
  equipmentName: string;
  category: EquipmentCategory;
  branchId: string;
  manufacturer: string;
  price: string;
  dateOfPurchase: string;
  warrantyExpirationDate: string;
  status: EquipmentStatus;
  location?: string;
  images: EquipmentImage[];
  qrCode?: EquipmentQRCode;
  maintenanceLogs: MaintenanceLog[];
  equipmentCondition: EquipmentCondition[];
  createdBy: string;
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  imagesCount?: number;
  maintenanceLogsCount?: number;
  equipmentConditionCount?: number;
  latestCondition?: EquipmentCondition;
  latestMaintenanceLog?: MaintenanceLog;
  hasQRCode?: boolean;
  qrCodeData?: QRCodeData;
}

export interface CreateEquipmentRequest {
  equipmentCode?: string; // Optional - sẽ được auto-generate nếu không có
  equipmentName: string;
  category: EquipmentCategory;
  branchId: string;
  manufacturer: string;
  price: string;
  dateOfPurchase: string;
  warrantyExpirationDate: string;
  status?: EquipmentStatus;
  location?: string;
  images?: EquipmentImage[];
}

export interface UpdateEquipmentRequest {
  equipmentCode?: string;
  equipmentName?: string;
  category?: EquipmentCategory;
  branchId?: string;
  manufacturer?: string;
  price?: string;
  dateOfPurchase?: string;
  warrantyExpirationDate?: string;
  status?: EquipmentStatus;
  location?: string;
  images?: EquipmentImage[];
}

export interface AddMaintenanceLogRequest {
  description: string;
}

export interface AddEquipmentConditionRequest {
  condition: EquipmentConditionType;
  images?: EquipmentImage[];
}

export interface EquipmentQueryParams {
  page?: number;
  limit?: number;
  branchId?: string;
  category?: EquipmentCategory;
  status?: EquipmentStatus;
  manufacturer?: string;
  search?: string;
  sortBy?: 'equipmentName' | 'dateOfPurchase' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface EquipmentStats {
  totalEquipments: number;
  statusStats: {
    active: number;
    maintenance: number;
    repair: number;
    retired: number;
  };
  categoryStats: Array<{
    _id: EquipmentCategory;
    count: number;
  }>;
}

export interface EquipmentListResponse {
  success: boolean;
  message: string;
  data: Equipment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
  requestId?: string;
  // Legacy format support
  equipments?: Equipment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Status display mappings (colors and icons only, labels will be translated)
export const EQUIPMENT_STATUS_DISPLAY = {
  ACTIVE: { color: 'green', icon: '✓' },
  INACTIVE: { color: 'gray', icon: '○' },
  MAINTENANCE: { color: 'yellow', icon: '🔧' },
  REPAIR: { color: 'orange', icon: '⚠️' },
  RETIRED: { color: 'red', icon: '❌' }
};

// Function to get status display with translated labels
export const getEquipmentStatusDisplay = (status: string, t: (key: string) => string) => {
  const statusInfo = EQUIPMENT_STATUS_DISPLAY[status as keyof typeof EQUIPMENT_STATUS_DISPLAY];
  if (!statusInfo) return { label: status, color: 'gray', icon: '○' };

  const labelKey = `equipment.status.${status.toLowerCase()}`;
  return {
    ...statusInfo,
    label: t(labelKey)
  };
};

export const EQUIPMENT_CATEGORY_DISPLAY = {
  CARDIO: 'Cardio',
  STRENGTH: 'Strength',
  FUNCTIONAL: 'Functional',
  FLEXIBILITY: 'Flexibility',
  SPORTS: 'Sports',
  ACCESSORIES: 'Accessories',
  OTHER: 'Other'
};

export const EQUIPMENT_CONDITION_DISPLAY = {
  EXCELLENT: { label: 'Xuất sắc', color: 'green' },
  GOOD: { label: 'Tốt', color: 'blue' },
  FAIR: { label: 'Khá', color: 'yellow' },
  POOR: { label: 'Kém', color: 'orange' },
  NEEDS_MAINTENANCE: { label: 'Cần bảo trì', color: 'red' },
  OUT_OF_ORDER: { label: 'Hỏng', color: 'red' }
};

// QR Code related types
export interface QRCodeData {
  equipmentId: string;
  type: string;
  [key: string]: unknown; // For additional fields that might be added by backend
}

// Excel Import related types
export interface ImportedEquipment {
  _id: string;
  equipmentCode: string;
  equipmentName: string;
  category: EquipmentCategory;
  manufacturer: string;
  price: string;
  dateOfPurchase: string;
  warrantyExpirationDate: string;
  status: EquipmentStatus;
  location?: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExcelImportResult {
  successCount: number;
  errorCount: number;
  totalCount: number;
  errors: Array<{
    row: number;
    equipmentName?: string;
    equipmentCode?: string;
    error?: string;
    errors?: string[];
  }>;
  importedEquipment: ImportedEquipment[];
}

// API Error types for better error handling
export interface EquipmentApiError {
  response?: {
    data?: {
      message?: string;
      error?: {
        message?: string;
        code?: string;
        meta?: ExcelImportResult;
      };
    };
  };
  message?: string;
}
