import { api } from './api';
import type { StaffAttendance } from '@/types/api/StaffAttendance';
import type { ApiResponse } from '@/types/common/BaseTypes';
import type { GetAttendanceListParams } from '@/types/api/StaffAttendance';

export interface AttendanceRequest {
  username?: string;
  staffId?: string;
  branchId?: string;
  workShiftId?: string;
  notes?: string;
}

export const attendanceApi = {
  /**
   * Toggle staff attendance (check-in/check-out)
   */
  toggleAttendance: async (data: AttendanceRequest): Promise<ApiResponse<StaffAttendance>> => {
    const response = await api.post('/attendance/staff', data);
    return response.data;
  },

  /**
   * Get attendance list for a staff member
   */
  getAttendanceList: async (params?: Partial<GetAttendanceListParams>): Promise<ApiResponse<StaffAttendance[]>> => {
    const response = await api.get('/attendance/staff', { params });
    return response.data;
  }
};
