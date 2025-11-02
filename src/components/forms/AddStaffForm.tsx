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
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Upload, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useCreateStaff } from '@/hooks/useStaff';
import { useUser } from '@/hooks/useAuth';
import { useBranch } from '@/contexts/BranchContext';
import type { AddStaffFormProps, CreateStaffRequest, FormData } from '@/types/api/Staff';
import { toast } from 'sonner';
import { createImageUploadHandler, STAFF_IMAGE_OPTIONS } from '@/utils/imageUtils';
import { normalizeErrorKey } from '@/utils/errorHandler';
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
}> = ({ userType, setUserType, isLoading, t }) => (
  <div className="mb-6">
    <div className="flex flex-wrap gap-4">
      {[
        { value: 'manager', label: t('staff.branch_manager') },
        { value: 'device', label: t('staff.equipment_manager') },
        { value: 'pt', label: t('staff.personal_trainer') }
      ].map(({ value, label }) => (
        <label
          key={value}
          className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
            userType === value
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
          }`}
        >
          <input
            type="radio"
            name="role"
            value={value}
            className="text-orange-500 focus:ring-orange-500"
            checked={userType === value}
            onChange={(e) => setUserType(e.target.value)}
            disabled={isLoading}
          />
          <span className={userType === value ? 'text-orange-600 font-medium' : 'text-gray-700'}>{label}</span>
        </label>
      ))}
    </div>
  </div>
);

// Profile Photo Section Component
const ProfilePhotoSection: React.FC<{
  profileImage: string | null;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  t: (key: string) => string;
}> = ({ profileImage, handleImageUpload, isLoading, t }) => (
  <Card>
    <CardContent className="p-6">
      <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium mb-4 inline-block">
        {t('staff.profile_photo')}
      </div>

      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          {profileImage ? (
            <img src={profileImage || '/placeholder.svg'} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-8 h-8 text-orange-500" />
          )}
        </div>
        <div className="space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('photo-upload')?.click()}
            disabled={isLoading}
          >
            {t('staff.upload_from_device')}
          </Button>
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
    </CardContent>
  </Card>
);

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
  <Card>
    <CardContent className="p-6">
      <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium mb-4 inline-block">
        {t('staff.account_security')}
      </div>
      <div className="text-sm text-gray-600 mb-4">* {t('common.required')}</div>

      <div className="mb-4">
        <Label htmlFor="username" className="mb-1 block">
          * {t('staff.username')}
        </Label>
        <Input
          id="username"
          placeholder={t('staff.enter_username')}
          className={`${errors.username ? 'border-red-500' : ''}`}
          value={formData.username || ''}
          onChange={(e) => handleInputChange('username', e.target.value)}
          disabled={isLoading}
          required
        />
        {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="password" className="mb-1 block">
            * {t('staff.password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('staff.password_requirement')}
              className={`${errors.password ? 'border-red-500' : ''}`}
              value={formData.password || ''}
              onChange={(e) => handleInputChange('password', e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword" className="mb-1 block">
            * {t('staff.confirm_password')}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('staff.enter_password_again')}
              className={`${errors.confirmPassword ? 'border-red-500' : ''}`}
              value={formData.confirmPassword || ''}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AddStaffForm: React.FC<AddStaffFormProps> = ({
  onSubmit,
  onCancel,
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

  // Helper function to generate username from email
  const generateUsernameFromEmail = (email: string): string => {
    if (!email || !email.includes('@')) {
      return '';
    }

    // Extract the part before @ symbol
    const username = email.split('@')[0];

    // Remove any special characters and keep only alphanumeric and underscore
    const cleanedUsername = username.replace(/[^a-zA-Z0-9_]/g, '');

    // Ensure username is not empty and has reasonable length
    return cleanedUsername.substring(0, 20); // Limit to 20 characters
  };

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
          // Handle errors with meta.details for inline messages
          if (error?.meta?.details && Array.isArray(error.meta.details) && error.meta.details.length > 0) {
            // Map details array to errors state
            const fieldErrors: Record<string, string> = {};
            error.meta.details.forEach((detail: { field: string; message: string }) => {
              // Map backend field names to frontend field names if needed
              let frontendField = detail.field;
              if (detail.field === 'phoneNumber') {
                frontendField = 'phone'; // Frontend uses 'phone' instead of 'phoneNumber'
              } else if (detail.field === 'dateOfBirth') {
                frontendField = 'birthDate'; // Frontend uses 'birthDate' instead of 'dateOfBirth'
              }
              fieldErrors[frontendField] = t(`error.${normalizeErrorKey(detail.message)}`);
            });
            setErrors(fieldErrors);
          } else if (error?.meta?.field) {
            let frontendField = error.meta.field;
            if (error.meta.field === 'phoneNumber') {
              frontendField = 'phone';
            } else if (error.meta.field === 'dateOfBirth') {
              frontendField = 'birthDate';
            }
            setErrors({ [frontendField]: t(`error.${normalizeErrorKey(error.message)}`) });
          }
        }
      );
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/manage/staff');
    }
  };

  // Check if user has permission
  if (!user) {
    return <LoadingView message={t('common.loading')} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium">+</div>
            <h1 className="text-2xl font-bold text-orange-500">{t('staff.register_staff')}</h1>
          </div>
          <Button
            variant="outline"
            className="flex items-center space-x-2 bg-[#0D1523] text-white border-[#0D1523] hover:bg-[#2a3441] hover:border-[#2a3441] hover:text-white transition-colors duration-200 shadow-md hover:shadow-lg"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <ArrowLeft size={16} />
            <span>{t('common.back_to_list')}</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium">
                  {t('staff.personal_info')}
                </div>
              </div>

              {/* Role Selection */}
              <RoleSelection
                userType={formData.userType || 'manager'}
                setUserType={(value) => handleInputChange('userType', value)}
                isLoading={isLoading}
                t={t}
              />

              {/* Basic Information */}
              <div className="space-y-6">
                {/* Row 2: Full Name (full width) */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-sm font-medium text-gray-700">
                      * {t('staff.full_name')}
                    </Label>
                    <Input
                      id="fullname"
                      placeholder={t('staff.enter_full_name')}
                      className={`${errors.fullName ? 'border-red-500' : ''}`}
                      value={formData.fullName || ''}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
                  </div>
                </div>

                {/* Row 3: Email (1/2 width, left) | Phone Number (1/2 width, right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      * {t('staff.email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      className={` ${errors.email ? 'border-red-500' : ''}`}
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      {t('staff.phone_number')}
                    </Label>
                    <Input
                      id="phone"
                      placeholder="0123456789"
                      className={` ${errors.phone ? 'border-red-500' : ''}`}
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Row 4: Address (full width) */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      {t('staff.address')}
                    </Label>
                    <Input
                      id="address"
                      placeholder={t('staff.enter_address')}
                      className={` ${errors.address ? 'border-red-500' : ''}`}
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                  </div>
                </div>

                {/* Row 5: Date of Birth (1/2) | Branch (1/2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="birthdate" className="text-sm font-medium text-gray-700">
                      {t('staff.birth_date')}
                    </Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal bg-white border-gray-200 hover:bg-gray-50 focus:border-orange-500',
                            !formData.birthDate && 'text-muted-foreground',
                            errors.birthDate && 'border-red-500 focus:border-red-500'
                          )}
                          disabled={isLoading}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.birthDate
                            ? format(new Date(formData.birthDate + 'T00:00:00'), 'dd/MM/yyyy', { locale: vi })
                            : t('staff.select_birth_date')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.birthDate ? new Date(formData.birthDate + 'T00:00:00') : undefined}
                          onSelect={handleDateSelect}
                          initialFocus
                          locale={vi}
                          className="bg-white border-0"
                          fromYear={1950}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown"
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.birthDate && <p className="text-sm text-red-500 mt-1">{errors.birthDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-sm font-medium text-gray-700">
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
                      className={errors.branchId ? 'border-red-500' : ''}
                      disabled={isLoading || loadingBranches}
                    />
                    {errors.branchId && <p className="text-sm text-red-500 mt-1">{errors.branchId}</p>}
                  </div>
                </div>

                {/* Row 6: Salary (1/2) | Gender (1/2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="text-sm font-medium text-gray-700">
                      {t('staff.salary')} (VND)
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      placeholder="5000000"
                      className={` ${errors.salary ? 'border-red-500' : ''}`}
                      value={formData.salary || ''}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.salary && <p className="text-sm text-red-500 mt-1">{errors.salary}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      {t('staff.gender')}
                    </Label>
                    <Select onValueChange={(value) => handleInputChange('gender', value)} disabled={isLoading}>
                      <SelectTrigger className="">
                        <SelectValue placeholder={t('staff.select_gender')} />
                      </SelectTrigger>
                      <SelectContent>
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

          {/* Profile Photo Section */}
          <ProfilePhotoSection
            profileImage={profileImage}
            handleImageUpload={handleImageUpload}
            isLoading={isLoading}
            t={t}
          />

          {/* Account Security Section */}
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

          {/* Error Display */}
          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-600 text-sm">{createError}</div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-medium disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
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
