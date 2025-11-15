import React from 'react';
import { useUser } from '@/hooks/useAuth';
import { useCurrentUserStaff } from '@/hooks/useCurrentUserStaff';
import { useBranch } from '@/contexts/BranchContext';
import type { CustomerDisplay } from '@/types/api/Customer';

export const useCanManageCustomer = () => {
  const currentUser = useUser();
  const { currentStaff } = useCurrentUserStaff();
  const { currentBranch } = useBranch();

  const canManageCustomer = React.useCallback(
    (customer: CustomerDisplay): boolean => {
      // Owner and Admin can manage all customers
      if (currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') {
        return true;
      }

      // If user is not a staff member, they cannot manage customers
      if (!currentStaff) {
        return false;
      }

      // Manager and PT can manage customers in their branch
      if (currentStaff.jobTitle !== 'Manager' && currentStaff.jobTitle !== 'Personal Trainer') {
        return false;
      }

      // Check if customer belongs to current branch
      if (!currentBranch) {
        return false;
      }

      // Check if customer belongs to current branch
      const customerBranchIds = customer.branches?.map((branch) => branch._id) || [];
      const hasAccess = customerBranchIds.includes(currentBranch._id);

      return hasAccess;
    },
    [currentUser, currentStaff, currentBranch]
  );

  return { canManageCustomer };
};
