import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { equipmentApi } from '../services/api/equipmentApi';
import type { EquipmentImage } from '../types/api/Equipment';

export const useImageUpload = () => {
  const { t } = useTranslation();
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageUpload = async (
    files: FileList | null,
    currentImages: EquipmentImage[] = [],
    onSuccess: (newImages: EquipmentImage[]) => void
  ) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);

    const uploadPromises = Array.from(files).map((file) => equipmentApi.uploadImage(file));
    const uploadResults = await Promise.all(uploadPromises);

    const successfulUploads = uploadResults.filter((result) => result.success && result.data);
    const failedUploads = uploadResults.filter((result) => !result.success);

    if (successfulUploads.length > 0) {
      const uploadedImages = successfulUploads.map((result) => result.data!);
      const newImages = [...currentImages, ...uploadedImages];
      onSuccess(newImages);
      toast.success(t('toast.image_uploaded_successfully'));
    }

    if (failedUploads.length > 0) {
      toast.error(t('error.image_upload_failed'));
    }

    setUploadingImages(false);
  };

  const removeImage = (
    index: number,
    currentImages: EquipmentImage[],
    onUpdate: (newImages: EquipmentImage[]) => void
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
