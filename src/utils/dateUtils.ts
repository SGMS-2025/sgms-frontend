/**
 * Parse different date formats into a Date object
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Try different date formats in order of preference
  const formats = [
    // ISO format: 2025-10-20T00:00:00.000Z
    (str: string) => {
      const date = new Date(str);
      return isNaN(date.getTime()) ? null : date;
    },

    // DD/MM/YYYY format: 20/10/2025
    (str: string) => {
      const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    },

    // DD-MM-YYYY format: 20-10-2025
    (str: string) => {
      const match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    },

    // YYYY-MM-DD format: 2025-10-20
    (str: string) => {
      const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (match) {
        const [, year, month, day] = match;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    }
  ];

  for (const format of formats) {
    const date = format(dateString);
    if (date) {
      return date;
    }
  }

  return null;
};

/**
 * Format date for display in charts (dd/mm)
 */
export const formatDateForChart = (dateString: string): string => {
  const date = parseDate(dateString);
  if (!date) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit'
  });
};

/**
 * Format date for tooltips (dd/mm/yyyy)
 */
export const formatDateForTooltip = (dateString: string): string => {
  const date = parseDate(dateString);
  if (!date) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Check if a date string is valid
 */
export const isValidDateString = (dateString: string): boolean => {
  return parseDate(dateString) !== null;
};

/**
 * Sort function for date strings
 */
export const compareDateStrings = (dateA: string, dateB: string): number => {
  const parsedA = parseDate(dateA);
  const parsedB = parseDate(dateB);

  if (!parsedA || !parsedB) return 0;

  return parsedA.getTime() - parsedB.getTime();
};
