import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Edit, Loader2, User, Calendar, Globe, Image as ImageIcon, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { useTestimonialDetails, useUpdateTestimonial } from '@/hooks/useTestimonial';
import { useAuthState } from '@/hooks/useAuth';
import type {
  TestimonialDisplay,
  TestimonialFormData,
  TestimonialStatus,
  TestimonialImage,
  Testimonial
} from '@/types/api/Testimonial';
import { testimonialApi } from '@/services/api/testimonialApi';
import { validateTestimonialFormData, validateImageFile } from '@/utils/testimonialsValidation';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { toast } from 'sonner';

interface TestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  testimonial: TestimonialDisplay | null;
  initialEditMode?: boolean;
  onTestimonialUpdate?: () => void;
}

export default function TestimonialModal({
  isOpen,
  onClose,
  testimonial,
  initialEditMode = false,
  onTestimonialUpdate
}: TestimonialModalProps) {
  const { t } = useTranslation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<TestimonialFormData>({
    title: '',
    content: '',
    images: [],
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  // Use the custom hook for fetching testimonial details
  const {
    testimonial: testimonialDetails,
    loading,
    error,
    refetch
  } = useTestimonialDetails(isOpen && testimonial ? testimonial.id : null);

  // Use the custom hook for updating testimonial
  const { updateTestimonial, loading: updateLoading } = useUpdateTestimonial();
  const { user } = useAuthState();

  useEffect(() => {
    if (isOpen && testimonial) {
      setIsEditMode(initialEditMode);
    }
  }, [isOpen, testimonial, initialEditMode]);

  useEffect(() => {
    if (testimonialDetails && testimonial) {
      setFormData({
        title: testimonialDetails.title || testimonial.title || '',
        content: testimonialDetails.content || testimonial.content || '',
        images: testimonialDetails.images || [],
        status: testimonialDetails.status || testimonial.status || 'ACTIVE'
      });
    }
  }, [testimonialDetails, testimonial]);

  const handleInputChange = (field: keyof TestimonialFormData, value: string | TestimonialStatus) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: ''
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error!);
      return;
    }

    setUploadingImage(true);
    const response = await testimonialApi.uploadImage(file);
    if (response.success) {
      const newImage: TestimonialImage = {
        publicId: response.data.publicId,
        url: response.data.url
      };
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, newImage]
      }));
      toast.success(t('testimonial_modal.image_uploaded'));
    } else {
      toast.error(t('testimonial_modal.upload_failed'));
    }
    setUploadingImage(false);
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleSave = async () => {
    if (!testimonial) return;

    const validation = validateTestimonialFormData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const updateData = {
      title: formData.title,
      content: formData.content,
      images: formData.images,
      status: formData.status
    };

    const result = await updateTestimonial(testimonial.id, updateData);
    if (result) {
      await refetch();
      setIsEditMode(false);
      setErrors({});
      onTestimonialUpdate?.();
    }
  };

  const handleCancel = () => {
    if (testimonialDetails && testimonial) {
      setFormData({
        title: testimonialDetails.title || testimonial.title || '',
        content: testimonialDetails.content || testimonial.content || '',
        images: testimonialDetails.images || [],
        status: testimonialDetails.status || testimonial.status || 'ACTIVE'
      });
    }
    setIsEditMode(false);
    setErrors({});
  };

  if (!isOpen || !testimonial) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditMode ? t('testimonial_modal.edit_testimonial') : t('testimonial_modal.testimonial_details')}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEditMode
                    ? t('testimonial_modal.edit_testimonial_info')
                    : t('testimonial_modal.view_testimonial_details')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditMode && (
                <Button onClick={handleEditClick} variant="outline" size="sm" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  {t('common.edit')}
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm" className="p-2">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
                <p className="text-gray-600">{t('testimonial_modal.loading_details')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={refetch} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {t('testimonial_modal.try_again')}
                </Button>
              </div>
            </div>
          ) : isEditMode ? (
            <EditForm
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
              onSave={handleSave}
              onCancel={handleCancel}
              loading={updateLoading}
              uploadingImage={uploadingImage}
              user={user}
              t={t}
            />
          ) : (
            <ViewMode testimonial={testimonial} testimonialDetails={testimonialDetails} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

function ViewMode({
  testimonial,
  testimonialDetails,
  t
}: {
  testimonial: TestimonialDisplay;
  testimonialDetails: Testimonial | null;
  t: (key: string) => string;
}) {
  const currentTestimonial = testimonialDetails || testimonial;

  return (
    <div className="p-6 space-y-6">
      {/* Post Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{testimonial.createdBy}</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(testimonial.createdAt).toLocaleDateString('vi-VN')}
            <span className="mx-2">•</span>
            <Globe className="h-3 w-3 mr-1" />
            {currentTestimonial.status === 'ACTIVE' ? t('testimonial.active') : t('dashboard.inactive')}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{currentTestimonial.title}</h2>
          <div className="text-gray-700 leading-relaxed">
            <MarkdownRenderer content={currentTestimonial.content} />
          </div>
        </div>

        {/* Images */}
        {currentTestimonial.images && currentTestimonial.images.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {t('testimonial_modal.photos')} ({currentTestimonial.images.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentTestimonial.images.map((image: TestimonialImage, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt={`${t('dashboard.testimonials')} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">{t('dashboard.status')}:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentTestimonial.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {currentTestimonial.status === 'ACTIVE' ? t('testimonial.active') : t('dashboard.inactive')}
          </span>
        </div>
      </div>
    </div>
  );
}

function EditForm({
  formData,
  errors,
  onInputChange,
  onImageUpload,
  onRemoveImage,
  onSave,
  onCancel,
  loading,
  uploadingImage,
  user,
  t
}: {
  formData: TestimonialFormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof TestimonialFormData, value: string | TestimonialStatus) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  uploadingImage: boolean;
  user: { fullName?: string } | null;
  t: (key: string) => string;
}) {
  return (
    <div className="p-6 space-y-4">
      {/* User Info */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{user?.fullName || t('testimonial_modal.edit_testimonial')}</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Globe className="h-3 w-3 mr-1" />
            {formData.status === 'ACTIVE' ? t('testimonial.active') : t('dashboard.inactive')}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="space-y-4">
        {/* Title Input */}
        <div>
          <Input
            placeholder={t('testimonial_form.write_title')}
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            disabled={loading}
            className={`border-0 text-lg placeholder:text-gray-400 focus:ring-0 p-0 ${errors.title ? 'border-red-500' : ''}`}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Content Input - Markdown Editor */}
        <div>
          <MarkdownEditor
            value={formData.content}
            onChange={(value) => onInputChange('content', value)}
            placeholder={t('testimonial_form.write_content')}
            error={errors.content}
            height={200}
            className="w-full"
          />
        </div>

        {/* Image Previews */}
        {formData.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {formData.images.map((image: TestimonialImage, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={`${t('testimonial_form.preview')} ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveImage(index)}
                  disabled={loading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Options */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          {/* Photo/Video Upload */}
          <label className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-lg cursor-pointer transition-colors">
            {uploadingImage ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span className="text-sm font-medium">{t('testimonial_form.uploading_images')}</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{t('testimonial_form.photo_video')}</span>
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              disabled={loading || uploadingImage}
            />
          </label>

          {/* Status Selector */}
          <div className="flex items-center space-x-2">
            <Select
              value={formData.status}
              onValueChange={(value: TestimonialStatus) => onInputChange('status', value)}
              disabled={loading}
            >
              <SelectTrigger className="w-auto border-0 bg-transparent p-0 h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t('testimonial.active')}</SelectItem>
                <SelectItem value="INACTIVE">{t('dashboard.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="px-4">
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white px-6">
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
