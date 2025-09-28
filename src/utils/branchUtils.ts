import type { Branch, BranchDisplay } from '@/types/api/Branch';

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
