import { api } from './api';
import type {
  SubscriptionPackageResponse,
  SubscriptionPackagesResponse,
  OwnerSubscriptionResponse,
  OwnerSubscriptionsResponse,
  SubscriptionStatsResponse,
  ValidationResponse,
  AllSubscriptionsResponse,
  PurchaseSubscriptionRequest,
  CreateSubscriptionPackageRequest,
  UpdateSubscriptionPackageRequest,
  CancelSubscriptionRequest,
  GetSubscriptionsQuery,
  GetSubscriptionHistoryQuery
} from '@/types/api/Subscription';

const BASE_URL = '/subscriptions';

export const subscriptionApi = {
  // Public endpoints

  /**
   * Get all active subscription packages
   */
  getActivePackages: async (): Promise<SubscriptionPackagesResponse> => {
    const response = await api.get(`${BASE_URL}/packages`);
    return response.data;
  },

  /**
   * Get package by ID
   */
  getPackageById: async (packageId: string): Promise<SubscriptionPackageResponse> => {
    const response = await api.get(`${BASE_URL}/packages/${packageId}`);
    return response.data;
  },

  // Owner endpoints

  /**
   * Purchase a subscription package
   */
  purchaseSubscription: async (data: PurchaseSubscriptionRequest): Promise<OwnerSubscriptionResponse> => {
    const response = await api.post(`${BASE_URL}/purchase`, data);
    return response.data;
  },

  /**
   * Get active subscription for current user
   */
  getActiveSubscription: async (): Promise<OwnerSubscriptionResponse> => {
    const response = await api.get(`${BASE_URL}/active`);
    return response.data;
  },

  /**
   * Get subscription history for current user
   */
  getSubscriptionHistory: async (query?: GetSubscriptionHistoryQuery): Promise<OwnerSubscriptionsResponse> => {
    const response = await api.get(`${BASE_URL}/history`, { params: query });
    return response.data;
  },

  /**
   * Cancel active subscription
   */
  cancelSubscription: async (data?: CancelSubscriptionRequest): Promise<OwnerSubscriptionResponse> => {
    const response = await api.post(`${BASE_URL}/cancel`, data);
    return response.data;
  },

  /**
   * Get subscription statistics (usage, limits, etc.)
   */
  getSubscriptionStats: async (): Promise<SubscriptionStatsResponse> => {
    const response = await api.get(`${BASE_URL}/stats`);
    return response.data;
  },

  /**
   * Validate if user can create a new branch
   */
  validateBranchCreation: async (): Promise<ValidationResponse> => {
    const response = await api.get(`${BASE_URL}/validate/branch`);
    return response.data;
  },

  /**
   * Validate if user can add a new customer
   */
  validateCustomerAddition: async (): Promise<ValidationResponse> => {
    const response = await api.get(`${BASE_URL}/validate/customer`);
    return response.data;
  },

  // Admin endpoints

  /**
   * Create a subscription package (Admin only)
   */
  createPackage: async (data: CreateSubscriptionPackageRequest): Promise<SubscriptionPackageResponse> => {
    const response = await api.post(`${BASE_URL}/packages/admin`, data);
    return response.data;
  },

  /**
   * Update a subscription package (Admin only)
   */
  updatePackage: async (
    packageId: string,
    data: UpdateSubscriptionPackageRequest
  ): Promise<SubscriptionPackageResponse> => {
    const response = await api.put(`${BASE_URL}/packages/admin/${packageId}`, data);
    return response.data;
  },

  /**
   * Delete a subscription package (Admin only)
   */
  deletePackage: async (packageId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`${BASE_URL}/packages/admin/${packageId}`);
    return response.data;
  },

  /**
   * Get all subscriptions (Admin only)
   */
  getAllSubscriptions: async (query?: GetSubscriptionsQuery): Promise<AllSubscriptionsResponse> => {
    const response = await api.get(`${BASE_URL}/admin/all`, { params: query });
    return response.data;
  }
};
