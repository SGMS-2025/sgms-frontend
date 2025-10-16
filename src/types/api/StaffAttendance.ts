import type { BaseEntity, ID } from '@/types/common/BaseTypes';
import type { Staff } from '@/types/api/Staff';

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
  staffInfo?: Staff;
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
  };
}
