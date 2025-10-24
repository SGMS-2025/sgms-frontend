import i18n from '@/configs/i18n';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ProgressFormData {
  date: string;
  weight: string;
  height: string;
  strength: number[];
  notes: string;
  exercises: string;
}

/**
 * Validates weight input
 */
export const validateWeight = (weight: string): ValidationResult => {
  const errors: string[] = [];

  if (!weight || weight.trim() === '') {
    errors.push(i18n.t('validation.progress.weight_required'));
  } else {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) {
      errors.push(i18n.t('validation.progress.weight_invalid_number'));
    } else if (weightNum <= 0) {
      errors.push(i18n.t('validation.progress.weight_greater_than_zero'));
    } else if (weightNum > 300) {
      errors.push(i18n.t('validation.progress.weight_max_exceeded'));
    } else if (weightNum < 30) {
      errors.push(i18n.t('validation.progress.weight_min_required'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates height input
 */
export const validateHeight = (height: string): ValidationResult => {
  const errors: string[] = [];

  if (!height || height.trim() === '') {
    errors.push(i18n.t('validation.progress.height_required'));
  } else {
    const heightNum = parseFloat(height);
    if (isNaN(heightNum)) {
      errors.push(i18n.t('validation.progress.height_invalid_number'));
    } else if (heightNum <= 0) {
      errors.push(i18n.t('validation.progress.height_greater_than_zero'));
    } else if (heightNum > 250) {
      errors.push(i18n.t('validation.progress.height_max_exceeded'));
    } else if (heightNum < 100) {
      errors.push(i18n.t('validation.progress.height_min_required'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates date input
 */
export const validateDate = (date: string): ValidationResult => {
  const errors: string[] = [];

  if (!date || date.trim() === '') {
    errors.push(i18n.t('validation.progress.date_required'));
  } else {
    const dateObj = new Date(date);
    const today = new Date();

    if (isNaN(dateObj.getTime())) {
      errors.push(i18n.t('validation.progress.date_invalid_format'));
    } else if (dateObj > today) {
      errors.push(i18n.t('validation.progress.date_future_not_allowed'));
    } else {
      // Check if date is more than 1 year ago
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      if (dateObj < oneYearAgo) {
        errors.push(i18n.t('validation.progress.date_too_old'));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates strength value
 */
export const validateStrength = (strength: number[]): ValidationResult => {
  const errors: string[] = [];

  if (!strength || strength.length === 0) {
    errors.push(i18n.t('validation.progress.strength_required'));
  } else {
    const strengthValue = strength[0];
    if (typeof strengthValue !== 'number') {
      errors.push(i18n.t('validation.progress.strength_invalid_number'));
    } else if (strengthValue < 0 || strengthValue > 100) {
      errors.push(i18n.t('validation.progress.strength_out_of_range'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates exercises input
 */
export const validateExercises = (exercises: string): ValidationResult => {
  const errors: string[] = [];

  if (exercises.trim() !== '') {
    const exercisesList = exercises
      .split(',')
      .map((ex) => ex.trim())
      .filter((ex) => ex.length > 0);

    if (exercisesList.length > 10) {
      errors.push(i18n.t('validation.progress.exercises_max_exceeded'));
    }

    // Check for exercise name length
    const invalidExercises = exercisesList.filter((ex) => ex.length > 50);
    if (invalidExercises.length > 0) {
      errors.push(i18n.t('validation.progress.exercises_name_too_long'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates notes input
 */
export const validateNotes = (notes: string): ValidationResult => {
  const errors: string[] = [];

  // Notes is required
  if (!notes || notes.trim() === '') {
    errors.push(i18n.t('validation.progress.notes_required'));
  } else if (notes.length > 500) {
    errors.push(i18n.t('validation.progress.notes_max_exceeded'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates photo count
 */
export const validatePhotos = (photoCount: number, maxPhotos: number = 5): ValidationResult => {
  const errors: string[] = [];

  if (photoCount > maxPhotos) {
    errors.push(i18n.t('validation.progress.photos_max_exceeded', { maxPhotos }));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Comprehensive form validation
 */
export const validateProgressForm = (formData: ProgressFormData, photoCount: number = 0): ValidationResult => {
  const allErrors: string[] = [];

  // Only validate required fields and optional fields if they have content
  const weightValidation = validateWeight(formData.weight);
  const heightValidation = validateHeight(formData.height);
  const dateValidation = validateDate(formData.date);
  const strengthValidation = validateStrength(formData.strength);
  const photosValidation = validatePhotos(photoCount);

  // Always validate notes (now required)
  const notesValidation = validateNotes(formData.notes);

  // Only validate exercises if they have content
  if (formData.exercises && formData.exercises.trim() !== '') {
    const exercisesValidation = validateExercises(formData.exercises);
    allErrors.push(...exercisesValidation.errors);
  }

  // Collect required field errors
  allErrors.push(...weightValidation.errors);
  allErrors.push(...heightValidation.errors);
  allErrors.push(...dateValidation.errors);
  allErrors.push(...strengthValidation.errors);
  allErrors.push(...notesValidation.errors);
  allErrors.push(...photosValidation.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

/**
 * Get validation status for individual fields (for real-time validation)
 */
export const getFieldValidationStatus = (field: keyof ProgressFormData, value: string | number[] | undefined) => {
  switch (field) {
    case 'weight':
      return validateWeight(value as string);
    case 'height':
      return validateHeight(value as string);
    case 'date':
      return validateDate(value as string);
    case 'strength':
      return validateStrength(value as number[]);
    case 'exercises':
      return validateExercises(value as string);
    case 'notes':
      return validateNotes(value as string);
    default:
      return { isValid: true, errors: [] };
  }
};

/**
 * Check if form can be submitted (basic validation)
 */
export const canSubmitForm = (formData: ProgressFormData): boolean => {
  const weight = parseFloat(formData.weight);
  const height = parseFloat(formData.height);

  return (
    Boolean(formData.date && formData.date.trim() !== '') &&
    !isNaN(weight) &&
    weight > 0 &&
    !isNaN(height) &&
    height > 0 &&
    Boolean(formData.strength && formData.strength.length > 0) &&
    typeof formData.strength[0] === 'number' &&
    Boolean(formData.notes && formData.notes.trim() !== '') // Notes is now required
  );
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];

  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
};
