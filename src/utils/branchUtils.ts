import type { Branch, BranchDisplay } from '@/types/api/Branch';

// Normalize facilities to a clean string array (handles JSON string or mixed types)
export const normalizeFacilities = (facilities?: unknown): string[] => {
  let list: unknown = facilities;

  if (typeof list === 'string') {
    const trimmed = list.trim();
    if (!trimmed) {
      list = [];
    } else {
      try {
        const parsed = JSON.parse(trimmed);
        list = Array.isArray(parsed) ? parsed : [trimmed];
      } catch (_err) {
        list = [trimmed];
      }
    }
  }

  if (Array.isArray(list)) {
    return list.filter((f) => typeof f === 'string' && f.trim()).map((f) => (f as string).trim());
  }

  return [];
};

export const convertBranchToDisplay = (branch: Branch): BranchDisplay => {
  // Parse openingHours properly
  let parsedOpeningHours = { open: '06:00', close: '21:00' };

  if (typeof branch.openingHours === 'string') {
    // Handle different formats: "06:00-21:00" or "06:00 - 21:00"
    const timeRegex = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;
    const timeMatch = timeRegex.exec(branch.openingHours);
    if (timeMatch) {
      parsedOpeningHours = {
        open: timeMatch[1],
        close: timeMatch[2]
      };
    }
  } else if (branch.openingHours && typeof branch.openingHours === 'object') {
    parsedOpeningHours = branch.openingHours as { open: string; close: string };
  }

  return {
    ...branch,
    status: branch.isActive ? 'ACTIVE' : 'INACTIVE',
    openingHours: parsedOpeningHours,
    facilities: normalizeFacilities(branch.facilities),
    // Handle managerId - backend returns array, frontend now supports array
    managerId: Array.isArray(branch.managerId)
      ? branch.managerId.length > 0
        ? branch.managerId // Keep all managers as array
        : undefined
      : branch.managerId
        ? [branch.managerId] // Convert single object to array
        : undefined,
    ownerId: branch.ownerId || undefined
  };
};
