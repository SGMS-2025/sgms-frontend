/**
 * Helper function to format time only (h:mm AM/PM)
 */
export const formatTimeOnly = (timeString: string | undefined): string => {
  if (!timeString) return '-';
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Helper to format to h:mm AM/PM from either "HH:MM[:SS]" or ISO string
 */
export const formatToAmPm = (input?: string): string => {
  if (!input) return '-';
  // If matches HH:MM or HH:MM:SS
  const timeRegex = /^\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*$/;
  const match = timeRegex.exec(input);
  if (match) {
    const hours24 = Number.parseInt(match[1], 10);
    const minutes = match[2];
    const hours12 = ((hours24 + 11) % 12) + 1; // 0->12, 13->1 ...
    const period = hours24 >= 12 ? 'PM' : 'AM';
    return `${hours12}:${minutes} ${period}`;
  }
  // Fallback: try Date parsing
  const date = new Date(input);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return '-';
};

/**
 * Format check-out time: if same day as check-in, show time only; otherwise show date + time
 */
export const formatCheckOutTime = (checkOutTime?: string, checkInTime?: string): string => {
  if (!checkOutTime) return '-';

  const checkOutDate = new Date(checkOutTime);
  const checkInDate = checkInTime ? new Date(checkInTime) : null;

  // If no check-in time, show full date + time
  if (!checkInDate) {
    return checkOutDate.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Check if same day (compare year, month, day)
  const isSameDay =
    checkOutDate.getFullYear() === checkInDate.getFullYear() &&
    checkOutDate.getMonth() === checkInDate.getMonth() &&
    checkOutDate.getDate() === checkInDate.getDate();

  if (isSameDay) {
    // Same day: show time only
    return formatTimeOnly(checkOutTime);
  } else {
    // Different day: show date + time
    return checkOutDate.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

/**
 * Compare check-in time with shift start time
 * @param checkInTime - ISO string of check-in time
 * @param shiftStartTime - Shift start time in "HH:mm" format
 * @param workDate - Work date (ISO string or Date)
 * @returns 'early' | 'on-time' | 'late' | null
 */
export const getCheckInStatus = (
  checkInTime?: string,
  shiftStartTime?: string,
  workDate?: string | Date
): 'early' | 'on-time' | 'late' | null => {
  if (!checkInTime || !shiftStartTime || !workDate) return null;

  const checkIn = new Date(checkInTime);
  const date = workDate instanceof Date ? workDate : new Date(workDate);

  // Parse shift start time (HH:mm)
  const [hours, minutes] = shiftStartTime.split(':').map(Number);
  const shiftStart = new Date(date);
  shiftStart.setHours(hours, minutes, 0, 0);

  // Compare times (in milliseconds)
  const diffMs = checkIn.getTime() - shiftStart.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  // Allow up to 30 minutes late for "on-time"
  if (diffMinutes <= 30 && diffMinutes >= -5) {
    return 'on-time';
  } else if (diffMinutes < -5) {
    return 'early';
  } else {
    return 'late';
  }
};

/**
 * Compare check-out time with shift end time
 * @param checkOutTime - ISO string of check-out time
 * @param shiftEndTime - Shift end time in "HH:mm" format
 * @param workDate - Work date (ISO string or Date)
 * @returns 'early' | 'on-time' | 'overtime' | null
 */
export const getCheckOutStatus = (
  checkOutTime?: string,
  shiftEndTime?: string,
  workDate?: string | Date
): 'early' | 'on-time' | 'overtime' | null => {
  if (!checkOutTime || !shiftEndTime || !workDate) return null;

  const checkOut = new Date(checkOutTime);
  const date = workDate instanceof Date ? workDate : new Date(workDate);

  // Parse shift end time (HH:mm)
  const [hours, minutes] = shiftEndTime.split(':').map(Number);
  const shiftEnd = new Date(date);
  shiftEnd.setHours(hours, minutes, 0, 0);

  // Compare times (in milliseconds)
  const diffMs = checkOut.getTime() - shiftEnd.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  // Allow up to 30 minutes late for "on-time"
  if (diffMinutes <= 30 && diffMinutes >= -5) {
    return 'on-time';
  } else if (diffMinutes < -5) {
    return 'early';
  } else {
    return 'overtime';
  }
};

/**
 * Get CSS classes for attendance status badge
 * @param status - Attendance status string
 * @returns CSS classes string for styling the status badge
 */
export const getAttendanceStatusStyles = (status: string): string => {
  if (status === 'CHECKED_OUT') return 'bg-green-50 text-green-600';
  if (status === 'CHECKED_IN') return 'bg-blue-50 text-blue-600';
  if (status === 'AUTO_CLOSE') return 'bg-red-50 text-red-600';
  return 'bg-gray-100 text-gray-600';
};

/**
 * Get time status info (text key and color class)
 * @param status - Time status: 'early' | 'on-time' | 'late' | 'overtime' | null
 * @returns Object with translation key and color class, or null
 */
export const getTimeStatusInfo = (
  status: 'early' | 'on-time' | 'late' | 'overtime' | null
): { translationKey: string; colorClass: string } | null => {
  if (!status) return null;

  const translationKey = `attendance.status.${status}`;
  let colorClass = 'text-blue-600';

  if (status === 'early') {
    colorClass = 'text-green-600';
  } else if (status === 'late') {
    colorClass = 'text-orange-600';
  } else if (status === 'overtime') {
    colorClass = 'text-purple-600';
  }

  return { translationKey, colorClass };
};
