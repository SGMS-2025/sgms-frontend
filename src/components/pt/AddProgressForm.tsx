import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import { usePhotoManager } from '@/hooks/usePhotoManager';
import { calculateBMI, convertBlobUrlsToFiles } from '@/utils/progressUtils';
import { validateProgressForm, canSubmitForm, formatValidationErrors } from '@/utils/progressValidation';
import { BMIDisplay } from './shared/BMIDisplay';
import { CameraModal } from './shared/CameraModal';
import { PhotoUploadSection } from './shared/PhotoUploadSection';
import type { CreateTrainingProgressRequest } from '@/types/api/TrainingProgress';
import type { AddProgressFormProps } from '@/types/forms/Progress';

export const AddProgressForm: React.FC<AddProgressFormProps> = ({
  customerId,
  serviceContractId,
  trainerId,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation();
  const { createProgress, createLoading, uploadPhotos, photoLoading } = useTrainingProgress();
  const photoManager = usePhotoManager({ maxPhotos: 5 });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    strength: [75],
    notes: '',
    exercises: '',
    // Body Measurements
    bodyFatPercentage: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    muscleMassPercentage: '',
    bodyWaterPercentage: '',
    metabolicAge: ''
  });

  const [showBodyMeasurements, setShowBodyMeasurements] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validate form
      const validation = validateProgressForm(formData, photoManager.newPhotos.length);
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

      // ✅ STEP 1: Create progress WITHOUT photos
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

      // Only add body measurements if they have values (not empty strings)
      // This prevents sending null/undefined values to the backend
      if (formData.bodyFatPercentage && formData.bodyFatPercentage.trim() !== '') {
        progressData.bodyFatPercentage = parseFloat(formData.bodyFatPercentage);
      }
      if (formData.chest && formData.chest.trim() !== '') {
        progressData.chest = parseFloat(formData.chest);
      }
      if (formData.waist && formData.waist.trim() !== '') {
        progressData.waist = parseFloat(formData.waist);
      }
      if (formData.hips && formData.hips.trim() !== '') {
        progressData.hips = parseFloat(formData.hips);
      }
      if (formData.arms && formData.arms.trim() !== '') {
        progressData.arms = parseFloat(formData.arms);
      }
      if (formData.thighs && formData.thighs.trim() !== '') {
        progressData.thighs = parseFloat(formData.thighs);
      }
      if (formData.muscleMassPercentage && formData.muscleMassPercentage.trim() !== '') {
        progressData.muscleMassPercentage = parseFloat(formData.muscleMassPercentage);
      }
      if (formData.bodyWaterPercentage && formData.bodyWaterPercentage.trim() !== '') {
        progressData.bodyWaterPercentage = parseFloat(formData.bodyWaterPercentage);
      }
      if (formData.metabolicAge && formData.metabolicAge.trim() !== '') {
        progressData.metabolicAge = parseInt(formData.metabolicAge, 10);
      }

      const createResponse = await createProgress(progressData);

      if (!createResponse.success) {
        toast.error(createResponse.message || t('toast.progress_save_failed'));
        return;
      }

      const createdProgressId = createResponse.data._id;

      // ✅ STEP 2: Upload photos if any (with proper error handling)
      let photoUploadSuccess = true;
      if (photoManager.newPhotos.length > 0) {
        try {
          const files = await convertBlobUrlsToFiles(photoManager.newPhotos);
          const uploadResponse = await uploadPhotos(createdProgressId, files);

          if (!uploadResponse.success) {
            photoUploadSuccess = false;
            toast.warning(
              t('toast.progress_saved_but_photos_failed', {
                defaultValue: 'Progress saved, but some photos failed to upload'
              })
            );
            console.error('Photo upload error:', uploadResponse.message);
          }
        } catch (photoError) {
          photoUploadSuccess = false;
          console.error('Photo upload exception:', photoError);
          toast.warning(
            t('toast.progress_saved_but_photos_error', {
              defaultValue: 'Progress saved, but photos could not be uploaded'
            })
          );
        }
      }

      // ✅ STEP 3: Call parent onSubmit with data
      const allPhotos = photoUploadSuccess ? photoManager.getAllPhotosAsUrls() : [];
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

      // ✅ STEP 4: Cleanup ONLY after everything is done
      photoManager.cleanupNewPhotos();

      // ✅ STEP 5: Show appropriate success message
      if (photoUploadSuccess) {
        toast.success(t('toast.progress_saved_success'));
      } else {
        toast.success(
          t('toast.progress_saved_partial', {
            defaultValue: 'Progress saved successfully'
          })
        );
      }

      // ✅ STEP 6: Reset form
      setFormData({
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
      });
      setShowBodyMeasurements(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(
        t('toast.unexpected_error', {
          defaultValue: 'An unexpected error occurred'
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Cleanup photos before cancel
    photoManager.cleanupNewPhotos();
    onCancel();
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
          disabled={isSubmitting || !canSubmitForm(formData)}
          className="flex-1 bg-[#F05A29] hover:bg-[#E04A1F] text-white"
        >
          {isSubmitting
            ? createLoading
              ? 'Saving Progress...'
              : photoLoading
                ? 'Uploading Photos...'
                : 'Processing...'
            : 'Save Progress'}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};
