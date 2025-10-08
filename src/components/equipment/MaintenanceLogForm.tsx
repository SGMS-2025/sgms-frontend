import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAddMaintenanceLog, useUpdateMaintenanceLog, useUploadMaintenanceLogImages } from '../../hooks/useEquipment';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { MaintenanceLog, EquipmentImage } from '../../types/api/Equipment';

interface MaintenanceLogFormProps {
  equipmentId: string;
  maintenanceLog?: MaintenanceLog | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const MaintenanceLogForm: React.FC<MaintenanceLogFormProps> = ({
  equipmentId,
  maintenanceLog,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: maintenanceLog?.title || '',
    description: maintenanceLog?.description || '',
    images: maintenanceLog?.images || []
  });

  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<EquipmentImage[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDragOver, setIsDragOver] = useState(false);

  const { addMaintenanceLog, loading: addLoading } = useAddMaintenanceLog();
  const { updateMaintenanceLog, loading: updateLoading } = useUpdateMaintenanceLog();
  const { uploadImages } = useUploadMaintenanceLogImages();

  const isEditing = !!maintenanceLog;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = t('equipment.maintenance_log_title_required');
    } else if (formData.title.length > 100) {
      newErrors.title = t('equipment.maintenance_log_title_too_long');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('equipment.maintenance_log_description_required');
    } else if (formData.description.length > 1000) {
      newErrors.description = t('equipment.maintenance_log_description_too_long');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const processFiles = async (files: File[]) => {
    if (files.length > 0) {
      // Check total images limit
      const totalImages = formData.images.length + uploadedImages.length + files.length;
      if (totalImages > 5) {
        setErrors({ images: 'Cannot upload more than 5 images total' });
        return;
      }

      setUploadingImages(true);
      setErrors({ images: '' });

      // Upload images immediately
      const uploadResults = await uploadImages(files);
      const newImages = uploadResults.map((result) => ({
        publicId: result.publicId,
        url: result.url
      }));

      setUploadedImages((prev) => [...prev, ...newImages]);
      setUploadingImages(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await processFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));

    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Combine existing images with newly uploaded images
    const allImages = [...formData.images, ...uploadedImages];

    if (isEditing && maintenanceLog) {
      console.log('Updating maintenance log:', {
        equipmentId,
        logId: maintenanceLog._id,
        data: {
          title: formData.title,
          description: formData.description,
          images: allImages
        }
      });

      await updateMaintenanceLog(equipmentId, maintenanceLog._id, {
        title: formData.title,
        description: formData.description,
        images: allImages
      });
      toast.success(t('equipment.maintenance_log_updated_successfully'));
    } else {
      console.log('Adding new maintenance log:', {
        equipmentId,
        data: {
          title: formData.title,
          description: formData.description,
          images: allImages
        }
      });

      await addMaintenanceLog(equipmentId, {
        title: formData.title,
        description: formData.description,
        images: allImages
      });
      toast.success(t('equipment.maintenance_log_created_successfully'));
    }

    onSuccess();
  };

  const totalImages = formData.images.length + uploadedImages.length;
  const canAddMoreImages = totalImages < 5;
  const isSubmitting = addLoading || updateLoading;
  const isUploading = uploadingImages;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-orange-500 p-4 sm:p-6 relative">
          <button
            onClick={onClose}
            disabled={isSubmitting || isUploading}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="pr-8">
            <h2 className="text-white text-lg sm:text-xl font-bold">
              {isEditing ? t('equipment.edit_maintenance_log') : t('equipment.add_maintenance_log')}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('equipment.maintenance_log_title')} *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('equipment.maintenance_log_title_placeholder')}
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/100 {t('common.characters')}
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('equipment.description')} *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('equipment.maintenance_log_description_placeholder')}
              maxLength={1000}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/1000 {t('common.characters')}
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.images')} ({totalImages}/5)
            </label>

            {/* Existing Images */}
            {formData.images.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">{t('equipment.existing_images')}</h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {formData.images.map((image, index) => (
                    <div key={`existing-${image.publicId}`} className="relative group">
                      <img
                        src={image.url}
                        alt={`${t('equipment.maintenance_log')} ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            {canAddMoreImages && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors disabled:opacity-50 ${
                    isDragOver
                      ? 'border-orange-500 bg-orange-100'
                      : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                  }`}
                >
                  {uploadingImages ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner className="w-8 h-8 text-orange-500" />
                    </div>
                  ) : (
                    <div>
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-orange-500' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDragOver ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                        {isDragOver ? 'Drop images here' : t('equipment.click_to_upload_images')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('equipment.drag_drop_or_click')} • {t('equipment.max_5_images')}
                      </p>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">{t('equipment.new_images')}</h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {uploadedImages.map((image, index) => (
                    <div key={`uploaded-${image.publicId}-${index}`} className="relative group">
                      <img
                        src={image.url}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index)}
                        disabled={isSubmitting || isUploading}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4 sm:pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-10"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-10"
            >
              {(() => {
                if (isSubmitting) {
                  return (
                    <>
                      <LoadingSpinner className="w-4 h-4" />
                      <span className="ml-2">{isEditing ? t('common.updating') : t('common.creating')}</span>
                    </>
                  );
                }
                return (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {isEditing ? t('common.update') : t('common.create')}
                  </>
                );
              })()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
