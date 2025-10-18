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
 * Create UTC ISO string from date and time, treating them as local time
 * This ensures the date stays the same regardless of timezone
 */
export function createUtcISOFromLocal(dateYMD: string, timeHHmm: string): string {
  // Parse the date components
  const [year, month, day] = dateYMD.split('-').map(Number);
  const [hour, minute] = timeHHmm.split(':').map(Number);

  // Create UTC date directly to avoid timezone conversion
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  return utcDate.toISOString();
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
