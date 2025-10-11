import i18n from '@/configs/i18n';
import { toast } from 'sonner';

/**
 * Permission error mapping configuration
 * Maps permission names to their corresponding translation keys
 */
const PERMISSION_ERROR_MAP: Record<string, string> = {
  // Feature permissions
  'feature:create': 'error.FEATURE_CREATE_PERMISSION_DENIED',
  'feature:update': 'error.FEATURE_UPDATE_PERMISSION_DENIED',
  'feature:delete': 'error.FEATURE_DELETE_PERMISSION_DENIED',
  'feature:read': 'error.FEATURE_READ_PERMISSION_DENIED',

  // Package/Service permissions
  'package:create': 'error.SERVICE_CREATE_PERMISSION_DENIED',
  'package:update': 'error.SERVICE_UPDATE_PERMISSION_DENIED',
  'package:delete': 'error.SERVICE_DELETE_PERMISSION_DENIED',
  'package:read': 'error.SERVICE_READ_PERMISSION_DENIED',

  // Matrix permissions
  'matrix:save': 'error.MATRIX_SAVE_PERMISSION_DENIED',
  'matrix:read': 'error.MATRIX_READ_PERMISSION_DENIED',

  // Discount campaign permissions
  'discountcampaign:create': 'error.DISCOUNT_CAMPAIGN_CREATE_PERMISSION_DENIED',
  'discountcampaign:update': 'error.DISCOUNT_CAMPAIGN_UPDATE_PERMISSION_DENIED',
  'discountcampaign:delete': 'error.DISCOUNT_CAMPAIGN_DELETE_PERMISSION_DENIED',
  'discountcampaign:read': 'error.DISCOUNT_CAMPAIGN_READ_PERMISSION_DENIED',

  // Customer permissions
  'customer:create': 'error.CUSTOMER_CREATE_PERMISSION_DENIED',
  'customer:update': 'error.CUSTOMER_UPDATE_PERMISSION_DENIED',
  'customer:delete': 'error.CUSTOMER_DELETE_PERMISSION_DENIED',
  'customer:read': 'error.CUSTOMER_READ_PERMISSION_DENIED',
  'customer:status': 'error.CUSTOMER_STATUS_PERMISSION_DENIED'
};

/**
 * Handles permission errors by showing appropriate toast messages
 * @param errorMessage - The error message from the API response
 * @returns The translation key used for the error message
 */
export function handlePermissionError(errorMessage: string): string {
  // Find matching permission in the error message
  const matchedPermission = Object.keys(PERMISSION_ERROR_MAP).find((permission) => errorMessage.includes(permission));

  // Get the appropriate error key
  const errorKey = matchedPermission ? PERMISSION_ERROR_MAP[matchedPermission] : 'error.PERMISSION_DENIED';

  // Show toast notification
  toast.error(i18n.t(errorKey));

  return errorKey;
}

/**
 * Checks if an error message contains permission-related errors
 * @param errorMessage - The error message to check
 * @returns True if the error is permission-related
 */
export function isPermissionError(errorMessage: string): boolean {
  return Object.keys(PERMISSION_ERROR_MAP).some((permission) => errorMessage.includes(permission));
}

/**
 * Handles specific error types for different operations
 * @param errorMessage - The error message from the API response
 * @param operation - The operation being performed
 * @returns The translation key used for the error message
 */
export function handleSpecificError(errorMessage: string, operation?: string): string {
  // Handle permission errors first
  if (isPermissionError(errorMessage)) {
    return handlePermissionError(errorMessage);
  }

  // Handle specific operation errors
  if (operation) {
    const operationErrorMap: Record<string, string> = {
      create_feature: 'error.FEATURE_CREATE_FAILED',
      update_feature: 'error.FEATURE_UPDATE_FAILED',
      delete_feature: 'error.FEATURE_DELETE_FAILED',
      create_service: 'error.SERVICE_CREATE_FAILED',
      update_service: 'error.SERVICE_UPDATE_FAILED',
      delete_service: 'error.SERVICE_DELETE_FAILED',
      save_matrix: 'error.MATRIX_SAVE_FAILED',
      load_matrix: 'error.MATRIX_LOAD_FAILED'
    };

    const errorKey = operationErrorMap[operation];
    if (errorKey) {
      toast.error(i18n.t(errorKey));
      return errorKey;
    }
  }

  // Default error handling - only show toast if not a permission error
  toast.error(i18n.t('error.PERMISSION_DENIED'));
  return 'error.PERMISSION_DENIED';
}
