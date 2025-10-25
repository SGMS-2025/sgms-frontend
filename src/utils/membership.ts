import type { MembershipContract } from '../types/api/Membership';

/**
 * Calculate pro-rata refund amount for a membership contract
 */
export const calculateProRataRefund = (contract: MembershipContract): number => {
  if (!contract.activationDate) {
    return contract.paidAmount; // Full refund if not activated
  }

  const now = new Date();
  const activationDate = new Date(contract.activationDate);
  const endDate = new Date(contract.endDate);

  const totalDays = Math.ceil((endDate.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24));
  const usedDays = Math.ceil((now.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, totalDays - usedDays);

  if (totalDays <= 0) return 0;

  const remainingRatio = remainingDays / totalDays;
  return Math.floor(contract.paidAmount * remainingRatio);
};

/**
 * Check if a membership can be canceled
 */
export const canCancelMembership = (status: string): boolean => {
  const cancelableStatuses = ['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'PAST_DUE'];
  return cancelableStatuses.includes(status);
};

/**
 * Get color for membership status
 */
export const getMembershipStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    PENDING_ACTIVATION: 'text-yellow-600 bg-yellow-100',
    ACTIVE: 'text-green-600 bg-green-100',
    EXPIRED: 'text-gray-600 bg-gray-100',
    SUSPENDED: 'text-orange-600 bg-orange-100',
    CANCELED: 'text-red-600 bg-red-100',
    PAST_DUE: 'text-red-600 bg-red-100'
  };
  return statusColors[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Get display label for membership status
 */
export const getMembershipStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    PENDING_ACTIVATION: 'Chờ kích hoạt',
    ACTIVE: 'Đang hoạt động',
    EXPIRED: 'Đã hết hạn',
    SUSPENDED: 'Tạm ngưng',
    CANCELED: 'Đã hủy',
    PAST_DUE: 'Quá hạn thanh toán'
  };
  return statusLabels[status] || status;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

/**
 * Calculate remaining days for a membership
 */
export const calculateRemainingDays = (endDate: string): number => {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if membership is expiring soon (within 7 days)
 */
export const isExpiringSoon = (endDate: string, daysThreshold: number = 7): boolean => {
  const remainingDays = calculateRemainingDays(endDate);
  return remainingDays <= daysThreshold && remainingDays > 0;
};

/**
 * Parse benefits string into array
 */
export const parseBenefits = (benefits: string | string[]): string[] => {
  if (Array.isArray(benefits)) {
    return benefits;
  }
  if (typeof benefits === 'string') {
    return benefits.split('\n').filter((benefit) => benefit.trim().length > 0);
  }
  return [];
};
