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
    exercises: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form using validation utility
    const validation = validateProgressForm(formData, photoManager.newPhotos.length);

    if (!validation.isValid) {
      console.log('🔍 Validation failed:', validation.errors);
      console.log('📋 Form data:', formData);
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
    const progressData: CreateTrainingProgressRequest = {
      customerId,
      serviceContractId,
      trainerId,
      date: formData.date,
      weight,
      height,
      strength: formData.strength[0],
      notes: formData.notes || '', // Ensure notes is always a string, never undefined
      exercises: exercisesArray,
      photos: [], // Empty photos array - will upload separately
      bodyFatPercentage: undefined
    };

    // Call API to create progress
    const response = await createProgress(progressData);

    if (response.success) {
      const createdProgressId = response.data._id;

      // Upload photos if any (using EditForm logic)
      if (photoManager.newPhotos.length > 0) {
        // Convert blob URLs to files
        const files = await convertBlobUrlsToFiles(photoManager.newPhotos);

        // Upload photos to the created progress record
        const photoUploadResult = await uploadPhotos(createdProgressId, files);

        if (!photoUploadResult.success) {
          toast.warning(t('toast.progress_saved_photo_upload_failed'));
        }
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

      toast.success(t('toast.progress_saved_success'));

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        height: '',
        strength: [75],
        notes: '',
        exercises: ''
      });
    } else {
      toast.error(response.message || t('toast.progress_save_failed'));
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
          className="min-h-20 resize-none"
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
          disabled={createLoading || photoLoading || !canSubmitForm(formData)}
          className="flex-1 bg-[#F05A29] hover:bg-[#E04A1F] text-white"
        >
          {createLoading ? 'Saving...' : photoLoading ? 'Adding...' : 'Save Progress'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={createLoading || photoLoading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
