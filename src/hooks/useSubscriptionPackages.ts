import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import type { SubscriptionPackage, OwnerSubscription } from '@/types/api/Subscription';

interface SubscriptionStats {
  hasActiveSubscription: boolean;
  packageName: string | null;
  tier: number | null;
  daysRemaining: number;
  endDate: string | null;
  startDate?: string | null;
  branchUsage: {
    current: number;
    max: number;
    percentage: number;
  } | null;
  customerUsage: {
    current: number;
    max: number;
    percentage: number;
  } | null;
}

interface UseSubscriptionPackagesResult {
  packages: SubscriptionPackage[];
  activeSubscription: OwnerSubscription | null;
  stats: SubscriptionStats | null;
  isLoading: boolean;
  error: string | null;
  selectedPackage: SubscriptionPackage | null;
  isPurchaseModalOpen: boolean;
  currentPackageTier: number | null;
  refetch: () => Promise<void>;
  handleSelectPackage: (packageId: string) => void;
  openPurchaseModal: (pkg: SubscriptionPackage) => void;
  closePurchaseModal: () => void;
  handlePurchaseSuccess: () => Promise<void>;
  getDaysRemaining: () => number;
  getBranchUsage: () => SubscriptionStats['branchUsage'];
  getCustomerUsage: () => SubscriptionStats['customerUsage'];
}

export const useSubscriptionPackages = (): UseSubscriptionPackagesResult => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<OwnerSubscription | null>(null);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [packagesResult, activeSubResult, statsResult] = await Promise.all([
      subscriptionApi.getActivePackages(),
      subscriptionApi.getActiveSubscription(),
      subscriptionApi.getSubscriptionStats()
    ]);

    if (packagesResult.success) {
      setPackages(packagesResult.data);
    } else {
      setError(packagesResult.message || 'Failed to load packages');
    }

    if (activeSubResult.success && activeSubResult.data) {
      setActiveSubscription(activeSubResult.data);
    } else if (activeSubResult.success === false) {
      // Only set error if it's not a "no subscription" case (which is valid)
      // Active subscription can be null normally, so we only set error for actual failures
      if (activeSubResult.statusCode !== 404) {
        setError(activeSubResult.message || 'Failed to load active subscription');
      }
    }

    if (statsResult.success && statsResult.data) {
      const statsData = statsResult.data;
      setStats({
        hasActiveSubscription: statsData.hasActiveSubscription,
        packageName: statsData.packageName,
        tier: statsData.tier,
        daysRemaining: statsData.daysRemaining,
        endDate: statsData.endDate,
        startDate: statsData.startDate,
        branchUsage: statsData.branchUsage
          ? {
              current: statsData.branchUsage.current,
              max: statsData.branchUsage.max,
              percentage: statsData.branchUsage.percentage
            }
          : null,
        customerUsage: statsData.customerUsage
          ? {
              current: statsData.customerUsage.current,
              max: statsData.customerUsage.max,
              percentage: statsData.customerUsage.percentage
            }
          : null
      });
    } else if (statsResult.success === false) {
      setError(statsResult.message || 'Failed to load subscription stats');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentPackageTier = useMemo(() => {
    if (!activeSubscription?.packageId) return null;
    return typeof activeSubscription.packageId === 'string'
      ? null
      : (activeSubscription.packageId as SubscriptionPackage).tier;
  }, [activeSubscription]);

  const selectPackage = useCallback(
    (packageId: string) => {
      const pkg = packages.find((p) => p._id === packageId);
      if (pkg) {
        setSelectedPackage(pkg);
        setIsPurchaseModalOpen(true);
      }
    },
    [packages]
  );

  const openPurchaseModal = useCallback((pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
    setIsPurchaseModalOpen(true);
  }, []);

  const closePurchaseModal = useCallback(() => {
    setIsPurchaseModalOpen(false);
    setSelectedPackage(null);
  }, []);

  const handlePurchaseSuccess = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const getDaysRemaining = useCallback(() => {
    if (!stats || typeof stats.daysRemaining !== 'number') return 0;
    return stats.daysRemaining;
  }, [stats]);

  const getBranchUsage = useCallback((): SubscriptionStats['branchUsage'] => {
    return stats?.branchUsage || null;
  }, [stats]);

  const getCustomerUsage = useCallback((): SubscriptionStats['customerUsage'] => {
    return stats?.customerUsage || null;
  }, [stats]);

  return {
    packages,
    activeSubscription,
    stats,
    isLoading,
    error,
    selectedPackage,
    isPurchaseModalOpen,
    currentPackageTier,
    refetch: fetchData,
    handleSelectPackage: selectPackage,
    openPurchaseModal,
    closePurchaseModal,
    handlePurchaseSuccess,
    getDaysRemaining,
    getBranchUsage,
    getCustomerUsage
  };
};
