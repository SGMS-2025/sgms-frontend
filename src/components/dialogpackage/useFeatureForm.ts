import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { validateFeatureName } from '@/utils/serviceValidation';

interface UseFeatureFormOptions {
  serviceType: 'CLASS' | 'PT';
  initialName?: string;
  validateOnBlur?: boolean; // For AddFeatureDialog's special validation timing
}

export function useFeatureForm({ serviceType, initialName = '', validateOnBlur = false }: UseFeatureFormOptions) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (touched) {
        const errorMsg = validateFeatureName(value, t, translationKey);
        setError(errorMsg);
      }
    },
    [touched, t, translationKey]
  );

  const handleBlur = useCallback(() => {
    if (isClosing) return;

    // For AddFeatureDialog: Only validate if field has been interacted with
    if (validateOnBlur) {
      if (!touched && !name.trim()) {
        return;
      }
    } else {
      // For EditFeatureDialog: Only validate if touched
      if (!touched) {
        return;
      }
    }

    setTouched(true);
    const errorMsg = validateFeatureName(name, t, translationKey);
    setError(errorMsg);
  }, [isClosing, touched, name, validateOnBlur, t, translationKey]);

  const validate = useCallback((): boolean => {
    setTouched(true);
    const errorMsg = validateFeatureName(name, t, translationKey);
    setError(errorMsg);
    return !errorMsg;
  }, [name, t, translationKey]);

  const resetForm = useCallback(() => {
    setName(initialName);
    setError('');
    setTouched(false);
  }, [initialName]);

  const setFormValues = useCallback((values: { name?: string }) => {
    if (values.name !== undefined) {
      setName(values.name);
    }
    setError('');
    setTouched(false);
  }, []);

  return {
    // Form state
    name,
    error,
    touched,
    isClosing,
    setIsClosing,
    translationKey,
    // Handlers
    handleNameChange,
    handleBlur,
    validate,
    resetForm,
    setFormValues
  };
}
