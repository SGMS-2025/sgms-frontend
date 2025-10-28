import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessVerificationApi } from '@/services/api/businessVerificationApi';
import { useAuthState } from './useAuth';
import type { VerificationStatus } from '@/types/api/BusinessVerification';

/**
 * Hook to check and manage business verification status
 * Automatically redirects CUSTOMER users to business verification page if not verified
 */
export const useBusinessVerification = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthState();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkVerificationStatus = useCallback(async () => {
    // Only check for authenticated users
    if (!isAuthenticated || !user || authLoading) {
      setIsLoading(false);
      return;
    }

    // Only check for CUSTOMER role (users who might want to become OWNER)
    if (user.role !== 'CUSTOMER') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await businessVerificationApi.getVerificationStatus();
    setIsLoading(false);

    if (result.success) {
      setVerificationStatus(result.data);
    }
  }, [isAuthenticated, user, authLoading]);

  useEffect(() => {
    checkVerificationStatus();
  }, [checkVerificationStatus]);

  const refreshStatus = async () => {
    await checkVerificationStatus();
  };

  return {
    verificationStatus,
    isLoading: isLoading || authLoading,
    refreshStatus,
    needsVerification: user?.role === 'CUSTOMER' && !verificationStatus?.isApproved,
    isPending: verificationStatus?.isPending || false,
    isApproved: verificationStatus?.isApproved || false,
    isRejected: verificationStatus?.isRejected || false,
    hasVerification: verificationStatus?.hasVerification || false
  };
};

/**
 * Hook to enforce business verification for CUSTOMER users
 * Redirects to business verification page if user is CUSTOMER and not verified
 */
export const useBusinessVerificationGuard = (options?: { redirectPath?: string; allowPending?: boolean }) => {
  const { user } = useAuthState();
  const navigate = useNavigate();
  const { verificationStatus, isLoading, needsVerification, isPending, isApproved, hasVerification } =
    useBusinessVerification();

  const redirectPath = options?.redirectPath || '/business-verification';
  const allowPending = options?.allowPending ?? false;

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return;

    // Don't redirect if not a CUSTOMER
    if (user?.role !== 'CUSTOMER') return;

    // Redirect if user doesn't have verification at all
    if (!hasVerification) {
      navigate(redirectPath, { replace: true });
      return;
    }

    // Redirect if pending and not allowed
    if (isPending && !allowPending) {
      navigate(redirectPath, { replace: true });
      return;
    }

    // Redirect if rejected
    if (verificationStatus?.isRejected) {
      navigate(redirectPath, { replace: true });
      return;
    }
  }, [
    isLoading,
    user?.role,
    hasVerification,
    isPending,
    verificationStatus?.isRejected,
    allowPending,
    navigate,
    redirectPath
  ]);

  return {
    verificationStatus,
    isLoading,
    needsVerification,
    isPending,
    isApproved,
    canAccessContent: isApproved || (isPending && allowPending)
  };
};
