import type { BaseEntity, ID } from '@/types/common/BaseTypes';

export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'AUTO_CLOSE' | 'MISSED';
export type DayNames = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface StaffAttendance extends BaseEntity {
  staffId: ID;
  branchId: ID;
  branchWorkingConfigId: ID;
  shiftConfigId: ID;
  date: string; // ISO date string
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  notes?: string;
  dayOfTheWeek: DayNames;

  // Virtual fields
  checkInTimeVN?: string;
  checkOutTimeVN?: string;
  dateVN?: string; // Vietnam timezone date string

  // Populated fields (optional)
  staffInfo?: {
    _id: ID;
    jobTitle: string;
    userId: {
      _id: ID;
      fullName: string;
    };
  };
  branchInfo?: {
    _id: ID;
    branchName: string;
    location: string;
    hotline: string;
  };
  branchWorkingConfigInfo?: {
    _id: ID;
    defaultWorkingDays: string[];
    defaultDayOff: string[];
    isActive: boolean;
  };
  shiftConfig?: {
    _id: ID;
    startTime: string; // "HH:mm" format
    endTime: string; // "HH:mm" format
    hour?: number;
    type?: string;
  };
}

export interface GetAttendanceListParams {
  username: string;
  staffId: string;
  branchId: string;
  fromDate: string; // ISO string
  toDate: string; // ISO string
  page: number;
  limit: number;
  sort: string; // e.g. '-checkInTime'
}

// New types for staff attendance history by staffId
export interface GetStaffAttendanceHistoryParams {
  page?: number;
  limit?: number;
  status?: AttendanceStatus;
  fromDate?: string; // ISO string
  toDate?: string; // ISO string
  dayOfTheWeek?: DayNames;
  sortBy?: 'date' | 'checkInTime' | 'checkOutTime' | 'status' | 'dayOfTheWeek' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface StaffAttendanceHistoryResponse {
  success: boolean;
  message: string;
  data: StaffAttendance[];
  timestamp: string;
  requestId: string;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
