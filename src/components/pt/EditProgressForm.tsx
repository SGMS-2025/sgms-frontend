import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Image as ImageIcon, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import type { UpdateTrainingProgressRequest } from '@/types/api/TrainingProgress';
import type { EditProgressFormProps } from '@/types/forms/Progress';

export const EditProgressForm: React.FC<EditProgressFormProps> = ({ progressId, initialData, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const { updateProgress, updateLoading, uploadPhotos, photoLoading } = useTrainingProgress();
  // Helper function to safely format date
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return new Date().toISOString().split('T')[0];

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return new Date().toISOString().split('T')[0];
    }

    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    date: formatDateForInput(initialData.date),
    weight: initialData.weight.toString(),
    height: initialData.height.toString(),
    strength: [initialData.strength],
    notes: initialData.notes,
    exercises: initialData.exercises.join(', ') || ''
  });
  // Separate existing photos (from database) and new photos (blob URLs)
  const [existingPhotos, setExistingPhotos] = useState<{ url: string; publicId: string }[]>(initialData.photos || []);
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Calculate BMI whenever weight or height changes
  const calculateBMI = (weight: number, height: number) => {
    if (!weight || !height) return 0;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const currentBMI = calculateBMI(parseFloat(formData.weight), parseFloat(formData.height));

  useEffect(() => {
    // Update form when initialData changes

    setFormData({
      date: formatDateForInput(initialData.date),
      weight: initialData.weight.toString(),
      height: initialData.height.toString(),
      strength: [initialData.strength],
      notes: initialData.notes,
      exercises: initialData.exercises.join(', ') || ''
    });

    const existingPhotosData = initialData.photos || [];
    setExistingPhotos(existingPhotosData);
    setNewPhotos([]); // Reset new photos when initialData changes
  }, [initialData]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      newPhotos.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, [newPhotos]);

  const openCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    setStream(mediaStream);
    setIsCameraOpen(true);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      // Check if adding one more photo would exceed the limit
      const totalPhotos = existingPhotos.length + newPhotos.length;
      if (totalPhotos >= 5) {
        toast.error(t('toast.progress_edit_max_photos'));
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setNewPhotos((prev) => [...prev, url]);
              closeCamera();
            } else {
              toast.error(t('toast.progress_capture_photo_failed'));
            }
          },
          'image/jpeg',
          0.8
        );
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const validFiles: File[] = [];
      const invalidFiles: File[] = [];

      // Separate valid and invalid files
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file);
        }
      });

      // Check if adding these files would exceed the limit
      const totalPhotos = existingPhotos.length + newPhotos.length;
      if (totalPhotos + validFiles.length > 5) {
        toast.error(t('toast.progress_edit_max_photos_limit', { count: 5 - totalPhotos }));
        return;
      }

      // Add valid files to newPhotos
      validFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        setNewPhotos((prev) => [...prev, url]);
      });

      // Show error messages only for invalid files
      if (invalidFiles.length > 0) {
        toast.error(t('toast.progress_invalid_files', { count: invalidFiles.length }));
      }
    }

    // Clear the input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    if (index < existingPhotos.length) {
      // Remove from existing photos
      setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Remove from new photos
      const newPhotoIndex = index - existingPhotos.length;
      setNewPhotos((prev) => {
        const updated = prev.filter((_, i) => i !== newPhotoIndex);
        // Cleanup blob URL
        URL.revokeObjectURL(prev[newPhotoIndex]);
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      toast.error(t('toast.progress_invalid_weight'));
      return;
    }

    if (!formData.height || parseFloat(formData.height) <= 0) {
      toast.error(t('toast.progress_invalid_height'));
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
      note: formData.notes,
      exercises: exercisesArray,
      bodyFatPercentage: undefined
    };

    // Call API to update progress
    const response = await updateProgress(progressId, updateData);

    if (response.success) {
      // Upload new photos if any
      if (newPhotos.length > 0) {
        // Convert blob URLs to files - if this fails, just skip photos
        const files: File[] = [];
        for (const [index, blobUrl] of newPhotos.entries()) {
          const fetchResponse = await fetch(blobUrl);
          const blob = await fetchResponse.blob();

          // Detect proper MIME type from blob
          let mimeType = blob.type;
          if (!mimeType || !mimeType.startsWith('image/')) {
            // Fallback to jpeg if MIME type is not detected or invalid
            mimeType = 'image/jpeg';
          }

          // Generate unique filename with proper extension
          const extension = mimeType.split('/')[1] || 'jpg';
          const filename = `photo_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}.${extension}`;

          const file = new File([blob], filename, { type: mimeType });
          files.push(file);
        }

        // Upload photos to the updated progress record
        const photoUploadResult = await uploadPhotos(progressId, files);

        if (!photoUploadResult.success) {
          toast.warning(t('toast.progress_updated_photo_upload_failed'));
        }
      }

      // Call parent onSubmit with the data for UI updates
      const allPhotos = [...existingPhotos.map((p) => p.url), ...newPhotos];
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
      newPhotos.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
      setNewPhotos([]);

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
      {formData.weight && formData.height && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F05A29] bg-opacity-10 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-[#F05A29]" />
              </div>
              <span className="text-sm font-medium text-gray-700">BMI Calculator</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#101D33]">{currentBMI.toFixed(1)}</p>
              <p className="text-xs text-gray-500">
                {currentBMI < 18.5
                  ? 'Underweight'
                  : currentBMI < 25
                    ? 'Normal'
                    : currentBMI < 30
                      ? 'Overweight'
                      : 'Obese'}
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note">Training Notes</Label>
        <Textarea
          id="note"
          placeholder="Describe the training session, improvements, challenges..."
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          className="min-h-20 resize-none"
        />
      </div>

      {/* Photo Section */}
      <div className="space-y-3">
        <Label>Training Photos (max 5)</Label>

        {/* Camera and Upload Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={openCamera}
            disabled={existingPhotos.length + newPhotos.length >= 5}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={existingPhotos.length + newPhotos.length >= 5}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>

        {/* Photo Preview */}
        {(existingPhotos.length > 0 || newPhotos.length > 0) && (
          <div className="grid grid-cols-3 gap-3">
            {/* Existing photos */}
            {existingPhotos.map((photo, index) => (
              <div key={`existing-${index}`} className="relative group">
                <img
                  src={photo.url}
                  alt={`Existing Training ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* New photos */}
            {newPhotos.map((photo, index) => (
              <div key={`new-${index}`} className="relative group">
                <img
                  src={photo}
                  alt={`New Training ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removePhoto(existingPhotos.length + index)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {existingPhotos.length === 0 && newPhotos.length === 0 && (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="py-8 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No photos added yet</p>
              <p className="text-xs text-gray-400">Capture or upload training photos</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
            <div className="mb-4">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
            </div>
            <div className="flex gap-3 justify-center">
              <Button type="button" onClick={capturePhoto} className="bg-[#F05A29] hover:bg-[#E04A1F]">
                Capture
              </Button>
              <Button type="button" variant="outline" onClick={closeCamera}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={updateLoading || photoLoading || !formData.weight || !formData.height}
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
