import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Globe, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTestimonial } from '@/hooks/useTestimonial';
import { useAuthState } from '@/hooks/useAuth';
import { validateTestimonialFormData, validateImageFile } from '@/utils/testimonialsValidation';
import { toast } from 'sonner';

interface AddTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTestimonialModal: React.FC<AddTestimonialModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createTestimonial } = useCreateTestimonial();
  const { user } = useAuthState();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Validate each file
      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      files.forEach((file) => {
        const validation = validateImageFile(file);
        if (validation.isValid) {
          validFiles.push(file);
          newPreviews.push(URL.createObjectURL(file));
        } else {
          toast.error(validation.error);
        }
      });

      if (validFiles.length > 0) {
        setImages((prev) => [...prev, ...validFiles]);
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const handleSubmit = () => {
    // Validate form data
    const validation = validateTestimonialFormData({
      title: formData.title,
      content: formData.content,
      status: formData.status,
      images: images.map((file) => ({
        publicId: '',
        url: URL.createObjectURL(file)
      }))
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error(t('common.please_fix_errors'));
      return;
    }

    setIsLoading(true);
    createTestimonial({
      title: formData.title,
      content: formData.content,
      status: formData.status,
      images: images.map((file) => ({
        publicId: '',
        url: URL.createObjectURL(file)
      }))
    })
      .then(() => {
        // Reset form
        setFormData({ title: '', content: '', status: 'ACTIVE' });
        setImages([]);
        setImagePreviews([]);

        onSuccess?.();
        onClose();
      })
      .catch((error) => {
        console.error('Error creating testimonial:', error);
        toast.error(t('testimonial_form.create_failed'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('testimonial_form.create_testimonial')}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user?.fullName || t('testimonial_form.your_name')}</h3>
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
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`border-0 text-lg placeholder:text-gray-400 focus:ring-0 p-0 ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Content Input */}
            <div>
              <Textarea
                placeholder={t('testimonial_form.write_content')}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className={`border-0 text-base placeholder:text-gray-400 focus:ring-0 p-0 min-h-[120px] resize-none ${errors.content ? 'border-red-500' : ''}`}
              />
              {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`${t('testimonial_form.preview')} ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
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
                <ImageIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{t('testimonial_form.photo_video')}</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {/* Status Selector */}
              <div className="flex items-center space-x-2">
                <Select
                  value={formData.status}
                  onValueChange={(value: 'ACTIVE' | 'INACTIVE') => handleInputChange('status', value)}
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

            {/* Post Button */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6"
            >
              {isLoading ? t('testimonial_form.posting') : t('testimonial_form.post')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
