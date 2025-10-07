import { useAuthState } from './useAuth';
import { useCurrentUserStaff } from './useCurrentUserStaff';

/**
 * Hook to check workshift-related permissions based on user role and job title
 */
export const useWorkshiftPermissions = () => {
  const { user } = useAuthState();
  const { currentStaff } = useCurrentUserStaff();

  /**
   * Check if user can create workshifts
   * Rules:
   * - ADMIN, OWNER: Can always create workshifts
   * - STAFF with jobTitle 'Manager': Can create workshifts
   * - STAFF with jobTitle 'Personal Trainer' or 'Technician': Cannot create workshifts
   */
  const canCreateWorkshift = (): boolean => {
    if (!user) return false;

    // ADMIN and OWNER can always create workshifts
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      return true;
    }

    // For STAFF role, check job title
    if (user.role === 'STAFF' && currentStaff) {
      // Only Manager can create workshifts
      return currentStaff.jobTitle === 'Manager';
    }

    // Default: cannot create workshifts
    return false;
  };

  /**
   * Check if user can view workshifts
   * All authenticated users can view workshifts
   */
  const canViewWorkshift = (): boolean => {
    return !!user;
  };

  /**
   * Check if user can edit workshifts
   * Same rules as create workshifts
   */
  const canEditWorkshift = (): boolean => {
    return canCreateWorkshift();
  };

  /**
   * Check if user can delete workshifts
   * Same rules as create workshifts
   */
  const canDeleteWorkshift = (): boolean => {
    return canCreateWorkshift();
  };

  return {
    canCreateWorkshift,
    canViewWorkshift,
    canEditWorkshift,
    canDeleteWorkshift,
    user,
    currentStaff
  };
};
