import type { BaseEntity, ID } from '@/types/common/BaseTypes';

export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'AUTO_CLOSE' | 'MISSED';
export type DayNames = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface StaffAttendance extends BaseEntity {
  staffId: ID;
  branchId: ID;
  workShiftId: ID;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  notes?: string;
  dayOfTheWeek: DayNames;

  // Virtual fields
  checkInTimeVN?: string;
  checkOutTimeVN?: string;

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
  workShiftInfo?: {
    _id: ID;
    startTime: string;
    endTime: string;
    status: string;
    // Localized display times (e.g., UTC+7)
    startTimeVN?: string;
    endTimeVN?: string;
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
  sortBy?: 'checkInTime' | 'checkOutTime' | 'status' | 'dayOfTheWeek' | 'createdAt' | 'updatedAt';
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
