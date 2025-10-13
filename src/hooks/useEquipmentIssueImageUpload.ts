import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { equipmentIssueApi } from '../services/api/equipmentIssueApi';
import type { EquipmentIssueImage } from '../types/api/EquipmentIssue';

export const useEquipmentIssueImageUpload = () => {
  const { t } = useTranslation();
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageUpload = async (
    files: FileList | null,
    currentImages: EquipmentIssueImage[] = [],
    onSuccess: (newImages: EquipmentIssueImage[]) => void
  ) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);

    const uploadPromises = Array.from(files).map((file) => equipmentIssueApi.uploadImage(file));
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
    currentImages: EquipmentIssueImage[],
    onUpdate: (newImages: EquipmentIssueImage[]) => void
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
