type DateLike = string | number | Date;

export function localDateStringYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Combine a local calendar date (YYYY-MM-DD) and time (HH:mm) into a UTC ISO string
 * Suitable for sending to backend expecting UTC timestamps
 */
export function localDateTimeToUtcISO(dateYMD: string, timeHHmm: string): string {
  const localDateTime = new Date(`${dateYMD}T${timeHHmm}`);
  return localDateTime.toISOString();
}

/**
 * Create UTC ISO string from VN local date and time
 * IMPORTANT: This treats input time as VN time (UTC+7), not browser local time
 * Example: "2025-11-06", "05:00" (VN) → "2025-11-05T22:00:00.000Z" (UTC)
 *
 * @deprecated Use vnTimeToUtcISO instead for clarity
 */
export function createUtcISOFromLocal(dateYMD: string, timeHHmm: string): string {
  // Use the proper VN time to UTC conversion
  return vnTimeToUtcISO(dateYMD, timeHHmm);
}

/**
 * Current Date object as Vietnam local time
 */
export function nowInVietnam(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

/**
 * Format an ISO/Date into Vietnam timezone string with custom Intl options
 */
export function formatInVietnam(value: DateLike, options: Intl.DateTimeFormatOptions): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', ...options });
}

export function formatVNDate(value: DateLike): string {
  return formatInVietnam(value, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatVNTime(value: DateLike): string {
  return formatInVietnam(value, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Convert UTC ISO string to Vietnam local time string (HH:mm format)
 * This ensures frontend can match backend UTC times with VN time slots
 */
export function utcToVnTimeString(utcISO: string): string {
  const date = new Date(utcISO);
  // Convert to VN timezone
  const vnDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const hours = String(vnDate.getHours()).padStart(2, '0');
  const minutes = String(vnDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Convert VN time string (HH:mm) to UTC ISO, treating input as VN local time
 * VN is UTC+7, so when user configs 5:00 VN, we need to store 22:00 UTC previous day
 * This is used when creating workshifts from VN time slots
 *
 * Example:
 * - Input: "2025-11-06", "05:00" (VN time = 5am VN)
 * - Output: "2025-11-05T22:00:00.000Z" (UTC = 22:00 previous day, which is 5am VN next day)
 */
export function vnTimeToUtcISO(dateYMD: string, timeHHmm: string): string {
  // Parse date and time
  const [year, month, day] = dateYMD.split('-').map(Number);
  const [hour, minute] = timeHHmm.split(':').map(Number);

  // Get the timezone offset in minutes (VN is UTC+7 = +420 minutes)
  // But we need to be careful: browser's local timezone might not be VN
  // So we manually calculate: VN time - 7 hours = UTC time
  const utcHour = hour - 7;

  let utcDate: Date;
  if (utcHour < 0) {
    // Need to go to previous day
    const prevDay = new Date(year, month - 1, day);
    prevDay.setDate(prevDay.getDate() - 1);
    const adjustedHour = utcHour + 24;
    utcDate = new Date(
      Date.UTC(prevDay.getFullYear(), prevDay.getMonth(), prevDay.getDate(), adjustedHour, minute, 0, 0)
    );
  } else {
    // Same day
    utcDate = new Date(Date.UTC(year, month - 1, day, utcHour, minute, 0, 0));
  }

  return utcDate.toISOString();
}
