import type { EquipmentInventoryStatus } from '@/constants/equipmentInventory';

// ===== EQUIPMENT INVENTORY TYPES =====

export interface EquipmentToCheck {
  _id: string;
  equipmentName: string;
  equipmentCode: string;
  category: string;
  location?: string;
  manufacturer: string;
  dateOfPurchase: string;
  status: string;
  // Check status (if already checked)
  checkStatus?: EquipmentInventoryStatus;
  checkNotes?: string;
  checkedAt?: string;
}

export interface EquipmentCheck {
  equipmentId: string | EquipmentToCheck;
  status: EquipmentInventoryStatus;
  checkedAt: string;
  notes?: string;
}

export interface EquipmentInventorySession {
  _id: string;
  branchId: string;
  inventoryDate: string;
  checkedBy: string;
  equipmentChecks: EquipmentCheck[];
  totalEquipment: number;
  checkedEquipment: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  progressPercentage: number;
  presentCount: number;
  missingCount: number;
  canComplete: boolean;
  // Populated fields
  branchInfo?: {
    _id: string;
    branchName: string;
    location: string;
  };
  checkedByInfo?: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export interface InventorySessionData {
  session: EquipmentInventorySession | null;
  equipments: EquipmentToCheck[];
}

export interface InventoryStats {
  totalSessions: number;
  totalEquipmentChecked: number;
  totalPresent: number;
  totalMissing: number;
  presentRate: number;
  missingRate: number;
}

export interface MissingEquipment {
  equipment: {
    _id: string;
    equipmentName: string;
    equipmentCode: string;
    category: string;
    location?: string;
  };
  missingDate: string;
  sessionId: string;
  branch: {
    _id: string;
    branchName: string;
    location: string;
  };
  notes?: string;
}

export interface StartInventorySessionRequest {
  branchId: string;
  inventoryDate: string;
}

export interface CheckEquipmentRequest {
  equipmentId: string;
  status: EquipmentInventoryStatus;
  notes?: string;
}

export interface GetInventoryHistoryParams {
  page?: number;
  limit?: number;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetInventoryStatsParams {
  branchId?: string;
  startDate: string;
  endDate: string;
}

export interface GetMissingEquipmentParams {
  branchId?: string;
  startDate: string;
  endDate: string;
}
