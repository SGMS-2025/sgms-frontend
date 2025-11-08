import type { TFunction } from 'i18next';
import { parsePriceInput } from '@/utils/currency';

export interface ServiceFormValues {
  name?: string;
  price?: string;
  duration?: string;
  sessionCount?: string;
  minParticipants?: string;
  maxParticipants?: string;
  featureName?: string;
  serviceName?: string;
}

export interface ValidationContext {
  translationKey: string;
  values: ServiceFormValues;
}

/**
 * Validate a single field for service/feature forms
 * Returns the translation key for the error message, or empty string if valid
 */
export const validateServiceField = (field: string, value: string, context: ValidationContext): string => {
  const { translationKey, values } = context;

  switch (field) {
    case 'name':
    case 'featureName':
    case 'serviceName': {
      if (!value.trim()) {
        return `${translationKey}.validation.name_required`;
      }
      return '';
    }

    case 'duration': {
      if (!value.trim()) {
        return `${translationKey}.validation.duration_required`;
      }
      const durationNumValue = Number(value);
      if (isNaN(durationNumValue) || !Number.isInteger(durationNumValue)) {
        return `${translationKey}.validation.duration_invalid`;
      }
      if (durationNumValue < 1) {
        return `${translationKey}.validation.duration_min`;
      }
      if (durationNumValue > 120) {
        return `${translationKey}.validation.duration_max`;
      }
      return '';
    }

    case 'price': {
      // Price validation - required field
      if (!value.trim()) {
        return `${translationKey}.validation.price_required`;
      }
      // Parse formatted price string (e.g., "200.000" -> 200000)
      const priceNumValue = parsePriceInput(value);
      if (priceNumValue === 0 && value.trim() !== '0' && value.trim() !== '') {
        return `${translationKey}.validation.price_invalid`;
      }
      if (priceNumValue < 0) {
        return `${translationKey}.validation.price_negative`;
      }
      return '';
    }

    case 'sessionCount': {
      // SessionCount validation - required field
      if (!value.trim()) {
        return `${translationKey}.validation.session_count_required`;
      }
      const sessionNumValue = Number(value);
      if (isNaN(sessionNumValue) || !Number.isInteger(sessionNumValue)) {
        return `${translationKey}.validation.session_count_invalid`;
      }
      if (sessionNumValue < 1) {
        return `${translationKey}.validation.session_count_min`;
      }
      return '';
    }

    case 'minParticipants': {
      if (!value.trim()) {
        return `${translationKey}.validation.min_participants_required`;
      }
      const minNumValue = Number(value);
      if (isNaN(minNumValue) || !Number.isInteger(minNumValue)) {
        return `${translationKey}.validation.min_participants_invalid`;
      }
      if (minNumValue < 1) {
        return `${translationKey}.validation.min_participants_min`;
      }
      // Check maxParticipants if it's already set
      if (values.maxParticipants?.trim()) {
        const maxValue = Number(values.maxParticipants);
        if (!isNaN(maxValue) && minNumValue > maxValue) {
          return `${translationKey}.validation.min_greater_than_max`;
        }
      }
      return '';
    }

    case 'maxParticipants': {
      if (!value.trim()) {
        return `${translationKey}.validation.max_participants_required`;
      }
      const maxNumValue = Number(value);
      if (isNaN(maxNumValue) || !Number.isInteger(maxNumValue)) {
        return `${translationKey}.validation.max_participants_invalid`;
      }
      if (maxNumValue < 1) {
        return `${translationKey}.validation.max_participants_min`;
      }
      // Check minParticipants if it's already set
      if (values.minParticipants?.trim()) {
        const minValue = Number(values.minParticipants);
        if (!isNaN(minValue) && maxNumValue < minValue) {
          return `${translationKey}.validation.max_less_than_min`;
        }
      }
      return '';
    }

    default:
      return '';
  }
};

/**
 * Create a validator function with translation support
 */
export const createServiceValidator = (t: TFunction, translationKey: string) => {
  return (field: string, value: string, allValues: ServiceFormValues): string => {
    const context: ValidationContext = {
      translationKey,
      values: allValues
    };
    const errorKey = validateServiceField(field, value, context);
    return errorKey ? t(errorKey) : '';
  };
};

/**
 * Validate feature name
 */
export const validateFeatureName = (value: string, t: TFunction, translationKey: string): string => {
  if (!value.trim()) {
    return t(`${translationKey}.validation.name_required`);
  }
  return '';
};
