import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createServiceValidator, validateFeatureName } from '@/utils/serviceValidation';
import type { ServiceFormValues } from '@/utils/serviceValidation';

export interface UseServiceFormOptions {
  serviceType: 'CLASS' | 'PT';
  defaultMinParticipants?: number;
  defaultMaxParticipants?: number;
  initialValues?: Partial<ServiceFormValues>;
}

export interface UseServiceFormReturn {
  // Form values
  values: ServiceFormValues;
  setValue: (field: keyof ServiceFormValues, value: string) => void;
  resetForm: () => void;

  // Validation
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouched: (field: string, value: boolean) => void;
  validateField: (field: string, value: string) => string;
  validateAll: (fields: string[]) => boolean;

  // Handlers
  handleFieldChange: (field: string, value: string, dependentFields?: string[]) => void;
  handleFieldBlur: (field: string, triggerFullValidation?: boolean) => void;

  // State
  isClosing: boolean;
  setIsClosing: (value: boolean) => void;
}

export const useServiceForm = (options: UseServiceFormOptions): UseServiceFormReturn => {
  const { serviceType, defaultMinParticipants = 5, defaultMaxParticipants = 20, initialValues = {} } = options;
  const { t } = useTranslation();
  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';

  // Form values
  const [values, setValues] = useState<ServiceFormValues>({
    name: '',
    price: '',
    duration: '1',
    sessionCount: '',
    minParticipants: defaultMinParticipants.toString(),
    maxParticipants: defaultMaxParticipants.toString(),
    ...initialValues
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isClosing, setIsClosing] = useState(false);

  // Create validator
  const validator = createServiceValidator(t, translationKey);

  // Set single value
  const setValue = useCallback((field: keyof ServiceFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Set touched state
  const setTouched = useCallback((field: string, value: boolean) => {
    setTouchedState((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Validate single field
  const validateField = useCallback(
    (field: string, value: string): string => {
      return validator(field, value, values);
    },
    [validator, values]
  );

  // Handle field change
  const handleFieldChange = useCallback(
    (field: string, value: string, dependentFields: string[] = []) => {
      setValue(field as keyof ServiceFormValues, value);

      // Validate current field if touched
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }

      // Re-validate dependent fields
      dependentFields.forEach((depField) => {
        if (touched[depField] && values[depField as keyof ServiceFormValues]) {
          const depValue = values[depField as keyof ServiceFormValues] || '';
          const depError = validateField(depField, depValue);
          setErrors((prev) => ({ ...prev, [depField]: depError }));
        }
      });
    },
    [setValue, touched, validateField, values]
  );

  // Handle field blur
  const handleFieldBlur = useCallback(
    (field: string, triggerFullValidation = false) => {
      if (isClosing) return;

      setTouched(field, true);
      const value = values[field as keyof ServiceFormValues] || '';
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));

      // Trigger full validation if needed
      if (triggerFullValidation && error) {
        // This will be handled by validateAll in the component
      }
    },
    [isClosing, setTouched, validateField, values]
  );

  // Validate all fields
  const validateAll = useCallback(
    (fields: string[]): boolean => {
      const newErrors: Record<string, string> = {};
      const newTouched: Record<string, boolean> = {};

      fields.forEach((field) => {
        const value = values[field as keyof ServiceFormValues] || '';
        const error = validateField(field, value);
        newTouched[field] = true;
        if (error) {
          newErrors[field] = error;
        }
      });

      setErrors(newErrors);
      setTouchedState(newTouched);
      return Object.keys(newErrors).length === 0;
    },
    [validateField, values]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setValues({
      name: '',
      price: '',
      duration: '1',
      sessionCount: '',
      minParticipants: defaultMinParticipants.toString(),
      maxParticipants: defaultMaxParticipants.toString(),
      ...initialValues
    });
    setErrors({});
    setTouchedState({});
    setIsClosing(false);
  }, [defaultMinParticipants, defaultMaxParticipants, initialValues]);

  return {
    values,
    setValue,
    resetForm,
    errors,
    touched,
    setTouched,
    validateField,
    validateAll,
    handleFieldChange,
    handleFieldBlur,
    isClosing,
    setIsClosing
  };
};

/**
 * Hook for feature form (simpler, single field)
 */
export interface UseFeatureFormReturn {
  name: string;
  setName: (value: string) => void;
  error: string;
  touched: boolean;
  setTouched: (value: boolean) => void;
  validateName: (value: string) => string;
  resetForm: () => void;
  isClosing: boolean;
  setIsClosing: (value: boolean) => void;
}

export const useFeatureForm = (serviceType: 'CLASS' | 'PT'): UseFeatureFormReturn => {
  const { t } = useTranslation();
  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const validateName = useCallback(
    (value: string): string => {
      return validateFeatureName(value, t, translationKey);
    },
    [t, translationKey]
  );

  const resetForm = useCallback(() => {
    setName('');
    setError('');
    setTouched(false);
    setIsClosing(false);
  }, []);

  return {
    name,
    setName,
    error,
    touched,
    setTouched,
    validateName,
    resetForm,
    isClosing,
    setIsClosing
  };
};
