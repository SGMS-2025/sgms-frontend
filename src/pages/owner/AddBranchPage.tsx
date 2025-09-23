import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ManagerSelector from '@/components/ui/ManagerSelector';
import { Camera, Plus } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import { staffApi } from '@/services/api/staffApi';
import type { BranchFormData, CreateAndUpdateBranchRequest } from '@/types/api/Branch';
import type { Staff } from '@/types/api/Staff';
import { toast } from 'sonner';

const AddBranchPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createBranch } = useBranch();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<Staff[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BranchFormData>({
    defaultValues: {
      branchName: '',
      address: '',
      city: '',
      openingHours: {
        open: '06:00',
        close: '21:00'
      },
      facilities: ['Gym', 'Cardio', 'Weight Training'],
      managerId: [] // Initialize as empty array for multiple managers
    }
  });

  const selectedFacilities = watch('facilities') || [];
  const selectedManagers = watch('managerId') || [];

  const handleFacilityChange = (facility: string, checked: boolean) => {
    if (checked) {
      setValue('facilities', [...selectedFacilities, facility]);
    } else {
      setValue(
        'facilities',
        selectedFacilities.filter((f) => f !== facility)
      );
    }
  };

  // Fetch managers on component mount
  useEffect(() => {
    const fetchManagers = async () => {
      setLoadingManagers(true);
      const response = await staffApi.getManagers().catch(() => ({
        success: false,
        message: 'Network error - Không thể tải danh sách quản lý',
        data: []
      }));

      if (response.success && response.data) {
        setManagers(response.data);
      } else {
        toast.error(t('toast.cannot_load_managers'));
      }
      setLoadingManagers(false);
    };

    fetchManagers();
  }, [t]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    // This would typically open camera
    toast.info(t('toast.camera_feature_development'));
  };

  const onSubmit = async (data: BranchFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const createData: CreateAndUpdateBranchRequest = {
      branchName: data.branchName,
      location: `${data.address}, ${data.city}`,
      description: data.description || 'Phòng tập Gym',
      hotline: data.hotline || '',
      images: imagePreview ? [imagePreview] : [],
      coverImage: imagePreview || undefined,
      facilities: data.facilities || ['Gym', 'Cardio', 'Weight Training'],
      openingHours: `${data.openingHours.open} - ${data.openingHours.close}`,
      managerId: data.managerId && data.managerId.length > 0 ? data.managerId : null
    };

    const newBranch = await createBranch(createData);

    if (newBranch) {
      toast.success(t('toast.add_branch_success'));
      navigate('/manage/owner');
    } else {
      // Show error toast if creation failed
      toast.error(t('toast.add_branch_failed'));
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f4]">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-orange-600">+ {t('add_branch.page_title')}</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
          {/* Section 1: Branch Information */}
          <div className="bg-white rounded-lg p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
              {/* Left side - Title */}
              <div className="w-full lg:w-64 flex-shrink-0">
                <div className="bg-orange-500 text-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg text-center shadow-sm">
                  <h3 className="text-sm sm:text-lg font-semibold">{t('add_branch.branch_info_section')}</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">{t('add_branch.required_note')}</p>
              </div>

              {/* Right side - Form fields */}
              <div className="flex-1 lg:ml-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="branchName" className="text-sm font-medium text-gray-700">
                      {t('add_branch.branch_name')}{' '}
                      <span className="text-orange-500">{t('add_branch.required_field')}</span>
                    </Label>
                    <Input
                      id="branchName"
                      {...register('branchName', { required: t('add_branch.branch_name_required') })}
                      placeholder={t('add_branch.branch_name_placeholder')}
                      className={`rounded-lg border-gray-300 ${errors.branchName ? 'border-red-500' : ''}`}
                    />
                    {errors.branchName && <p className="text-sm text-red-500">{errors.branchName.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        {t('add_branch.address')}{' '}
                        <span className="text-orange-500">{t('add_branch.required_field')}</span>
                      </Label>
                      <Input
                        id="address"
                        {...register('address', { required: t('add_branch.address_required') })}
                        placeholder={t('add_branch.address_placeholder')}
                        className={`rounded-lg border-gray-300 ${errors.address ? 'border-red-500' : ''}`}
                      />
                      {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                        {t('add_branch.city')} <span className="text-orange-500">{t('add_branch.required_field')}</span>
                      </Label>
                      <Input
                        id="city"
                        {...register('city', { required: t('add_branch.city_required') })}
                        placeholder={t('add_branch.city_placeholder')}
                        className={`rounded-lg border-gray-300 ${errors.city ? 'border-red-500' : ''}`}
                      />
                      {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hotline" className="text-sm font-medium text-gray-700">
                        {t('add_branch.hotline')}
                      </Label>
                      <Input
                        id="hotline"
                        {...register('hotline')}
                        placeholder={t('add_branch.hotline_placeholder')}
                        className="rounded-lg border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        {t('add_branch.email')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder={t('add_branch.email_placeholder')}
                        className="rounded-lg border-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{t('add_branch.manager')}</Label>
                      {loadingManagers ? (
                        <p className="text-sm text-gray-500">{t('add_branch.manager_loading')}</p>
                      ) : (
                        <ManagerSelector
                          managers={managers.map((manager) => ({
                            _id: manager._id,
                            fullName: manager.userId.fullName,
                            email: manager.userId.email,
                            status: manager.userId.status
                          }))}
                          selectedManagerIds={selectedManagers}
                          onManagerChange={(managerIds) => setValue('managerId', managerIds)}
                          placeholder={t('add_branch.manager_placeholder')}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{t('add_branch.opening_hours')}</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          {...register('openingHours.open')}
                          className="flex-1 rounded-lg border-gray-300"
                        />
                        <span className="text-gray-500">{t('add_branch.to')}</span>
                        <Input
                          type="time"
                          {...register('openingHours.close')}
                          className="flex-1 rounded-lg border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Section 2: Profile Picture */}
          <div className="bg-white rounded-lg p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
              {/* Left side - Title */}
              <div className="w-full lg:w-48 flex-shrink-0">
                <div className="bg-orange-500 text-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg text-center shadow-sm">
                  <h3 className="text-sm sm:text-lg font-semibold">{t('add_branch.profile_image_section')}</h3>
                </div>
              </div>

              {/* Right side - Image upload */}
              <div className="flex-1 lg:ml-12">
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8">
                  {/* Image placeholder */}
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full flex items-center justify-center">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Branch preview"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 rounded-full flex items-center justify-center relative">
                          <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-orange-600 rounded-full flex items-center justify-center">
                            <Plus className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      onClick={handleTakePhoto}
                      className="flex-1 sm:flex-none bg-gray-800 hover:bg-gray-900 text-white rounded-lg py-2 px-4 text-sm"
                    >
                      {t('add_branch.take_photo')}
                    </Button>
                    <div className="flex-1 sm:flex-none">
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-lg py-2 px-4 text-sm"
                      >
                        {t('add_branch.upload_from_device')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Gym Information */}
          <div className="bg-white rounded-lg p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-0">
              {/* Left side - Title */}
              <div className="w-full lg:w-64 flex-shrink-0">
                <div className="bg-orange-500 text-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg text-center shadow-sm">
                  <h3 className="text-sm sm:text-lg font-semibold">{t('add_branch.gym_info_section')}</h3>
                </div>
              </div>

              {/* Right side - Form fields */}
              <div className="flex-1 lg:ml-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      {t('add_branch.description')}
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder={t('add_branch.description_placeholder')}
                      className="rounded-lg border-gray-300 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facilities" className="text-sm font-medium text-gray-700">
                      {t('add_branch.gym_facilities')}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        'Gym',
                        'Cardio',
                        'Weight Training',
                        'Yoga',
                        'Swimming Pool',
                        'Sauna',
                        'Group Classes',
                        'Personal Training',
                        'Locker Room'
                      ].map((facility) => (
                        <label key={facility} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedFacilities.includes(facility)}
                            onChange={(e) => handleFacilityChange(facility, e.target.checked)}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-700">{facility}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-bold rounded-lg w-full sm:w-auto"
            >
              {isSubmitting ? t('add_branch.creating_branch') : t('add_branch.complete_registration')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBranchPage;
