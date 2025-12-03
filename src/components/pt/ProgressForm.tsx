import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import { usePhotoManager } from '@/hooks/usePhotoManager';
import { calculateBMI, formatDateForInput, convertBlobUrlsToFiles } from '@/utils/progressUtils';
import { validateProgressForm, canSubmitForm, formatValidationErrors } from '@/utils/progressValidation';
import { BMIDisplay } from './shared/BMIDisplay';
import { CameraModal } from './shared/CameraModal';
import { PhotoUploadSection } from './shared/PhotoUploadSection';
import type { CreateTrainingProgressRequest, UpdateTrainingProgressRequest } from '@/types/api/TrainingProgress';
import type { TrainingLog, ProgressFormData, EditProgressFormData } from '@/types/forms/Progress';

// ============================================================================
// TYPES
// ============================================================================

interface FormDataState {
  date: string;
  weight: string;
  height: string;
  strength: number[];
  notes: string;
  exercises: string;
  // Body Measurements
  bodyFatPercentage: string;
  chest: string;
  waist: string;
  hips: string;
  arms: string;
  thighs: string;
  muscleMassPercentage: string;
  bodyWaterPercentage: string;
  metabolicAge: string;
}

// Discriminated union for props based on mode
interface AddModeProps {
  mode: 'add';
  customerId: string;
  serviceContractId: string;
  trainerId: string;
  onSubmit: (data: ProgressFormData) => void;
  onCancel: () => void;
}

interface EditModeProps {
  mode: 'edit';
  progressId: string;
  initialData: TrainingLog;
  onSubmit: (data: EditProgressFormData) => void;
  onCancel: () => void;
}

export type ProgressFormProps = AddModeProps | EditModeProps;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getInitialFormData = (mode: 'add' | 'edit', initialData?: TrainingLog): FormDataState => {
  if (mode === 'edit' && initialData) {
    return {
      date: formatDateForInput(initialData.date),
      weight: initialData.weight.toString(),
      height: initialData.height.toString(),
      strength: [initialData.strength],
      notes: initialData.notes,
      exercises: initialData.exercises.join(', ') || '',
      bodyFatPercentage: initialData.bodyFatPercentage?.toString() || '',
      chest: initialData.chest?.toString() || '',
      waist: initialData.waist?.toString() || '',
      hips: initialData.hips?.toString() || '',
      arms: initialData.arms?.toString() || '',
      thighs: initialData.thighs?.toString() || '',
      muscleMassPercentage: initialData.muscleMassPercentage?.toString() || '',
      bodyWaterPercentage: initialData.bodyWaterPercentage?.toString() || '',
      metabolicAge: initialData.metabolicAge?.toString() || ''
    };
  }

  // Add mode - empty form with today's date
  return {
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    strength: [75],
    notes: '',
    exercises: '',
    bodyFatPercentage: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    muscleMassPercentage: '',
    bodyWaterPercentage: '',
    metabolicAge: ''
  };
};

const hasBodyMeasurements = (data?: TrainingLog): boolean => {
  if (!data) return false;
  return !!(
    data.bodyFatPercentage ||
    data.chest ||
    data.waist ||
    data.hips ||
    data.arms ||
    data.thighs ||
    data.muscleMassPercentage ||
    data.bodyWaterPercentage ||
    data.metabolicAge
  );
};

const parseBodyMeasurements = (
  formData: FormDataState,
  target: CreateTrainingProgressRequest | UpdateTrainingProgressRequest
) => {
  if (formData.bodyFatPercentage?.trim()) {
    target.bodyFatPercentage = parseFloat(formData.bodyFatPercentage);
  }
  if (formData.chest?.trim()) {
    target.chest = parseFloat(formData.chest);
  }
  if (formData.waist?.trim()) {
    target.waist = parseFloat(formData.waist);
  }
  if (formData.hips?.trim()) {
    target.hips = parseFloat(formData.hips);
  }
  if (formData.arms?.trim()) {
    target.arms = parseFloat(formData.arms);
  }
  if (formData.thighs?.trim()) {
    target.thighs = parseFloat(formData.thighs);
  }
  if (formData.muscleMassPercentage?.trim()) {
    target.muscleMassPercentage = parseFloat(formData.muscleMassPercentage);
  }
  if (formData.bodyWaterPercentage?.trim()) {
    target.bodyWaterPercentage = parseFloat(formData.bodyWaterPercentage);
  }
  if (formData.metabolicAge?.trim()) {
    target.metabolicAge = parseInt(formData.metabolicAge, 10);
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ProgressForm: React.FC<ProgressFormProps> = (props) => {
  const { mode, onSubmit, onCancel } = props;
  const { t } = useTranslation();

  // Hook calls - use both but only utilize what's needed based on mode
  const { createProgress, createLoading, updateProgress, updateLoading, uploadPhotos, photoLoading } =
    useTrainingProgress();

  // Get initial data for edit mode
  const initialData = mode === 'edit' ? props.initialData : undefined;

  // Photo manager
  const photoManager = usePhotoManager({
    maxPhotos: 5,
    existingPhotos: mode === 'edit' ? initialData?.photos || [] : []
  });

  // Form state
  const [formData, setFormData] = useState<FormDataState>(() => getInitialFormData(mode, initialData));

  const [showBodyMeasurements, setShowBodyMeasurements] = useState(() =>
    mode === 'edit' ? hasBodyMeasurements(initialData) : false
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when initialData changes (edit mode only)
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData(getInitialFormData('edit', initialData));
      setShowBodyMeasurements(hasBodyMeasurements(initialData));
    }
  }, [mode, initialData]);

  // Form field change handler
  const handleFieldChange = useCallback((field: keyof FormDataState, value: string | number[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Reset form (only for add mode)
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData('add'));
    setShowBodyMeasurements(false);
  }, []);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validate form
      const totalPhotos =
        mode === 'edit'
          ? (photoManager.existingPhotos?.length || 0) + photoManager.newPhotos.length
          : photoManager.newPhotos.length;

      const validation = validateProgressForm(formData, totalPhotos);
      if (!validation.isValid) {
        toast.error(formatValidationErrors(validation.errors));
        return;
      }

      // Parse common data
      const exercisesArray = formData.exercises
        .split(',')
        .map((ex) => ex.trim())
        .filter((ex) => ex.length > 0);

      const weight = parseFloat(formData.weight);
      const height = parseFloat(formData.height);
      const bmi = calculateBMI(weight, height);

      // =====================================================================
      // ADD MODE
      // =====================================================================
      if (mode === 'add') {
        const { customerId, serviceContractId, trainerId } = props;

        const progressData: CreateTrainingProgressRequest = {
          customerId,
          serviceContractId,
          trainerId,
          date: formData.date,
          weight,
          height,
          strength: formData.strength[0],
          notes: formData.notes || '',
          exercises: exercisesArray,
          photos: []
        };

        // Add body measurements
        parseBodyMeasurements(formData, progressData);

        // Step 1: Create progress
        const createResponse = await createProgress(progressData);
        if (!createResponse.success) {
          toast.error(createResponse.message || t('toast.progress_save_failed'));
          return;
        }

        const createdProgressId = createResponse.data._id;

        // Step 2: Upload photos if any
        let photoUploadSuccess = true;
        if (photoManager.newPhotos.length > 0) {
          try {
            const files = await convertBlobUrlsToFiles(photoManager.newPhotos);
            const uploadResponse = await uploadPhotos(createdProgressId, files);
            if (!uploadResponse.success) {
              photoUploadSuccess = false;
              toast.warning(t('toast.progress_saved_but_photos_failed', 'Progress saved, but some photos failed'));
            }
          } catch {
            photoUploadSuccess = false;
            toast.warning(
              t('toast.progress_saved_but_photos_error', 'Progress saved, but photos could not be uploaded')
            );
          }
        }

        // Step 3: Call parent onSubmit
        const allPhotos = photoUploadSuccess ? photoManager.getAllPhotosAsUrls() : [];
        onSubmit({
          date: formData.date,
          weight,
          height,
          bmi,
          strength: formData.strength[0],
          notes: formData.notes,
          photos: allPhotos,
          exercises: exercisesArray
        });

        // Step 4: Cleanup and reset
        photoManager.cleanupNewPhotos();
        toast.success(t('toast.progress_saved_success'));
        resetForm();
      }

      // =====================================================================
      // EDIT MODE
      // =====================================================================
      if (mode === 'edit') {
        const { progressId } = props;

        const updateData: UpdateTrainingProgressRequest = {
          date: formData.date,
          weight,
          height,
          strength: formData.strength[0],
          notes: formData.notes || '',
          exercises: exercisesArray
        };

        // Add body measurements
        parseBodyMeasurements(formData, updateData);

        // Step 1: Update progress
        const response = await updateProgress(progressId, updateData);
        if (!response.success) {
          toast.error(response.message || t('toast.progress_update_failed'));
          return;
        }

        // Step 2: Upload new photos if any
        if (photoManager.newPhotos.length > 0) {
          const files = await convertBlobUrlsToFiles(photoManager.newPhotos);
          await uploadPhotos(progressId, files);
        }

        // Step 3: Call parent onSubmit
        const allPhotos = photoManager.getAllPhotosAsUrls();
        onSubmit({
          date: formData.date,
          weight,
          height,
          bmi,
          strength: formData.strength[0],
          notes: formData.notes,
          photos: allPhotos,
          exercises: exercisesArray
        });

        // Step 4: Cleanup
        photoManager.cleanupNewPhotos();
        toast.success(t('toast.progress_updated_success'));
      }
    } catch (error) {
      toast.error(t('toast.unexpected_error', 'An unexpected error occurred'));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    photoManager.cleanupNewPhotos();
    onCancel();
  };

  // Determine loading state
  const isLoading = mode === 'add' ? createLoading : updateLoading;
  const submitButtonText =
    mode === 'add'
      ? isSubmitting
        ? createLoading
          ? 'Saving Progress...'
          : photoLoading
            ? 'Uploading Photos...'
            : 'Processing...'
        : 'Save Progress'
      : isLoading
        ? 'Updating...'
        : photoLoading
          ? 'Uploading photos...'
          : 'Update Progress';

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Date, Weight and Height */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="0"
            placeholder="72.5"
            value={formData.weight}
            onChange={(e) => handleFieldChange('weight', e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            step="1"
            min="0"
            placeholder="175"
            value={formData.height}
            onChange={(e) => handleFieldChange('height', e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* BMI Display */}
      <BMIDisplay weight={formData.weight} height={formData.height} />

      {/* Body Measurements Toggle */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => setShowBodyMeasurements(!showBodyMeasurements)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span className="font-medium text-[#101D33]">
            {t('progress_form.body_measurements', 'Số đo cơ thể (Tùy chọn)')}
          </span>
          <span className={`transform transition-transform ${showBodyMeasurements ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showBodyMeasurements && (
          <div className="px-4 pb-4 space-y-4">
            {/* Row 1: Chest, Waist, Hips */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chest">{t('progress_form.chest', 'Vòng ngực (cm)')}</Label>
                <Input
                  id="chest"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="95"
                  value={formData.chest}
                  onChange={(e) => handleFieldChange('chest', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">{t('progress_form.waist', 'Vòng eo (cm)')}</Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="80"
                  value={formData.waist}
                  onChange={(e) => handleFieldChange('waist', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hips">{t('progress_form.hips', 'Vòng mông (cm)')}</Label>
                <Input
                  id="hips"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="95"
                  value={formData.hips}
                  onChange={(e) => handleFieldChange('hips', e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Arms, Thighs, Body Fat */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arms">{t('progress_form.arms', 'Vòng tay (cm)')}</Label>
                <Input
                  id="arms"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="35"
                  value={formData.arms}
                  onChange={(e) => handleFieldChange('arms', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thighs">{t('progress_form.thighs', 'Vòng đùi (cm)')}</Label>
                <Input
                  id="thighs"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="55"
                  value={formData.thighs}
                  onChange={(e) => handleFieldChange('thighs', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFatPercentage">{t('progress_form.body_fat', '% Mỡ cơ thể')}</Label>
                <Input
                  id="bodyFatPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="15"
                  value={formData.bodyFatPercentage}
                  onChange={(e) => handleFieldChange('bodyFatPercentage', e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Muscle Mass, Body Water, Metabolic Age */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="muscleMassPercentage">{t('progress_form.muscle_mass', '% Cơ bắp')}</Label>
                <Input
                  id="muscleMassPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="40"
                  value={formData.muscleMassPercentage}
                  onChange={(e) => handleFieldChange('muscleMassPercentage', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyWaterPercentage">{t('progress_form.body_water', '% Nước')}</Label>
                <Input
                  id="bodyWaterPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="55"
                  value={formData.bodyWaterPercentage}
                  onChange={(e) => handleFieldChange('bodyWaterPercentage', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metabolicAge">{t('progress_form.metabolic_age', 'Tuổi trao đổi chất')}</Label>
                <Input
                  id="metabolicAge"
                  type="number"
                  step="1"
                  min="1"
                  max="150"
                  placeholder="25"
                  value={formData.metabolicAge}
                  onChange={(e) => handleFieldChange('metabolicAge', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Strength Slider */}
      <div className="space-y-3">
        <Label>Strength (0-100)</Label>
        <div className="px-2">
          <Slider
            value={formData.strength}
            onValueChange={(value) => handleFieldChange('strength', value)}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>0</span>
            <span className="font-semibold text-[#F05A29]">{formData.strength[0]}</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-2">
        <Label htmlFor="exercises">Exercises (comma separated)</Label>
        <Input
          id="exercises"
          placeholder="Squat, Bench Press, Deadlift"
          value={formData.exercises}
          onChange={(e) => handleFieldChange('exercises', e.target.value)}
          className="w-full"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Training Notes</Label>
        <Textarea
          id="notes"
          placeholder="Describe the training session, improvements, challenges..."
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          className="min-h-24 resize-y"
          rows={4}
        />
      </div>

      {/* Photo Section */}
      <PhotoUploadSection
        maxPhotos={5}
        existingPhotos={photoManager.existingPhotos}
        newPhotos={photoManager.newPhotos}
        canAddMore={photoManager.canAddMore}
        fileInputRef={photoManager.fileInputRef as React.RefObject<HTMLInputElement | null>}
        onOpenCamera={photoManager.openCamera}
        onFileUpload={photoManager.handleFileUpload}
        onRemovePhoto={photoManager.removePhoto}
        onUploadClick={() => photoManager.fileInputRef.current?.click()}
        isProcessing={photoManager.isProcessing}
        processingProgress={photoManager.processingProgress}
      />

      {/* Camera Modal */}
      {photoManager.isCameraOpen && (
        <CameraModal
          videoRef={photoManager.videoRef as React.RefObject<HTMLVideoElement | null>}
          onCapture={photoManager.capturePhoto}
          onClose={photoManager.closeCamera}
        />
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={photoManager.canvasRef} className="hidden" />

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || isLoading || photoLoading || !canSubmitForm(formData)}
          className="flex-1 bg-[#F05A29] hover:bg-[#E04A1F] text-white"
        >
          {submitButtonText}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting || isLoading || photoLoading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProgressForm;
