import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { testimonialApi } from '../services/api/testimonialApi';
import { validateImageFile } from '../utils/testimonialsValidation';
import type { TestimonialImage } from '../types/api/Testimonial';

export const useTestimonialImageUpload = () => {
  const { t } = useTranslation();
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageUpload = async (
    files: FileList | null,
    currentImages: TestimonialImage[] = [],
    onSuccess: (newImages: TestimonialImage[]) => void
  ) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);

    const uploadPromises = Array.from(files).map(async (file) => {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.error);
        return null;
      }

      const response = await testimonialApi.uploadImage(file);
      if (response.success) {
        return {
          publicId: response.data.publicId,
          url: response.data.url
        };
      } else {
        toast.error('Upload failed');
        return null;
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    const successfulUploads = uploadResults.filter((result): result is TestimonialImage => result !== null);

    if (successfulUploads.length > 0) {
      const newImages = [...currentImages, ...successfulUploads];
      onSuccess(newImages);
      toast.success(t('testimonial_modal.image_uploaded'));
    }

    setUploadingImages(false);
  };

  const removeImage = (
    index: number,
    currentImages: TestimonialImage[],
    onUpdate: (newImages: TestimonialImage[]) => void
  ) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    onUpdate(newImages);
  };

  return {
    uploadingImages,
    handleImageUpload,
    removeImage
  };
};
