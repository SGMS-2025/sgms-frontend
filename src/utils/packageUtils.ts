// Only keep the used function - validatePackageData
import i18n from '@/configs/i18n';

/**
 * Validate package data before submission
 */
export const validatePackageData = (data: {
  name: string;
  description?: string;
  defaultDurationMonths?: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push(i18n.t('validation.package_name_required'));
  }

  if (data.name && data.name.length > 100) {
    errors.push(i18n.t('validation.package_name_max_length'));
  }

  if (data.description && data.description.length > 1000) {
    errors.push(i18n.t('validation.package_description_max_length'));
  }

  if (data.defaultDurationMonths && (data.defaultDurationMonths < 1 || data.defaultDurationMonths > 120)) {
    errors.push(i18n.t('validation.package_duration_invalid'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
