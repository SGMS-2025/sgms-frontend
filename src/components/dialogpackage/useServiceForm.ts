import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createServiceValidator, type ServiceFormValues } from '@/utils/serviceValidation';
import { formatPriceInput } from '@/utils/currency';

export interface ValidationErrors {
  name?: string;
  price?: string;
  duration?: string;
  sessionCount?: string;
  minParticipants?: string;
  maxParticipants?: string;
}

interface UseServiceFormOptions {
  serviceType: 'CLASS' | 'PT';
  defaultMinParticipants?: number;
  defaultMaxParticipants?: number;
  initialValues?: {
    name?: string;
    price?: string;
    duration?: string;
    sessionCount?: string;
    minParticipants?: string;
    maxParticipants?: string;
  };
  validateOnBlur?: boolean; // For AddServiceDialog's special validation timing
}

export function useServiceForm({
  serviceType,
  defaultMinParticipants = 5,
  defaultMaxParticipants = 20,
  initialValues,
  validateOnBlur = false
}: UseServiceFormOptions) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues?.name || '');
  const [price, setPrice] = useState(initialValues?.price || '');
  const [duration, setDuration] = useState(initialValues?.duration || '1');
  const [sessionCount, setSessionCount] = useState(initialValues?.sessionCount || '');
  const [minParticipants, setMinParticipants] = useState(
    initialValues?.minParticipants || defaultMinParticipants.toString()
  );
  const [maxParticipants, setMaxParticipants] = useState(
    initialValues?.maxParticipants || defaultMaxParticipants.toString()
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isClosing, setIsClosing] = useState(false);

  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';
  const validateField = createServiceValidator(t, translationKey);

  // Get current form values for validation context
  const getFormValues = useCallback((): ServiceFormValues => {
    return {
      name,
      price,
      duration,
      sessionCount,
      minParticipants,
      maxParticipants
    };
  }, [name, price, duration, sessionCount, minParticipants, maxParticipants]);

  const handleBlur = useCallback(
    (field: string) => {
      // Don't validate if modal is closing
      if (isClosing) return;

      const value =
        field === 'name'
          ? name
          : field === 'price'
            ? price
            : field === 'duration'
              ? duration
              : field === 'sessionCount'
                ? sessionCount
                : field === 'minParticipants'
                  ? minParticipants
                  : maxParticipants;

      // For AddServiceDialog: Only validate if field has been interacted with
      if (validateOnBlur) {
        if (!touched[field] && !value.trim() && field !== 'duration') {
          return;
        }
        // Duration always has default value '1', so always validate if touched
        if (!touched[field] && field === 'duration' && value === '1') {
          return;
        }
      } else {
        // For EditServiceDialog: Only validate if touched
        if (!touched[field]) {
          return;
        }
      }

      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validateField(field, value, getFormValues());
      setErrors((prev) => ({ ...prev, [field]: error }));

      // If name field is invalid when blurred, validate all fields to show all errors
      if (field === 'name' && error) {
        validateAll();
      }
    },
    [
      isClosing,
      name,
      price,
      duration,
      sessionCount,
      minParticipants,
      maxParticipants,
      touched,
      validateOnBlur,
      validateField,
      getFormValues
    ]
  );

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (touched.name) {
        const formValues = getFormValues();
        formValues.name = value;
        const error = validateField('name', value, formValues);
        setErrors((prev) => ({ ...prev, name: error }));
      }
    },
    [touched.name, validateField, getFormValues]
  );

  const handlePriceChange = useCallback(
    (value: string) => {
      // Format the input value with dots while user types
      const formatted = formatPriceInput(value);
      setPrice(formatted);
      if (touched.price) {
        const formValues = getFormValues();
        formValues.price = formatted;
        const error = validateField('price', formatted, formValues);
        setErrors((prev) => ({ ...prev, price: error }));
      }
      // Re-validate sessionCount when price changes
      if (touched.sessionCount && sessionCount.trim()) {
        const formValues = getFormValues();
        formValues.price = formatted;
        const sessionError = validateField('sessionCount', sessionCount, formValues);
        setErrors((prev) => ({ ...prev, sessionCount: sessionError }));
      }
    },
    [touched.price, touched.sessionCount, sessionCount, validateField, getFormValues]
  );

  const handleDurationChange = useCallback(
    (value: string) => {
      setDuration(value);
      if (touched.duration) {
        const formValues = getFormValues();
        formValues.duration = value;
        const error = validateField('duration', value, formValues);
        setErrors((prev) => ({ ...prev, duration: error }));
      }
    },
    [touched.duration, validateField, getFormValues]
  );

  const handleSessionCountChange = useCallback(
    (value: string) => {
      setSessionCount(value);
      if (touched.sessionCount) {
        const formValues = getFormValues();
        formValues.sessionCount = value;
        const error = validateField('sessionCount', value, formValues);
        setErrors((prev) => ({ ...prev, sessionCount: error }));
      }
      // Re-validate price when sessionCount changes
      if (touched.price && price.trim()) {
        const formValues = getFormValues();
        formValues.sessionCount = value;
        const priceError = validateField('price', price, formValues);
        setErrors((prev) => ({ ...prev, price: priceError }));
      }
    },
    [touched.sessionCount, touched.price, price, validateField, getFormValues]
  );

  const handleMinParticipantsChange = useCallback(
    (value: string) => {
      setMinParticipants(value);
      if (touched.minParticipants) {
        const formValues = getFormValues();
        formValues.minParticipants = value;
        const error = validateField('minParticipants', value, formValues);
        setErrors((prev) => ({ ...prev, minParticipants: error }));
      }
      // Also re-validate maxParticipants if it's been touched
      if (touched.maxParticipants) {
        const formValues = getFormValues();
        formValues.minParticipants = value;
        const maxError = validateField('maxParticipants', maxParticipants, formValues);
        setErrors((prev) => ({ ...prev, maxParticipants: maxError }));
      }
    },
    [touched.minParticipants, touched.maxParticipants, maxParticipants, validateField, getFormValues]
  );

  const handleMaxParticipantsChange = useCallback(
    (value: string) => {
      setMaxParticipants(value);
      if (touched.maxParticipants) {
        const formValues = getFormValues();
        formValues.maxParticipants = value;
        const error = validateField('maxParticipants', value, formValues);
        setErrors((prev) => ({ ...prev, maxParticipants: error }));
      }
      // Also re-validate minParticipants if it's been touched
      if (touched.minParticipants) {
        const formValues = getFormValues();
        formValues.maxParticipants = value;
        const minError = validateField('minParticipants', minParticipants, formValues);
        setErrors((prev) => ({ ...prev, minParticipants: minError }));
      }
    },
    [touched.maxParticipants, touched.minParticipants, minParticipants, validateField, getFormValues]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    const allFields = ['name', 'duration', 'minParticipants', 'maxParticipants', 'price', 'sessionCount'];
    const formValues = getFormValues();

    // Validate all fields and collect all errors
    allFields.forEach((field) => {
      const value =
        field === 'name'
          ? name
          : field === 'price'
            ? price
            : field === 'duration'
              ? duration
              : field === 'sessionCount'
                ? sessionCount
                : field === 'minParticipants'
                  ? minParticipants
                  : maxParticipants;
      const error = validateField(field, value, formValues);
      if (error) {
        newErrors[field as keyof ValidationErrors] = error;
      }
    });

    // Set all errors at once and mark all fields as touched
    setErrors(newErrors);
    setTouched({
      name: true,
      price: true,
      duration: true,
      sessionCount: true,
      minParticipants: true,
      maxParticipants: true
    });

    // Return false if there are any errors
    return Object.keys(newErrors).length === 0;
  }, [name, price, duration, sessionCount, minParticipants, maxParticipants, validateField, getFormValues]);

  const resetForm = useCallback(() => {
    setName(initialValues?.name || '');
    setPrice(initialValues?.price || '');
    setDuration(initialValues?.duration || '1');
    setSessionCount(initialValues?.sessionCount || '');
    setMinParticipants(initialValues?.minParticipants || defaultMinParticipants.toString());
    setMaxParticipants(initialValues?.maxParticipants || defaultMaxParticipants.toString());
    setErrors({});
    setTouched({});
  }, [initialValues, defaultMinParticipants, defaultMaxParticipants]);

  const setFormValues = useCallback(
    (values: {
      name?: string;
      price?: string;
      duration?: string;
      sessionCount?: string;
      minParticipants?: string;
      maxParticipants?: string;
    }) => {
      if (values.name !== undefined) setName(values.name);
      if (values.price !== undefined) setPrice(values.price);
      if (values.duration !== undefined) setDuration(values.duration);
      if (values.sessionCount !== undefined) setSessionCount(values.sessionCount);
      if (values.minParticipants !== undefined) setMinParticipants(values.minParticipants);
      if (values.maxParticipants !== undefined) setMaxParticipants(values.maxParticipants);
    },
    []
  );

  return {
    // Form state
    name,
    price,
    duration,
    sessionCount,
    minParticipants,
    maxParticipants,
    errors,
    touched,
    isClosing,
    setIsClosing,
    translationKey,
    // Handlers
    handleNameChange,
    handlePriceChange,
    handleDurationChange,
    handleSessionCountChange,
    handleMinParticipantsChange,
    handleMaxParticipantsChange,
    handleBlur,
    validateAll,
    resetForm,
    setFormValues,
    // Utils
    getFormValues
  };
}
