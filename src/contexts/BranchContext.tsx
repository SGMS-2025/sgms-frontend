import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { useAuth } from './AuthContext';

const BranchContext = createContext<BranchContextType | undefined>(undefined);

interface BranchProviderProps {
  children: ReactNode;
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const { state: authState } = useAuth();
  const [currentBranch, setCurrentBranch] = useState<BranchDisplay | null>(null);
  const [branches, setBranches] = useState<BranchDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);

  // Check if user can access my-branches API
  const canAccessMyBranches = authState.user && ['OWNER', 'ADMIN', 'MANAGER'].includes(authState.user.role);

  // Fetch branches on mount - chỉ chạy một lần
  useEffect(() => {
    const fetchBranches = async () => {
      // Prevent multiple simultaneous calls
      if (isFetching) return;

      // Only fetch my-branches if user has permission
      if (!canAccessMyBranches) {
        setLoading(false);
        setIsFetching(false);
        return;
      }

      setIsFetching(true);
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
          // Only set current branch if there isn't one already
          setCurrentBranch((prev) => {
            if (!prev && displayBranches.length > 0) {
              return displayBranches[0];
            }
            return prev;
          });
        } else {
          setError('No branches data found');
        }
      } else {
        const errorMessage = response.message || 'Failed to fetch branches';
        setError(errorMessage);
      }

      setLoading(false);
      setIsFetching(false);
    };

    fetchBranches();
  }, [canAccessMyBranches]); // Re-run when user role changes

  const fetchBranches = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetching) return;

    // Only fetch my-branches if user has permission
    if (!canAccessMyBranches) {
      setLoading(false);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
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
        // Refetch - không cần check currentBranch
        if (displayBranches.length > 0) {
          setCurrentBranch(displayBranches[0]);
        }
      } else {
        setError('No branches data found');
      }
    } else {
      const errorMessage = response.message || 'Failed to fetch branches';
      setError(errorMessage);
    }

    setLoading(false);
    setIsFetching(false);
  }, [canAccessMyBranches]);

  const fetchBranchDetail = async (branchId: string): Promise<BranchDisplay | null> => {
    // Check if branch is already in branches list to avoid unnecessary API call
    const existingBranch = branches.find((b) => b._id === branchId);
    if (existingBranch) {
      return existingBranch;
    }

    // Use public route for all users (including customers)
    const response = await branchApi.getBranchDetail(branchId).catch(() => ({
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

  const toggleBranchStatus = async (branchId: string) => {
    // Only allow if user has permission
    if (!canAccessMyBranches) {
      return;
    }

    const response = await branchApi.toggleBranchStatus(branchId).catch(() => ({
      success: false,
      message: 'Network error - Failed to update branch status',
      data: null
    }));

    if (response.success && response.data) {
      const updatedBranch = convertBranchToDisplay(response.data);
      setBranches((prev) => prev.map((branch) => (branch._id === branchId ? updatedBranch : branch)));

      // Update current branch if it's the one being updated
      if (currentBranch?._id === branchId) {
        setCurrentBranch(updatedBranch);
      }
    }
  };

  const switchBranch = async (branchId: string) => {
    if (isSwitchingBranch) return; // Prevent multiple switches

    setIsSwitchingBranch(true);

    // Find branch in existing list first
    const existingBranch = branches.find((b) => b._id === branchId);
    if (existingBranch) {
      setCurrentBranch(existingBranch);
      setIsSwitchingBranch(false);
      return;
    }

    // If not found, fetch from API using public route
    const branchDetail = await fetchBranchDetail(branchId);
    if (branchDetail) {
      setCurrentBranch(branchDetail);
    }

    setIsSwitchingBranch(false);
  };

  const value: BranchContextType = {
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
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

export const useBranch = (): BranchContextType => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
