import type React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import { formatPriceInput, parsePriceInput } from '@/utils/currency';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Upload, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useCreateStaff } from '@/hooks/useStaff';
import { useUser } from '@/hooks/useAuth';
import { useBranch } from '@/contexts/BranchContext';
import type { AddStaffFormProps, CreateStaffRequest, FormData } from '@/types/api/Staff';
import { toast } from 'sonner';
import { createImageUploadHandler, STAFF_IMAGE_OPTIONS } from '@/utils/imageUtils';
import { handleApiErrorForForm } from '@/utils/errorHandler';
import { generateUsernameFromEmail } from '@/utils/usernameUtils';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordConfirmation,
  validateFullName,
  validateJobTitle,
  validatePhoneNumberStaff,
  validateSalary,
  validateBranchId,
  validateDateOfBirthStaff,
  validateAddress
} from '@/utils/validation';

const PANEL_SURFACE_CLASS =
  'border border-orange-100/70 bg-gradient-to-br from-white via-orange-50/30 to-white shadow-[0_30px_60px_rgba(240,90,41,0.08)] backdrop-blur-sm !rounded-[32px]';
const PANEL_CONTENT_CLASS = 'px-8 py-8 sm:px-10 sm:py-10';
const INPUT_BASE_CLASS =
  '!h-12 !rounded-2xl border border-orange-100 bg-white/95 px-4 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm shadow-orange-100/80 transition-all focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-100 focus-visible:ring-offset-0';
const INPUT_ERROR_CLASS = '!border-red-400 !bg-red-50/80 focus-visible:border-red-500 focus-visible:ring-red-100';
const LABEL_CLASS = 'text-[13px] font-semibold text-slate-600';
const EYEBROW_CLASS = 'text-xs font-semibold uppercase tracking-[0.3em] text-orange-400';
const CTA_BUTTON_CLASS =
  'w-full !h-14 !rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-lg font-semibold text-white shadow-[0_25px_60px_rgba(240,90,41,0.45)] transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-60';

// Loading component
const LoadingView: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#f05a29]" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Role selection component
const RoleSelection: React.FC<{
  userType: string;
  setUserType: (type: string) => void;
  isLoading: boolean;
  t: (key: string) => string;
}> = ({ userType, setUserType, isLoading, t }) => {
  const roleDescriptions: Record<string, string> = {
    manager: t('staff.branch_manager_desc'),
    device: t('staff.equipment_manager_desc'),
    pt: t('staff.personal_trainer_desc')
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[
        { value: 'manager', label: t('staff.branch_manager') },
        { value: 'device', label: t('staff.equipment_manager') },
        { value: 'pt', label: t('staff.personal_trainer') }
      ].map(({ value, label }) => {
        const isActive = userType === value;

        return (
          <label
            key={value}
            className={cn(
              'relative flex min-h-[112px] cursor-pointer flex-col justify-between rounded-2xl border px-4 py-4 text-left transition-all duration-200',
              isActive
                ? 'border-transparent bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_25px_50px_rgba(240,90,41,0.25)]'
                : 'border-orange-100 bg-white/90 text-slate-600 hover:border-orange-200 hover:bg-orange-50/40'
            )}
          >
            <input
              type="radio"
              name="role"
              value={value}
              className="sr-only"
              checked={isActive}
              onChange={(e) => setUserType(e.target.value)}
              disabled={isLoading}
            />
            <div className="space-y-2">
              <p
                className={cn(
                  'text-[12px] font-semibold uppercase tracking-[0.25em]',
                  isActive ? 'text-white/70' : 'text-orange-400'
                )}
              >
                {t('staff.staff_type')}
              </p>
              <p className="text-xl font-semibold leading-tight">{label}</p>
              <p className={cn('text-sm text-slate-500', isActive && 'text-white/80')}>{roleDescriptions[value]}</p>
            </div>
            {isActive && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/80">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {t('common.status.active')}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
};

// Account Security Section Component
const AccountSecuritySection: React.FC<{
  formData: Partial<FormData>;
  errors: Record<string, string>;
  handleInputChange: (field: keyof FormData, value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  isLoading: boolean;
  t: (key: string) => string;
}> = ({
  formData,
  errors,
  handleInputChange,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isLoading,
  t
}) => (
  <Card className={PANEL_SURFACE_CLASS}>
    <CardContent className={cn(PANEL_CONTENT_CLASS, 'space-y-8')}>
      <div className="space-y-2">
        <p className={EYEBROW_CLASS}>{t('staff.account_security')}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">{t('staff.sign_in_method')}</h3>
            <p className="text-sm text-slate-500">{t('staff.security_hint')}</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            * {t('common.required')}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username" className={LABEL_CLASS}>
          * {t('staff.username')}
        </Label>
        <Input
          id="username"
          placeholder={t('staff.enter_username')}
          className={cn(INPUT_BASE_CLASS, errors.username && INPUT_ERROR_CLASS)}
          value={formData.username || ''}
          onChange={(e) => handleInputChange('username', e.target.value)}
          disabled={isLoading}
          required
        />
        {errors.username && <p className="text-xs font-medium text-red-500">{errors.username}</p>}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password" className={LABEL_CLASS}>
            * {t('staff.password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('staff.password_requirement')}
              className={cn(INPUT_BASE_CLASS, errors.password && INPUT_ERROR_CLASS)}
              value={formData.password || ''}
              onChange={(e) => handleInputChange('password', e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:opacity-40"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs font-medium text-red-500">{errors.password}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className={LABEL_CLASS}>
            * {t('staff.confirm_password')}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('staff.enter_password_again')}
              className={cn(INPUT_BASE_CLASS, errors.confirmPassword && INPUT_ERROR_CLASS)}
              value={formData.confirmPassword || ''}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:opacity-40"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs font-medium text-red-500">{errors.confirmPassword}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AddStaffForm: React.FC<AddStaffFormProps> = ({
  onSubmit,
  onCancel: _onCancel,
  isLoading: externalLoading = false
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useUser();
  const { createStaff, loading: createLoading, error: createError, resetError } = useCreateStaff();
  const { branches, loading: loadingBranches } = useBranch();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<FormData>>({
    userType: 'manager',
    jobTitle: 'Manager',
    salary: '5000000',
    branchId: []
  });

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasCheckedBranches, setHasCheckedBranches] = useState(false);

  // Reset error when form data changes
  useEffect(() => {
    if (createError) {
      resetError();
    }
  }, [formData, resetError, createError]);

  // Track when branches have been checked at least once
  useEffect(() => {
    if (!loadingBranches) {
      setHasCheckedBranches(true);
    }
  }, [loadingBranches]);

  // Show warning if no branches available (only after first check is complete)
  useEffect(() => {
    if (hasCheckedBranches && !loadingBranches && branches.length === 0 && user?.role === 'OWNER') {
      toast.warning(t('staff.no_branches_available'), {
        id: 'no-branches-warning' // Prevent duplicate toasts
      });
    }
  }, [hasCheckedBranches, loadingBranches, branches.length, user?.role, t]);

  const isLoading = externalLoading || createLoading;

  // Validation helper functions
  const getValidationResult = (fieldName: keyof FormData, value: string) => {
    const validators = {
      email: () => validateEmail(value),
      username: () => validateUsername(value),
      password: () => validatePassword(value),
      confirmPassword: () => validatePasswordConfirmation(formData.password || '', value),
      fullName: () => validateFullName(value),
      jobTitle: () => validateJobTitle(value),
      phone: () => validatePhoneNumberStaff(value),
      salary: () => validateSalary(value),
      branchId: () => validateBranchId(value),
      birthDate: () => validateDateOfBirthStaff(value),
      address: () => validateAddress(value)
    };

    const validator = validators[fieldName as keyof typeof validators];
    return validator ? validator() : { isValid: true };
  };

  const validateField = (fieldName: keyof FormData, value: string): string | null => {
    const result = getValidationResult(fieldName, value);
    return result.isValid ? null : result.error!;
  };

  // Validate all required fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    const requiredFields: (keyof FormData)[] = [
      'fullName',
      'email',
      'username',
      'password',
      'confirmPassword',
      'jobTitle',
      'branchId',
      'phone'
    ];

    requiredFields.forEach((field) => {
      const value = formData[field] || '';
      // Handle branchId specially - now always an array
      if (field === 'branchId') {
        const branchIds = Array.isArray(value) ? value : [];
        if (branchIds.length === 0) {
          newErrors[field] = 'Branch is required';
        }
      } else {
        const error = validateField(field, value as string);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    // Optional fields validation (only if they have values)
    const optionalFields: (keyof FormData)[] = ['salary', 'birthDate', 'address'];
    optionalFields.forEach((field) => {
      const value = formData[field] || '';
      if (typeof value === 'string' && value.trim()) {
        const error = validateField(field, value);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to handle image upload using utility
  const handleImageUpload = createImageUploadHandler((result) => {
    setProfileImageFile(result.file);
    setProfileImage(result.imageUrl);
    setFormData((prev) => ({ ...prev, profileImage: result.imageUrl }));
  }, STAFF_IMAGE_OPTIONS);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      handleInputChange('birthDate', formattedDate);

      // Only close the date picker if the date is valid
      // If there's an error, keep it open so user can see the validation message
      const validation = validateDateOfBirthStaff(formattedDate);
      if (validation.isValid) {
        setDatePickerOpen(false);
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => {
      // Ensure branchId is always an array
      const processedValue = field === 'branchId' ? (Array.isArray(value) ? value : value ? [value] : []) : value;

      const newData = { ...prev, [field]: processedValue };

      // Auto-set jobTitle when userType changes
      if (field === 'userType' && typeof value === 'string') {
        newData.jobTitle = mapUserTypeToJobTitle(value);
      }

      // Auto-generate username from email when email changes (only if username hasn't been manually edited)
      if (field === 'email' && typeof value === 'string' && value && !isUsernameManuallyEdited) {
        const generatedUsername = generateUsernameFromEmail(value);
        if (generatedUsername) {
          newData.username = generatedUsername;
        }
      }

      // Track if username is manually edited
      if (field === 'username' && typeof value === 'string') {
        setIsUsernameManuallyEdited(true);
      }

      return newData;
    });

    // Clear error for this field and validate
    if (field === 'branchId') {
      // Special handling for branchId array - now always an array
      const branchIds = Array.isArray(value) ? value : [];
      if (branchIds.length === 0) {
        setErrors((prev) => ({
          ...prev,
          [field]: 'Branch is required'
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          [field]: ''
        }));
      }
    } else {
      const error = validateField(field, value as string);
      setErrors((prev) => ({
        ...prev,
        [field]: error || ''
      }));
    }

    // Auto-validate jobTitle when userType changes
    if (field === 'userType') {
      const jobTitle = mapUserTypeToJobTitle(value as string);
      const jobTitleError = validateField('jobTitle', jobTitle);
      setErrors((prev) => ({
        ...prev,
        jobTitle: jobTitleError || ''
      }));
    }

    // Auto-validate username when email changes and generates username
    if (field === 'email' && typeof value === 'string' && value && !isUsernameManuallyEdited) {
      const generatedUsername = generateUsernameFromEmail(value);
      if (generatedUsername) {
        const usernameError = validateField('username', generatedUsername);
        setErrors((prev) => ({
          ...prev,
          username: usernameError || ''
        }));
      }
    }

    // If this is password field, also revalidate confirm password
    if (field === 'password' && typeof value === 'string' && formData.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError || ''
      }));
    }
  };

  const handleSalaryChange = (inputValue: string) => {
    if (!inputValue) {
      handleInputChange('salary', '');
      return;
    }

    const parsedValue = parsePriceInput(inputValue);
    handleInputChange('salary', parsedValue.toString());
  };

  // Helper function to map user type to job title
  const mapUserTypeToJobTitle = (userType: string): string => {
    const jobTitleMapping: Record<string, string> = {
      manager: 'Manager',
      device: 'Technician',
      pt: 'Personal Trainer'
    };
    return jobTitleMapping[userType] || 'Manager';
  };

  // Helper function to prepare staff data for API
  const prepareStaffData = (): CreateStaffRequest => {
    const userType = formData.userType || 'manager';
    // branchId is now always an array
    const branchId = Array.isArray(formData.branchId) ? formData.branchId : [];

    return {
      username: formData.username || '',
      email: formData.email || '',
      password: formData.password || '',
      fullName: formData.fullName || '',
      phoneNumber: formData.phone?.trim() || undefined,
      gender: formData.gender?.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
      dateOfBirth: formData.birthDate,
      address: formData.address,
      jobTitle: mapUserTypeToJobTitle(userType),
      branchId: branchId,
      salary: formData.salary ? parseInt(formData.salary) : 5000000,
      role: 'STAFF', // All staff members have STAFF role in user table
      status: 'ACTIVE'
    };
  };

  // Helper function to handle successful staff creation
  const handleSuccessfulCreation = () => {
    toast.success(t('staff.created_successfully'));

    if (onSubmit) {
      onSubmit({
        ...formData,
        profileImage
      } as FormData);
    } else {
      navigate('/manage/staff');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submission
    if (!validateForm()) {
      return;
    }
    const staffData = prepareStaffData();

    await createStaff(staffData, profileImageFile || undefined)
      .then((data) => {
        if (data) {
          handleSuccessfulCreation();
        }
      })
      .catch(
        (
          error: Error & {
            meta?: { details?: Array<{ field: string; message: string }>; field?: string };
            code?: string;
            statusCode?: number;
          }
        ) => {
          // Use centralized error handler
          const fieldErrors = handleApiErrorForForm(error, {
            context: 'staff',
            customFieldMappings: {
              phoneNumber: 'phone',
              dateOfBirth: 'birthDate'
            },
            t: (key: string) => t(key)
          });
          setErrors(fieldErrors);
        }
      );
  };

  // Check if user has permission
  if (!user) {
    return <LoadingView message={t('common.loading')} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className={PANEL_SURFACE_CLASS}>
            <CardContent className={cn(PANEL_CONTENT_CLASS, 'space-y-8')}>
              <div className="flex flex-col gap-6 text-left lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-1">
                  <p className={EYEBROW_CLASS}>{t('staff.personal_info')}</p>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-slate-900">{t('staff.personal_info')}</h2>
                    <p className="text-sm font-semibold text-orange-500">* {t('common.required')}</p>
                  </div>
                </div>
                <div className="flex w-full justify-start lg:max-w-sm lg:justify-end">
                  <div className="flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={isLoading}
                      className="group relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 via-white to-orange-100 text-orange-400 shadow-inner shadow-white/70 ring-8 ring-orange-50/80 transition hover:border-orange-400 hover:text-orange-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:opacity-50"
                    >
                      {profileImage ? (
                        <img
                          src={profileImage || '/placeholder.svg'}
                          alt="Profile"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <Upload className="h-8 w-8" />
                      )}
                      <span className="sr-only">{t('staff.upload_from_device')}</span>
                    </button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <RoleSelection
                userType={formData.userType || 'manager'}
                setUserType={(value) => handleInputChange('userType', value)}
                isLoading={isLoading}
                t={t}
              />

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullname" className={LABEL_CLASS}>
                    * {t('staff.full_name')}
                  </Label>
                  <Input
                    id="fullname"
                    placeholder={t('staff.enter_full_name')}
                    className={cn(INPUT_BASE_CLASS, errors.fullName && INPUT_ERROR_CLASS)}
                    value={formData.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  {errors.fullName && <p className="text-xs font-medium text-red-500">{errors.fullName}</p>}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className={LABEL_CLASS}>
                      * {t('staff.email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      className={cn(INPUT_BASE_CLASS, errors.email && INPUT_ERROR_CLASS)}
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    {errors.email && <p className="text-xs font-medium text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className={LABEL_CLASS}>
                      {t('staff.phone_number')}
                    </Label>
                    <Input
                      id="phone"
                      placeholder="0123456789"
                      className={cn(INPUT_BASE_CLASS, errors.phone && INPUT_ERROR_CLASS)}
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.phone && <p className="text-xs font-medium text-red-500">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className={LABEL_CLASS}>
                    {t('staff.address')}
                  </Label>
                  <Input
                    id="address"
                    placeholder={t('staff.enter_address')}
                    className={cn(INPUT_BASE_CLASS, errors.address && INPUT_ERROR_CLASS)}
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.address && <p className="text-xs font-medium text-red-500">{errors.address}</p>}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="birthdate" className={LABEL_CLASS}>
                      {t('staff.birth_date')}
                    </Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            INPUT_BASE_CLASS,
                            'flex items-center justify-between text-left font-normal',
                            !formData.birthDate && 'text-slate-400',
                            errors.birthDate && INPUT_ERROR_CLASS
                          )}
                          disabled={isLoading}
                        >
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formData.birthDate
                              ? format(new Date(formData.birthDate + 'T00:00:00'), 'dd/MM/yyyy', { locale: vi })
                              : t('staff.select_birth_date')}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl"
                        align="start"
                      >
                        <CalendarComponent
                          mode="single"
                          selected={formData.birthDate ? new Date(formData.birthDate + 'T00:00:00') : undefined}
                          onSelect={handleDateSelect}
                          initialFocus
                          locale={vi}
                          className="bg-white"
                          fromYear={1950}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown"
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.birthDate && <p className="text-xs font-medium text-red-500">{errors.birthDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch" className={LABEL_CLASS}>
                      * {t('staff.branch')}
                    </Label>
                    <MultiSelect
                      options={branches.map((branch) => ({
                        label: branch.branchName,
                        value: branch._id
                      }))}
                      selected={Array.isArray(formData.branchId) ? formData.branchId : []}
                      onChange={(selected) => handleInputChange('branchId', selected)}
                      placeholder={loadingBranches ? t('common.loading') : t('staff.select_branch')}
                      className={cn(
                        'w-full justify-between !h-12 !rounded-2xl border border-orange-100 bg-white/95 px-4 text-left text-[15px] text-slate-900 shadow-sm shadow-orange-100/80',
                        errors.branchId && '!border-red-400 !bg-red-50/80'
                      )}
                      disabled={isLoading || loadingBranches}
                    />
                    {errors.branchId && <p className="text-xs font-medium text-red-500">{errors.branchId}</p>}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="salary" className={LABEL_CLASS}>
                      {t('staff.salary')} (VND)
                    </Label>
                    <Input
                      id="salary"
                      type="text"
                      inputMode="numeric"
                      placeholder={formatPriceInput('5000000')}
                      className={cn(INPUT_BASE_CLASS, errors.salary && INPUT_ERROR_CLASS)}
                      value={formatPriceInput(formData.salary || '')}
                      onChange={(e) => handleSalaryChange(e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.salary && <p className="text-xs font-medium text-red-500">{errors.salary}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className={LABEL_CLASS}>
                      {t('staff.gender')}
                    </Label>
                    <Select
                      value={formData.gender || undefined}
                      onValueChange={(value) => handleInputChange('gender', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger
                        className={cn('w-full text-left', INPUT_BASE_CLASS, errors.gender && INPUT_ERROR_CLASS)}
                      >
                        <SelectValue placeholder={t('staff.select_gender')} />
                      </SelectTrigger>
                      <SelectContent className="border border-slate-200/80 bg-white shadow-xl">
                        <SelectItem value="male">{t('staff.male')}</SelectItem>
                        <SelectItem value="female">{t('staff.female')}</SelectItem>
                        <SelectItem value="other">{t('staff.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AccountSecuritySection
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            isLoading={isLoading}
            t={t}
          />

          {createError && (
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm font-medium text-red-600 shadow-inner shadow-white/70">
              {createError}
            </div>
          )}

          <Button type="submit" className={CTA_BUTTON_CLASS} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            ) : (
              t('staff.complete_registration')
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddStaffForm;
