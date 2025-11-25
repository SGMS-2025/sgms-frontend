/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  BranchDisplay,
  BranchContextType,
  Branch,
  BackendPaginationResponse,
  CreateAndUpdateBranchRequest
} from '@/types/api/Branch';
import { branchApi } from '@/services/api/branchApi';
import { convertBranchToDisplay } from '@/utils/branchUtils';
import { useAuthState } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const BranchContext = createContext<BranchContextType | undefined>(undefined);

interface BranchProviderProps {
  children: ReactNode;
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const { user } = useAuthState();
  const { t } = useTranslation();
  const [currentBranch, setCurrentBranch] = useState<BranchDisplay | null>(null);
  const [branches, setBranches] = useState<BranchDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);
  const isFetchingRef = useRef(false);
  const previousUserRef = useRef<typeof user | undefined>(undefined);

  // Check if user can access my-branches API
  // OWNER, ADMIN can always access
  // STAFF can access if they have the right permissions (handled by backend)
  const canAccessMyBranches = user && ['OWNER', 'ADMIN', 'STAFF'].includes(user.role);

  // Reset branch state when user changes or logs out
  useEffect(() => {
    // Only clear localStorage when user actually logs out (had user before, now null)
    // Don't clear when initial loading (undefined -> user)
    const hadUserBefore = previousUserRef.current !== undefined && previousUserRef.current !== null;
    const isNowLoggedOut = user === null;

    if (hadUserBefore && isNowLoggedOut) {
      // User logged out - clear everything including localStorage
      setCurrentBranch(null);
      setBranches([]);
      setError(null);
      setLoading(false);
      localStorage.removeItem('selectedBranchId');
    } else if (user && !canAccessMyBranches) {
      // User exists but doesn't have permission - reset state but keep localStorage
      setCurrentBranch(null);
      setBranches([]);
      setError(null);
      setLoading(false);
    }

    // Update previous user ref
    previousUserRef.current = user;
  }, [user, canAccessMyBranches]);

  // Fetch branches on mount - chỉ chạy một lần
  useEffect(() => {
    const fetchBranches = async () => {
      // Prevent multiple simultaneous calls
      if (isFetchingRef.current) return;

      // Only fetch my-branches if user has permission
      if (!canAccessMyBranches) {
        setLoading(false);
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await branchApi.getMyBranches().catch(() => ({
        success: false,
        message: 'Network error - Failed to fetch branches',
        data: null
      }));

      if (response.success && response.data) {
        const branchData = response.data as unknown as { branches: Branch[]; pagination: BackendPaginationResponse };

        if (branchData.branches && Array.isArray(branchData.branches)) {
          const displayBranches = branchData.branches.map(convertBranchToDisplay);
          setBranches(displayBranches);

          // Always try to restore from localStorage first, then check if current branch is still valid
          const savedBranchId = localStorage.getItem('selectedBranchId');
          setCurrentBranch((prev) => {
            // If we have a saved branch ID, try to restore it
            if (savedBranchId && displayBranches.length > 0) {
              const savedBranch = displayBranches.find((b) => b._id === savedBranchId);
              if (savedBranch) {
                return savedBranch;
              }
            }

            // If current branch is still valid in the new list, keep it
            if (prev && displayBranches.some((b) => b._id === prev._id)) {
              return prev;
            }

            // Otherwise, use first branch
            if (displayBranches.length > 0) {
              return displayBranches[0];
            }

            return null;
          });
        } else {
          setError('No branches data found');
        }
      } else {
        const errorMessage = response.message || 'Failed to fetch branches';
        setError(errorMessage);
      }

      setLoading(false);
      isFetchingRef.current = false;
    };

    fetchBranches();
  }, [canAccessMyBranches, user?._id, user?.role]); // Re-run when user role changes

  const fetchBranches = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) return;

    // Only fetch my-branches if user has permission
    if (!canAccessMyBranches) {
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    const response = await branchApi.getMyBranches().catch(() => ({
      success: false,
      message: 'Network error - Failed to fetch branches',
      data: null
    }));

    if (response.success && response.data) {
      const branchData = response.data as unknown as { branches: Branch[]; pagination: BackendPaginationResponse };

      if (branchData.branches && Array.isArray(branchData.branches)) {
        const displayBranches = branchData.branches.map(convertBranchToDisplay);
        setBranches(displayBranches);

        // Refetch - preserve current branch if still valid, otherwise restore from localStorage
        setCurrentBranch((prev) => {
          // If current branch is still valid in the new list, keep it
          if (prev && displayBranches.some((b) => b._id === prev._id)) {
            return prev;
          }

          // Try to restore from localStorage
          if (displayBranches.length > 0) {
            const savedBranchId = localStorage.getItem('selectedBranchId');
            if (savedBranchId) {
              const savedBranch = displayBranches.find((b) => b._id === savedBranchId);
              if (savedBranch) {
                return savedBranch;
              }
            }
            // No saved branch or saved branch not found, use first branch
            return displayBranches[0];
          }

          return null;
        });
      } else {
        setError('No branches data found');
      }
    } else {
      const errorMessage = response.message || 'Failed to fetch branches';
      setError(errorMessage);
    }

    setLoading(false);
    isFetchingRef.current = false;
  }, [canAccessMyBranches]);

  const fetchBranchDetail = async (branchId: string): Promise<BranchDisplay | null> => {
    // Always fetch fresh data from API to ensure we have the latest manager information
    // Use protected endpoint to get branch details regardless of active status
    const response = await branchApi.getBranchDetailProtected(branchId).catch(() => ({
      success: false,
      message: 'Network error - Failed to fetch branch detail',
      data: null
    }));

    if (response.success && response.data) {
      const converted = convertBranchToDisplay(response.data);
      return converted;
    } else {
      return null;
    }
  };

  const createBranch = async (data: CreateAndUpdateBranchRequest): Promise<BranchDisplay | null> => {
    // Only allow if user has permission
    if (!canAccessMyBranches) {
      return null;
    }

    const response = await branchApi.createBranch(data).catch(() => ({
      success: false,
      message: 'Network error - Failed to create branch',
      data: null
    }));

    if (response.success && response.data) {
      const newBranch = convertBranchToDisplay(response.data);
      setBranches((prev) => [...prev, newBranch]);
      // Set the new branch as current branch
      setCurrentBranch(newBranch);
      return newBranch;
    } else {
      return null;
    }
  };

  const updateBranchApi = async (
    branchId: string,
    data: CreateAndUpdateBranchRequest
  ): Promise<BranchDisplay | null> => {
    // Only allow if user has permission
    if (!canAccessMyBranches) {
      return null;
    }

    const response = await branchApi.updateBranch(branchId, data).catch(() => ({
      success: false,
      message: 'Network error - Failed to update branch',
      data: null
    }));

    if (response.success && response.data) {
      const updatedBranch = convertBranchToDisplay(response.data);

      setBranches((prev) => prev.map((branch) => (branch._id === branchId ? updatedBranch : branch)));

      // Update current branch if it's the one being updated
      if (currentBranch?._id === branchId) {
        setCurrentBranch(updatedBranch);
      }

      return updatedBranch;
    } else {
      return null;
    }
  };

  const toggleBranchStatus = async (branchId: string): Promise<BranchDisplay | null> => {
    // Only allow if user has permission
    if (!canAccessMyBranches) {
      return null;
    }

    const response = await branchApi.toggleBranchStatus(branchId).catch(() => ({
      success: false,
      message: 'Network error - Failed to update branch status',
      data: null
    }));

    if (response.success && response.data) {
      const updatedBranch = convertBranchToDisplay(response.data);

      // Update branches list
      setBranches((prev) => prev.map((branch) => (branch._id === branchId ? updatedBranch : branch)));

      // Update current branch if it's the one being updated
      if (currentBranch?._id === branchId) {
        setCurrentBranch(updatedBranch);
      }

      // Show success toast
      toast.success(t('toast.branch_status_updated_success'));

      return updatedBranch; // Return updated branch for immediate use
    }

    // Show error toast
    toast.error(t('toast.branch_status_updated_failed'));

    return null;
  };

  const switchBranch = async (branchId: string) => {
    if (isSwitchingBranch) return; // Prevent multiple switches

    setIsSwitchingBranch(true);

    // Always fetch fresh data from API to ensure we have the latest manager information
    const branchDetail = await fetchBranchDetail(branchId);
    if (branchDetail) {
      setCurrentBranch(branchDetail);
      // Save selected branch ID to localStorage
      localStorage.setItem('selectedBranchId', branchId);
    }

    setIsSwitchingBranch(false);
  };

  // Save branch ID to localStorage whenever currentBranch changes
  useEffect(() => {
    if (currentBranch?._id) {
      localStorage.setItem('selectedBranchId', currentBranch._id);
    }
  }, [currentBranch?._id]);

  const value: BranchContextType = React.useMemo(
    () => ({
      currentBranch,
      branches,
      loading: loading || isSwitchingBranch,
      error,
      setCurrentBranch,
      setBranches,
      fetchBranches,
      fetchBranchDetail,
      createBranch,
      updateBranchApi,
      toggleBranchStatus,
      switchBranch
    }),
    [
      currentBranch,
      branches,
      loading,
      isSwitchingBranch,
      error,
      fetchBranches,
      fetchBranchDetail,
      createBranch,
      updateBranchApi,
      toggleBranchStatus,
      switchBranch
    ]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

export const useBranch = (): BranchContextType => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
