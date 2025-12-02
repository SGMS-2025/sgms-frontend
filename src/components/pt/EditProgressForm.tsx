import React, { useState, useEffect } from 'react';
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
import type { UpdateTrainingProgressRequest } from '@/types/api/TrainingProgress';
import type { EditProgressFormProps } from '@/types/forms/Progress';

export const EditProgressForm: React.FC<EditProgressFormProps> = ({ progressId, initialData, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const { updateProgress, updateLoading, uploadPhotos, photoLoading } = useTrainingProgress();

  // DEBUG: Log initialData to see what's being passed
  console.log('EditProgressForm initialData:', {
    id: initialData.id,
    chest: initialData.chest,
    waist: initialData.waist,
    hips: initialData.hips,
    arms: initialData.arms,
    thighs: initialData.thighs,
    bodyFatPercentage: initialData.bodyFatPercentage,
    muscleMassPercentage: initialData.muscleMassPercentage,
    bodyWaterPercentage: initialData.bodyWaterPercentage,
    metabolicAge: initialData.metabolicAge
  });
  const photoManager = usePhotoManager({
    maxPhotos: 5,
    existingPhotos: initialData.photos || []
  });

  const [formData, setFormData] = useState({
    date: formatDateForInput(initialData.date),
    weight: initialData.weight.toString(),
    height: initialData.height.toString(),
    strength: [initialData.strength],
    notes: initialData.notes,
    exercises: initialData.exercises.join(', ') || '',
    // Body Measurements
    bodyFatPercentage: initialData.bodyFatPercentage?.toString() || '',
    chest: initialData.chest?.toString() || '',
    waist: initialData.waist?.toString() || '',
    hips: initialData.hips?.toString() || '',
    arms: initialData.arms?.toString() || '',
    thighs: initialData.thighs?.toString() || '',
    muscleMassPercentage: initialData.muscleMassPercentage?.toString() || '',
    bodyWaterPercentage: initialData.bodyWaterPercentage?.toString() || '',
    metabolicAge: initialData.metabolicAge?.toString() || ''
  });

  const [showBodyMeasurements, setShowBodyMeasurements] = useState(
    !!(
      initialData.bodyFatPercentage ||
      initialData.chest ||
      initialData.waist ||
      initialData.hips ||
      initialData.arms ||
      initialData.thighs ||
      initialData.muscleMassPercentage ||
      initialData.bodyWaterPercentage ||
      initialData.metabolicAge
    )
  );

  useEffect(() => {
    // Update form when initialData changes
    setFormData({
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
    });
    setShowBodyMeasurements(
      !!(
        initialData.bodyFatPercentage ||
        initialData.chest ||
        initialData.waist ||
        initialData.hips ||
        initialData.arms ||
        initialData.thighs ||
        initialData.muscleMassPercentage ||
        initialData.bodyWaterPercentage ||
        initialData.metabolicAge
      )
    );
    // photoManager will handle photos via its own useEffect
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form using validation utility
    const totalPhotos = (photoManager.existingPhotos?.length || 0) + photoManager.newPhotos.length;
    const validation = validateProgressForm(formData, totalPhotos);

    if (!validation.isValid) {
      toast.error(formatValidationErrors(validation.errors));
      return;
    }

    const exercisesArray = formData.exercises
      .split(',')
      .map((ex) => ex.trim())
      .filter((ex) => ex.length > 0);

    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const bmi = calculateBMI(weight, height);

    // Prepare API request data (without photos first)
    const updateData: UpdateTrainingProgressRequest = {
      date: formData.date,
      weight,
      height,
      strength: formData.strength[0],
      notes: formData.notes || '', // Ensure notes is always a string, never undefined
      exercises: exercisesArray
    };

    // Only add body measurements if they have values (not empty strings)
    // This prevents sending null/undefined values to the backend
    if (formData.bodyFatPercentage && formData.bodyFatPercentage.trim() !== '') {
      updateData.bodyFatPercentage = parseFloat(formData.bodyFatPercentage);
    }
    if (formData.chest && formData.chest.trim() !== '') {
      updateData.chest = parseFloat(formData.chest);
    }
    if (formData.waist && formData.waist.trim() !== '') {
      updateData.waist = parseFloat(formData.waist);
    }
    if (formData.hips && formData.hips.trim() !== '') {
      updateData.hips = parseFloat(formData.hips);
    }
    if (formData.arms && formData.arms.trim() !== '') {
      updateData.arms = parseFloat(formData.arms);
    }
    if (formData.thighs && formData.thighs.trim() !== '') {
      updateData.thighs = parseFloat(formData.thighs);
    }
    if (formData.muscleMassPercentage && formData.muscleMassPercentage.trim() !== '') {
      updateData.muscleMassPercentage = parseFloat(formData.muscleMassPercentage);
    }
    if (formData.bodyWaterPercentage && formData.bodyWaterPercentage.trim() !== '') {
      updateData.bodyWaterPercentage = parseFloat(formData.bodyWaterPercentage);
    }
    if (formData.metabolicAge && formData.metabolicAge.trim() !== '') {
      updateData.metabolicAge = parseInt(formData.metabolicAge, 10);
    }

    // DEBUG: Log updateData to see what's being sent
    console.log('EditProgressForm updateData:', updateData);
    console.log('EditProgressForm formData body measurements:', {
      bodyFatPercentage: formData.bodyFatPercentage,
      chest: formData.chest,
      waist: formData.waist,
      hips: formData.hips,
      arms: formData.arms,
      thighs: formData.thighs,
      muscleMassPercentage: formData.muscleMassPercentage,
      bodyWaterPercentage: formData.bodyWaterPercentage,
      metabolicAge: formData.metabolicAge
    });

    // Call API to update progress
    const response = await updateProgress(progressId, updateData);

    if (response.success) {
      // Upload new photos if any
      if (photoManager.newPhotos.length > 0) {
        const files = await convertBlobUrlsToFiles(photoManager.newPhotos);
        await uploadPhotos(progressId, files);
      }

      // Call parent onSubmit with the data for UI updates
      const allPhotos = photoManager.getAllPhotosAsUrls();
      onSubmit({
        date: formData.date,
        weight: weight,
        height: height,
        bmi: bmi,
        strength: formData.strength[0],
        notes: formData.notes,
        photos: allPhotos,
        exercises: exercisesArray
      });

      // Cleanup blob URLs after successful submission
      photoManager.cleanupNewPhotos();

      toast.success(t('toast.progress_updated_success'));
    } else {
      toast.error(response.message || t('toast.progress_update_failed'));
    }
  };

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
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
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
            onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
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
            onChange={(e) => setFormData((prev) => ({ ...prev, height: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, chest: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, waist: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, hips: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, arms: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, thighs: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, bodyFatPercentage: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, muscleMassPercentage: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, bodyWaterPercentage: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, metabolicAge: e.target.value }))}
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
            onValueChange={(value) => setFormData((prev) => ({ ...prev, strength: value }))}
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
          onChange={(e) => setFormData((prev) => ({ ...prev, exercises: e.target.value }))}
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
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          className="min-h-24 resize-y"
          rows={4}
          cols={15}
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
          disabled={updateLoading || photoLoading || !canSubmitForm(formData)}
          className="flex-1 bg-[#F05A29] hover:bg-[#E04A1F] text-white"
        >
          {updateLoading ? 'Updating...' : photoLoading ? 'Uploading photos...' : 'Update Progress'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={updateLoading || photoLoading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
