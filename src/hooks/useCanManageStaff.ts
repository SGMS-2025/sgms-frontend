import React from 'react';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useBranch } from '@/contexts/BranchContext';
import type { StaffDisplay } from '@/types/api/Staff';

export const useCanManageStaff = () => {
  const currentUser = useUser();
  const { currentStaff } = useCurrentUserStaff();
  const { branches } = useBranch();

  const canManageStaff = React.useCallback(
    (staff: StaffDisplay): boolean => {
      // Owner and Admin can manage all staff
      if (currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') {
        return true;
      }

      // If user is not a staff member, they cannot manage staff
      if (!currentStaff) {
        return false;
      }

      // If user is a staff member but not a manager, they cannot manage staff
      if (currentStaff.jobTitle !== 'Manager') {
        return false;
      }

      // Check if the staff member has any branches that the current user doesn't manage
      if (!staff.branches || staff.branches.length === 0) {
        return false;
      }

      // Get the branch IDs that the current user manages (from branches)
      const managedBranchIds = branches.map((branch) => branch._id);

      // Check if all branches in the staff member's assignment are managed by the current user
      const allBranchesManaged = staff.branches.every((branch) => managedBranchIds.includes(branch._id));

      return allBranchesManaged;
    },
    [currentUser, currentStaff, branches]
  );

  return { canManageStaff };
};
