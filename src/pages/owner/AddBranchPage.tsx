import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ManagerSelector from '@/components/ui/ManagerSelector';
import { Camera, Upload } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import { staffApi } from '@/services/api/staffApi';
import { businessVerificationApi } from '@/services/api/businessVerificationApi';
import type { BranchFormData, CreateAndUpdateBranchRequest } from '@/types/api/Branch';
import type { Staff } from '@/types/api/Staff';
import { toast } from 'sonner';
import { cn } from '@/utils/utils';

const PANEL_CLASS =
  'rounded-[32px] border border-orange-100/70 bg-white/95 px-6 py-8 shadow-[0_25px_60px_rgba(240,90,41,0.05)] backdrop-blur-sm sm:px-10 sm:py-10';
const INPUT_CLASS =
  '!h-12 !rounded-2xl border border-orange-100 bg-white px-4 text-[15px] text-slate-900 shadow-inner shadow-orange-50/60 transition-all focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-100';
const INPUT_ERROR_CLASS = '!border-red-400 !bg-red-50/80 focus-visible:border-red-500 focus-visible:ring-red-100';
const TEXTAREA_CLASS =
  '!rounded-2xl border border-orange-100 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-inner shadow-orange-50/60 transition-all focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-100';
const EYEBROW_CLASS = 'text-xs font-semibold uppercase tracking-[0.3em] text-orange-400';
const CTA_BUTTON_CLASS =
  'w-full !h-14 !rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-lg font-semibold text-white shadow-[0_25px_60px_rgba(240,90,41,0.35)] transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-60';
const FACILITY_OPTIONS = [
  'Gym',
  'Cardio',
  'Weight Training',
  'Yoga',
  'Swimming Pool',
  'Sauna',
  'Group Classes',
  'Personal Training',
  'Locker Room'
] as const;

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
      managerId: []
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

  useEffect(() => {
    const fetchBusinessVerification = async () => {
      const response = await businessVerificationApi.getMyVerification();

      if (response.success && response.data) {
        const verification = response.data;

        if (verification.businessName) {
          setValue('branchName', verification.businessName);
        }

        if (verification.businessAddress) {
          const addressParts = verification.businessAddress.split(',').map((part) => part.trim());
          if (addressParts.length > 1) {
            const city = addressParts[addressParts.length - 1];
            const address = addressParts.slice(0, -1).join(', ');
            setValue('address', address);
            setValue('city', city);
          } else {
            setValue('address', verification.businessAddress);
          }
        }

        if (verification.businessPhone) {
          setValue('hotline', verification.businessPhone);
        }

        if (verification.businessEmail) {
          setValue('email', verification.businessEmail);
        }
      }
    };

    fetchBusinessVerification();
  }, [setValue]);

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
      toast.error(t('toast.add_branch_failed'));
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className={PANEL_CLASS}>
            <div className="space-y-10">
              <div className="space-y-1 text-center sm:text-left">
                <p className={EYEBROW_CLASS}>{t('add_branch.branch_info_section')}</p>
                <h1 className="text-4xl font-semibold text-slate-900">{t('add_branch.page_title')}</h1>
                <p className="text-sm text-slate-500">{t('add_branch.hero_subtitle')}</p>
              </div>

              <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="branchName" className="text-sm font-semibold text-slate-700">
                      {t('add_branch.branch_name')} <span className="text-orange-500">*</span>
                    </Label>
                    <Input
                      id="branchName"
                      {...register('branchName', { required: t('add_branch.branch_name_required') })}
                      placeholder={t('add_branch.branch_name_placeholder')}
                      className={cn(INPUT_CLASS, errors.branchName && INPUT_ERROR_CLASS)}
                    />
                    {errors.branchName && (
                      <p className="text-xs font-medium text-red-500">{errors.branchName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-semibold text-slate-700">
                      {t('add_branch.address')} <span className="text-orange-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      {...register('address', { required: t('add_branch.address_required') })}
                      placeholder={t('add_branch.address_placeholder')}
                      className={cn(INPUT_CLASS, errors.address && INPUT_ERROR_CLASS)}
                    />
                    {errors.address && <p className="text-xs font-medium text-red-500">{errors.address.message}</p>}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="city" className="text-sm font-semibold text-slate-700">
                        {t('add_branch.city')} <span className="text-orange-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        {...register('city', { required: t('add_branch.city_required') })}
                        placeholder={t('add_branch.city_placeholder')}
                        className={cn(INPUT_CLASS, errors.city && INPUT_ERROR_CLASS)}
                      />
                      {errors.city && <p className="text-xs font-medium text-red-500">{errors.city.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="hotline" className="text-sm font-semibold text-slate-700">
                        {t('add_branch.hotline')}
                      </Label>
                      <Input
                        id="hotline"
                        {...register('hotline')}
                        placeholder={t('add_branch.hotline_placeholder')}
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                        {t('add_branch.email')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder={t('add_branch.email_placeholder')}
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-slate-700">{t('add_branch.opening_hours')}</Label>
                      <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
                        <Input type="time" {...register('openingHours.open')} className={INPUT_CLASS} />
                        <span className="self-center text-sm font-semibold text-slate-500">{t('add_branch.to')}</span>
                        <Input type="time" {...register('openingHours.close')} className={INPUT_CLASS} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                      {t('add_branch.description')}
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder={t('add_branch.description_placeholder')}
                      className={TEXTAREA_CLASS}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="facilities" className="text-sm font-semibold text-slate-700">
                      {t('add_branch.gym_facilities')}
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {FACILITY_OPTIONS.map((facility) => {
                        const isSelected = selectedFacilities.includes(facility);
                        return (
                          <label
                            key={facility}
                            className={cn(
                              'flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all',
                              isSelected
                                ? 'border-orange-100 bg-gradient-to-br from-orange-100 via-orange-50 to-white text-orange-700 shadow-[0_10px_25px_rgba(240,173,104,0.25)]'
                                : 'border-orange-100 bg-white/95 text-slate-600 hover:border-orange-200 hover:bg-orange-50/30'
                            )}
                          >
                            <span>{facility}</span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleFacilityChange(facility, e.target.checked)}
                              className="sr-only"
                            />
                            <span
                              className={cn(
                                'h-4 w-4 rounded-full border transition-colors',
                                isSelected ? 'border-orange-400 bg-orange-200' : 'border-orange-200 bg-white'
                              )}
                            ></span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 lg:items-start lg:self-start">
                  <div className="w-full rounded-[32px] border border-orange-100 bg-gradient-to-b from-orange-50/90 via-orange-50/60 to-white px-6 py-8 text-center shadow-[0_25px_60px_rgba(240,90,41,0.08)]">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] border border-orange-100 bg-white shadow-[0_12px_30px_rgba(240,90,41,0.12)]">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Branch preview"
                          className="h-full w-full rounded-[14px] object-cover"
                        />
                      ) : (
                        <Upload className="h-6 w-6 text-orange-500" />
                      )}
                    </div>
                    <p className="text-lg font-semibold text-slate-900">{t('add_branch.profile_image_section')}</p>
                    <p className="text-sm text-slate-500">{t('add_branch.upload_from_device')}</p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                      <Button
                        type="button"
                        onClick={handleTakePhoto}
                        className="flex items-center gap-2 !h-11 !rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(15,23,42,0.25)] hover:bg-slate-800"
                      >
                        <Camera className="h-4 w-4" />
                        {t('add_branch.take_photo')}
                      </Button>
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="flex items-center gap-2 !h-11 !rounded-full border border-orange-200 bg-white px-6 text-sm font-semibold text-orange-600 shadow-[0_12px_30px_rgba(240,90,41,0.12)] hover:bg-orange-50"
                      >
                        <Upload className="h-4 w-4" />
                        {t('add_branch.upload_from_device')}
                      </Button>
                    </div>
                  </div>

                  <div className="w-full rounded-[32px] border border-orange-100 bg-white/90 px-5 py-6 shadow-inner shadow-orange-50/60">
                    <Label className="text-sm font-semibold text-slate-700">{t('add_branch.manager')}</Label>
                    <div className="mt-3 rounded-[24px] border border-orange-100 bg-white p-4">
                      {loadingManagers ? (
                        <p className="text-sm text-slate-500">{t('add_branch.manager_loading')}</p>
                      ) : (
                        <ManagerSelector
                          managers={managers.map((manager) => ({
                            _id: manager._id,
                            fullName: manager.userId?.fullName || 'Unknown',
                            email: manager.userId.email,
                            status: manager.userId.status
                          }))}
                          selectedManagerIds={selectedManagers}
                          onManagerChange={(managerIds) => setValue('managerId', managerIds)}
                          placeholder={t('add_branch.manager_placeholder')}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="text-center">
            <Button type="submit" disabled={isSubmitting} className={CTA_BUTTON_CLASS}>
              {isSubmitting ? t('add_branch.creating_branch') : t('add_branch.complete_registration')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBranchPage;
