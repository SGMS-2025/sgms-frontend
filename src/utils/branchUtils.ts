import type { Branch, BranchDisplay } from '@/types/api/Branch';

export const convertBranchToDisplay = (branch: Branch): BranchDisplay => {
  // Parse openingHours properly
  let parsedOpeningHours = { open: '06:00', close: '21:00' };

  if (typeof branch.openingHours === 'string') {
    // Handle different formats: "06:00-21:00" or "06:00 - 21:00"
    const timeMatch = branch.openingHours.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
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
    // Ensure managerId and ownerId are properly handled
    managerId: branch.managerId || undefined,
    ownerId: branch.ownerId || undefined
  };
};
