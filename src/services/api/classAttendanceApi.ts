import { api } from './api';

export interface AttendanceRecord {
  enrollmentId: string;
  status: 'PRESENT' | 'ABSENT';
}

export interface ClassAttendance {
  _id: string;
  classId: string;
  scheduleDate: string;
  sessionNumber: number;
  records: Array<{
    enrollmentId: string;
    customerId: Record<string, unknown>;
    contractId: Record<string, unknown>;
    status: 'PRESENT' | 'ABSENT';
    wasPresent: boolean;
    recordedAt: string;
    recordedBy?: string;
  }>;
  statistics: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
  };
  isLocked: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'LOCKED';
  createdAt: string;
  updatedAt: string;
}

/**
 * Get or create attendance record for a class and date
 */
export const getOrCreateAttendance = async (
  classId: string,
  scheduleDate: Date,
  sessionNumber: number = 1
): Promise<ClassAttendance> => {
  const query = new URLSearchParams({
    scheduleDate: scheduleDate.toISOString(),
    sessionNumber: sessionNumber.toString()
  });

  const response = await api.get<{ data: ClassAttendance }>(`/class-attendance/classes/${classId}/attendance?${query}`);
  return response.data.data;
};

/**
 * Save attendance records
 */
export const saveAttendance = async (
  classId: string,
  scheduleDate: Date,
  sessionNumber: number,
  records: AttendanceRecord[]
): Promise<ClassAttendance> => {
  const response = await api.post<{ data: ClassAttendance }>(`/class-attendance/classes/${classId}/attendance`, {
    scheduleDate: scheduleDate.toISOString(),
    sessionNumber,
    records
  });
  return response.data.data;
};

/**
 * Get attendance records by date range
 */
export const getAttendanceByDateRange = async (
  classId: string,
  startDate: Date,
  endDate: Date
): Promise<ClassAttendance[]> => {
  const query = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  const response = await api.get<{ data: ClassAttendance[] }>(
    `/class-attendance/classes/${classId}/attendance/date-range?${query}`
  );
  return response.data.data;
};

/**
 * Get student's attendance history in a class
 */
export const getStudentAttendanceHistory = async (classId: string, customerId: string): Promise<ClassAttendance[]> => {
  const response = await api.get<{ data: ClassAttendance[] }>(
    `/class-attendance/classes/${classId}/attendance/student/${customerId}`
  );
  return response.data.data;
};

/**
 * Get attendance statistics
 */
export const getAttendanceStatistics = async (
  classId: string,
  startDate: Date,
  endDate: Date
): Promise<Record<string, unknown>> => {
  const query = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  const response = await api.get<{ data: Record<string, unknown> }>(
    `/class-attendance/classes/${classId}/attendance/statistics?${query}`
  );
  return response.data.data;
};

/**
 * Get attendance by ID
 */
export const getAttendanceById = async (attendanceId: string): Promise<ClassAttendance> => {
  const response = await api.get<{ data: ClassAttendance }>(`/class-attendance/attendance/${attendanceId}`);
  return response.data.data;
};

/**
 * Lock attendance
 */
export const lockAttendance = async (attendanceId: string): Promise<ClassAttendance> => {
  const response = await api.put<{ data: ClassAttendance }>(`/class-attendance/attendance/${attendanceId}/lock`, {});
  return response.data.data;
};

// Export all functions as a single object for easier importing
export const classAttendanceApi = {
  getOrCreateAttendance,
  saveAttendance,
  getAttendanceByDateRange,
  getStudentAttendanceHistory,
  getAttendanceStatistics,
  getAttendanceById,
  lockAttendance
};
