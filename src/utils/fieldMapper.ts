/**
 * Field mapping configurations for different contexts
 * Maps backend field names to frontend field names
 */
export type FieldMappingContext = 'staff' | 'customer';

export interface FieldMappingConfig {
  [backendField: string]: string;
}

/**
 * Default field mappings for staff forms
 */
const STAFF_FIELD_MAPPINGS: FieldMappingConfig = {
  phoneNumber: 'phoneNumber', // Keep same for staff
  fullName: 'fullName', // Keep same for staff
  dateOfBirth: 'birthDate', // Map to birthDate for AddStaffForm
  username: 'username', // Keep same for staff
  email: 'email' // Keep same
};

/**
 * Default field mappings for customer forms
 */
const CUSTOMER_FIELD_MAPPINGS: FieldMappingConfig = {
  phoneNumber: 'phone', // Map to phone
  fullName: 'name', // Map to name
  dateOfBirth: 'dateOfBirth', // Keep same for customer
  username: 'email', // When username duplicate, show error on email field
  email: 'email' // Keep same
};

/**
 * Map backend field names to frontend field names based on context
 *
 * @param backendField - Field name from backend error
 * @param context - Context type ('staff' or 'customer')
 * @param customMappings - Optional custom field mappings to override defaults
 * @returns Frontend field name
 *
 * @example
 * mapBackendToFrontendField('phoneNumber', 'customer') // Returns 'phone'
 * mapBackendToFrontendField('phoneNumber', 'staff') // Returns 'phoneNumber'
 */
export const mapBackendToFrontendField = (
  backendField: string,
  context: FieldMappingContext = 'staff',
  customMappings?: FieldMappingConfig
): string => {
  // Use custom mappings if provided, otherwise use context-based mappings
  const mappings = customMappings || (context === 'customer' ? CUSTOMER_FIELD_MAPPINGS : STAFF_FIELD_MAPPINGS);

  // Return mapped field or original if no mapping exists
  return mappings[backendField] || backendField;
};

/**
 * Map multiple backend field names to frontend field names
 *
 * @param backendFields - Array of backend field names
 * @param context - Context type ('staff' or 'customer')
 * @param customMappings - Optional custom field mappings to override defaults
 * @returns Object with backend field as key and frontend field as value
 */
export const mapBackendToFrontendFields = (
  backendFields: string[],
  context: FieldMappingContext = 'staff',
  customMappings?: FieldMappingConfig
): Record<string, string> => {
  const result: Record<string, string> = {};
  backendFields.forEach((field) => {
    result[field] = mapBackendToFrontendField(field, context, customMappings);
  });
  return result;
};
