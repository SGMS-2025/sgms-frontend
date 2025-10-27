import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Upload, Camera, CalendarIcon, Eye, EyeOff, User } from 'lucide-react';
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
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

  const resetFormData = (branchId?: string) => {
    setFormData(buildInitialForm(branchId));
    setDateOfBirth(undefined);
    setDatePickerOpen(false);
    setShowPassword(false);
    setErrors({});
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
  }, [isOpen, customer, isEditMode, currentBranchId]);

  useEffect(() => {
    if (!isOpen || isEditMode) return;
    if (currentBranchId) {
      setFormData((prev) => ({ ...prev, branchId: currentBranchId || prev.branchId }));
    }
  }, [currentBranchId, isOpen, isEditMode]);

  const handleInputChange = (field: keyof CustomerFormData, value: string | File | null) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('avatar', file);
    }
  };

  const validateName = (value: string): string => {
    if (!value.trim()) return t('customer_modal.validation.name_required');
    return '';
  };

  const validatePhone = (value: string): string => {
    if (!value.trim()) return t('customer_modal.validation.phone_required');
    if (value.trim().length > 15) return t('customer_modal.validation.phone_length');
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) return t('customer_modal.validation.phone_format');
    return '';
  };

  const validateEmail = (value: string): string => {
    if (!value.trim()) return t('customer_modal.validation.email_required');
    if (value.trim().length > 100) return t('customer_modal.validation.email_length');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t('customer_modal.validation.email_format');
    return '';
  };

  const validatePassword = (value: string): string => {
    if (isEditMode) return '';

    if (!value.trim()) return t('customer_modal.validation.password_required');
    if (value.length < 8) return t('customer_modal.validation.password_length');
    if (!/[A-Z]/.test(value)) return t('customer_modal.validation.password_uppercase');
    if (!/[0-9]/.test(value)) return t('customer_modal.validation.password_number');
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return t('customer_modal.validation.password_special');
    return '';
  };

  const validateDateOfBirth = (value: string): string => {
    if (!value) return '';
    const birthDate = new Date(value);
    const today = new Date();

    if (birthDate > today) return t('customer_modal.validation.birth_date_future');

    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    if (actualAge < 5) return t('customer_modal.validation.age_requirement');
    return '';
  };

  const validateField = (field: keyof CustomerFormData, value: string | File | null): string => {
    switch (field) {
      case 'name':
        return validateName(String(value || ''));
      case 'phone':
        return validatePhone(String(value || ''));
      case 'email':
        return validateEmail(String(value || ''));
      case 'password':
        return validatePassword(String(value || ''));
      case 'dateOfBirth':
        return validateDateOfBirth(String(value || ''));
      default:
        return '';
    }
  };

  const validateBasicInfo = (): Partial<Record<keyof CustomerFormData, string>> => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};
    const requiredFields: (keyof CustomerFormData)[] = ['name', 'phone', 'email'];
    if (!isEditMode) requiredFields.push('password');

    requiredFields.forEach((field) => {
      const fieldValue = formData[field];
      if (fieldValue !== null && fieldValue !== undefined && !(fieldValue instanceof File)) {
        const error = validateField(field, fieldValue);
        if (error) newErrors[field] = error;
      }
    });

    if (formData.dateOfBirth) {
      const error = validateField('dateOfBirth', formData.dateOfBirth);
      if (error) newErrors.dateOfBirth = error;
    }

    return newErrors;
  };

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

    const newErrors = validateBasicInfo();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t('customer_modal.validation.check_info'));
      setLoading(false);
      return;
    }

    setErrors({});

    const payload = {
      username: formData.phone,
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
        .catch((error) => {
          console.error('Error submitting basic info:', error);
          toast.error('Có lỗi xảy ra khi lưu thông tin khách hàng');
        })
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

            if (statusCode === 409 || errorCode === 'MONGO_DUPLICATE_KEY' || errorCode === 'CONFLICT') {
              const errorMeta = errorResponse.error?.meta;
              if (errorMeta?.field) {
                setErrors((prev) => ({ ...prev, [errorMeta.field as keyof CustomerFormData]: errorMessage }));
                toast.error(errorMessage);
              } else {
                if (errorMessage.includes('email_1')) {
                  setErrors((prev) => ({ ...prev, email: 'Email đã tồn tại' }));
                  toast.error('Email đã tồn tại');
                } else if (errorMessage.includes('phoneNumber_1')) {
                  setErrors((prev) => ({ ...prev, phone: 'Số điện thoại đã tồn tại' }));
                  toast.error('Số điện thoại đã tồn tại');
                } else {
                  toast.error('Dữ liệu đã tồn tại trong hệ thống');
                }
              }
              setLoading(false);
              return;
            }

            toast.error(errorMessage);
            setLoading(false);
            return;
          }

          toast.success(t('customer_modal.success.create'));
          onCustomerUpdate?.();
          onClose();
        })
        .catch((error) => {
          console.error('Error submitting basic info:', error);
          toast.error('Có lỗi xảy ra khi lưu thông tin khách hàng');
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
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
                      onClick={() => setShowPassword((prev) => !prev)}
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
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t('customer_modal.notes')}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder={t('customer_modal.notes_placeholder')}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('customer_modal.close')}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading
                ? t('customer_modal.loading_data')
                : isEditMode
                  ? t('customer_modal.update')
                  : t('customer_modal.create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
