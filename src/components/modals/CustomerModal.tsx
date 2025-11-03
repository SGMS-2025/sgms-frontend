import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Upload, Camera, CalendarIcon, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useBranch } from '@/contexts/BranchContext';
import { customerApi } from '@/services/api/customerApi';
import { handleApiErrorForForm } from '@/utils/errorHandler';
import { generateUsernameFromEmail } from '@/utils/usernameUtils';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhoneNumberEdit,
  validateDateOfBirthCustomer,
  type ValidationResult
} from '@/utils/validation';
import type {
  CustomerModalProps,
  CustomerFormData,
  ApiResponse,
  CustomerDetail,
  GenderType
} from '@/types/api/Customer';

const buildInitialForm = (branchId?: string): CustomerFormData => ({
  name: '',
  phone: '',
  email: '',
  password: '',
  gender: 'male',
  address: '',
  notes: '',
  dateOfBirth: '',
  branchId: branchId || '',
  avatar: null
});

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  isEditMode = false,
  onCustomerUpdate
}) => {
  const { t } = useTranslation();
  const { branches, currentBranch } = useBranch();
  const currentBranchId = currentBranch?._id;

  const [formData, setFormData] = useState<CustomerFormData>(buildInitialForm(currentBranchId));
  const [loading, setLoading] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedUsername, setGeneratedUsername] = useState<string>('');

  const resetFormData = (branchId?: string) => {
    setFormData(buildInitialForm(branchId));
    setDateOfBirth(undefined);
    setDatePickerOpen(false);
    setShowPassword(false);
    setErrors({});
    setGeneratedUsername('');
  };

  const populateFormData = (customerDetail: CustomerDetail) => {
    const normalizedGender = customerDetail.gender?.toLowerCase() || 'male';
    const branchId = customerDetail.branches?.[0]?._id || currentBranchId || '';

    setFormData({
      name: customerDetail.name || '',
      phone: customerDetail.phone || '',
      email: customerDetail.email || '',
      password: '',
      gender: ['male', 'female', 'other'].includes(normalizedGender) ? (normalizedGender as GenderType) : 'male',
      address: customerDetail.address || '',
      notes: customerDetail.notes || '',
      dateOfBirth: customerDetail.dateOfBirth || '',
      branchId,
      avatar: null
    });

    setDateOfBirth(customerDetail.dateOfBirth ? new Date(customerDetail.dateOfBirth) : undefined);
    setDatePickerOpen(false);
    setShowPassword(false);
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) {
      resetFormData(currentBranchId);
      return;
    }

    if (isEditMode && customer) {
      populateFormData(customer as CustomerDetail);
    } else {
      resetFormData(currentBranchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer, isEditMode, currentBranchId]);

  useEffect(() => {
    if (!isOpen || isEditMode) return;
    if (currentBranchId) {
      setFormData((prev) => ({ ...prev, branchId: currentBranchId || prev.branchId }));
    }
  }, [currentBranchId, isOpen, isEditMode]);

  const handleInputChange = (field: keyof CustomerFormData, value: string | File | null) => {
    // Clear existing error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }

    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-generate username from email when email changes (only if not in edit mode)
      if (field === 'email' && typeof value === 'string' && value && !isEditMode) {
        const generatedUsername = generateUsernameFromEmail(value);
        if (generatedUsername) {
          setGeneratedUsername(generatedUsername);
        }
      }

      return newData;
    });

    // Real-time validation for string fields
    if (typeof value === 'string' && field !== 'avatar') {
      const error = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field]: error || ''
      }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('avatar', file);
    }
  };

  // Validation helper functions using centralized utilities
  const getValidationResult = (fieldName: keyof CustomerFormData, value: string): ValidationResult => {
    switch (fieldName) {
      case 'name':
        return validateFullName(value);
      case 'phone':
        return validatePhoneNumberEdit(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        // Skip password validation in edit mode
        if (isEditMode) return { isValid: true };
        return validatePassword(value);
      case 'dateOfBirth':
        return validateDateOfBirthCustomer(value);
      default:
        return { isValid: true };
    }
  };

  const validateField = (field: keyof CustomerFormData, value: string | File | null): string | null => {
    const result = getValidationResult(field, String(value || ''));
    return result.isValid ? null : result.error!;
  };

  // Validate all required fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    const requiredFields: (keyof CustomerFormData)[] = ['name', 'phone', 'email'];
    if (!isEditMode) requiredFields.push('password');

    requiredFields.forEach((field) => {
      const fieldValue = formData[field];
      if (fieldValue !== null && fieldValue !== undefined && !(fieldValue instanceof File)) {
        const error = validateField(field, String(fieldValue));
        if (error) newErrors[field] = error;
      }
    });

    // Optional fields validation (only if they have values)
    const optionalFields: (keyof CustomerFormData)[] = ['dateOfBirth'];
    optionalFields.forEach((field) => {
      const fieldValue = formData[field];
      if (typeof fieldValue === 'string' && fieldValue.trim()) {
        const error = validateField(field, fieldValue);
        if (error) newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Username generation is now imported from utils
  // Error handling is now done inline using handleApiErrorForForm

  const handleDateOfBirthSelect = (date: Date | undefined) => {
    if (!date) return;

    const formattedDate = format(date, 'yyyy-MM-dd');
    handleInputChange('dateOfBirth', formattedDate);
    setDateOfBirth(date);
    setDatePickerOpen(false);

    const error = validateField('dateOfBirth', formattedDate);
    if (error) {
      setErrors((prev) => ({ ...prev, dateOfBirth: error }));
    } else {
      setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
    }
  };

  const handleSubmit = () => {
    setLoading(true);

    // Validate all fields before submission
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const payload = {
      username: generatedUsername || formData.phone, // Use generated username from email, fallback to phone
      email: formData.email,
      fullName: formData.name,
      phoneNumber: formData.phone,
      gender: formData.gender.toUpperCase(),
      dateOfBirth: formData.dateOfBirth || null,
      address: formData.address || null,
      notes: formData.notes || null,
      branchId: formData.branchId || currentBranchId
    };

    if (!isEditMode) {
      (payload as typeof payload & { password: string }).password = formData.password;
    }

    if (isEditMode && customer) {
      customerApi
        .updateBasicInfo(customer.id, payload)
        .then(() => {
          toast.success(t('customer_modal.success.basic_info_updated'));
          onCustomerUpdate?.();
          onClose();
        })
        .catch(
          (
            error: Error & {
              meta?: { details?: Array<{ field: string; message: string }>; field?: string };
              code?: string;
              statusCode?: number;
            }
          ) => {
            console.error('Error updating customer:', error);

            // Use centralized error handler
            const fieldErrors = handleApiErrorForForm(error, {
              context: 'customer',
              customFieldMappings: {
                phoneNumber: 'phone',
                fullName: 'name',
                dateOfBirth: 'dateOfBirth'
              },
              errorKeyMappings: {
                username: 'EMAIL_ALREADY_EXISTS',
                email: 'EMAIL_ALREADY_EXISTS',
                phoneNumber: 'PHONE_NUMBER_ALREADY_EXISTS'
              },
              t: (key: string) => t(key)
            });
            setErrors(fieldErrors);
          }
        )
        .finally(() => {
          setLoading(false);
        });
    } else {
      customerApi
        .createCustomer(payload, formData.avatar || undefined)
        .then((response) => {
          if (!response.success) {
            const errorResponse = response as ApiResponse<unknown>;
            const errorMessage = errorResponse.message || 'Không thể tạo khách hàng';
            const statusCode = errorResponse.statusCode;
            const errorCode = errorResponse.code;

            // Debug logging
            console.log('Error response:', errorResponse);
            console.log('Error object:', errorResponse.error);
            console.log('Error meta:', errorResponse.error?.meta);
            console.log('Status code:', statusCode);
            console.log('Error code:', errorCode);
            console.log('Full error structure:', JSON.stringify(errorResponse, null, 2));

            // Use centralized error handler
            // Construct error object from errorResponse for compatibility
            const errorObj = errorResponse.error as {
              meta?: { details?: Array<{ field: string; message: string }>; field?: string };
              code?: string;
              statusCode?: number;
              message?: string;
            };
            const errorForHandler = {
              name: 'Error',
              ...errorObj,
              statusCode: statusCode || errorObj?.statusCode,
              code: errorCode || errorObj?.code,
              message: errorMessage || errorObj?.message
            } as Error & {
              meta?: { details?: Array<{ field: string; message: string }>; field?: string };
              code?: string;
              statusCode?: number;
            };

            console.log('[CustomerModal.then] errorForHandler:', errorForHandler);
            console.log('[CustomerModal.then] errorForHandler.meta:', errorForHandler.meta);
            console.log('[CustomerModal.then] errorForHandler.meta?.details:', errorForHandler.meta?.details);

            const fieldErrors = handleApiErrorForForm(errorForHandler, {
              context: 'customer',
              customFieldMappings: {
                phoneNumber: 'phone',
                fullName: 'name',
                dateOfBirth: 'dateOfBirth'
              },
              errorKeyMappings: {
                username: 'EMAIL_ALREADY_EXISTS',
                email: 'EMAIL_ALREADY_EXISTS',
                phoneNumber: 'PHONE_NUMBER_ALREADY_EXISTS'
              },
              t: (key: string) => t(key)
            });
            setErrors(fieldErrors);
            setLoading(false);
            return;
          }

          toast.success(t('customer_modal.success.create'));
          onCustomerUpdate?.();
          onClose();
        })
        .catch((error: unknown) => {
          console.error('Error creating customer:', error);

          // Normalize error object from different sources (AxiosError, ApiResponse, etc.)
          let normalizedError: Error & {
            meta?: { details?: Array<{ field: string; message: string }>; field?: string };
            code?: string;
            statusCode?: number;
          };

          // Check if error has response.data structure (from Axios)
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as {
              response?: {
                data?: {
                  error?: {
                    meta?: { details?: Array<{ field: string; message: string }>; field?: string };
                    code?: string;
                    statusCode?: number;
                    message?: string;
                  };
                };
              };
            };
            if (axiosError.response?.data?.error) {
              normalizedError = {
                name: 'Error',
                ...axiosError.response.data.error,
                message: axiosError.response.data.error.message || 'Unknown error',
                statusCode: axiosError.response.data.error.statusCode,
                code: axiosError.response.data.error.code
              };
            } else {
              normalizedError = {
                name: 'Error',
                message: 'Network error',
                statusCode: 0,
                code: 'NETWORK_ERROR'
              };
            }
          } else {
            // Use error as-is if it already has the correct structure
            normalizedError = error as Error & {
              meta?: { details?: Array<{ field: string; message: string }>; field?: string };
              code?: string;
              statusCode?: number;
            };
          }

          console.log('Catch block - Normalized error:', normalizedError);
          console.log('Catch block - Error meta:', normalizedError?.meta);
          console.log('Catch block - Error details:', normalizedError?.meta?.details);

          // Use centralized error handler
          const fieldErrors = handleApiErrorForForm(normalizedError, {
            context: 'customer',
            customFieldMappings: {
              phoneNumber: 'phone',
              fullName: 'name',
              dateOfBirth: 'dateOfBirth'
            },
            errorKeyMappings: {
              username: 'EMAIL_ALREADY_EXISTS',
              email: 'EMAIL_ALREADY_EXISTS',
              phoneNumber: 'PHONE_NUMBER_ALREADY_EXISTS'
            },
            t: (key: string) => t(key)
          });
          setErrors(fieldErrors);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const branchDisplay =
    branches.find((b) => b._id === formData.branchId)?.branchName ||
    currentBranch?.branchName ||
    t('customer_modal.no_branch_selected');
  const branchAddress = branches.find((b) => b._id === formData.branchId)?.location || currentBranch?.location;

  const title = isEditMode ? t('customer_modal.edit_customer') : t('customer_modal.create_customer');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl overflow-y-auto max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="space-y-4">
              {/* Avatar */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">{t('customer_modal.avatar')}</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                    {formData.avatar ? (
                      <img
                        src={URL.createObjectURL(formData.avatar)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{t('customer_modal.upload')}</span>
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>{t('customer_modal.take_photo')}</span>
                    </Button>
                  </div>
                </div>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('customer_modal.customer_name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={t('customer_modal.customer_name_placeholder')}
                    className={errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">{t('customer_modal.gender')}</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">{t('customer_modal.male')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">{t('customer_modal.female')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">{t('customer_modal.other')}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('customer_modal.phone')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('customer_modal.phone_placeholder')}
                    className={errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('customer_modal.email')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('customer_modal.email_placeholder')}
                    className={errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {t('customer_modal.password')} {!isEditMode && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder={t('customer_modal.password_placeholder')}
                      className={
                        errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500 pr-10' : 'pr-10'
                      }
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('customer_modal.date_of_birth')}</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal bg-white border-gray-200 hover:bg-gray-50 focus:border-orange-500',
                        !dateOfBirth && 'text-muted-foreground',
                        errors.dateOfBirth && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateOfBirth
                        ? format(dateOfBirth, 'dd/MM/yyyy', { locale: vi })
                        : t('customer_modal.select_birth_date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
                    <Calendar
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={handleDateOfBirthSelect}
                      autoFocus
                      locale={vi}
                      className="bg-white border-0"
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
                      captionLayout="dropdown"
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {errors.dateOfBirth && <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('customer_modal.branch')}</Label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{branchDisplay}</p>
                    <p className="text-xs text-gray-500">{branchAddress}</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('customer_modal.address')}</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t('customer_modal.address_placeholder')}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('customer_modal.notes')}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder={t('customer_modal.notes_placeholder')}
                  rows={4}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('customer_modal.close')}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('customer_modal.loading_data')}</span>
                </div>
              ) : isEditMode ? (
                t('customer_modal.update')
              ) : (
                t('customer_modal.create')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
