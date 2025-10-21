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
  const match = input.match(/^\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*$/);
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
