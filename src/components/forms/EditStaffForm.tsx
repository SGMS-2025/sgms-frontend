import { useState } from 'react';
import { User, Building2, Phone, MapPin, Calendar, Shield, DollarSign, Save, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useBranch } from '@/contexts/BranchContext';
import { useUser } from '@/hooks/useAuth';
import type { StaffFormData, StaffStatus, StaffJobTitle } from '@/types/api/Staff';
import {
  validateFullName,
  validatePhoneNumberEdit,
  validateAddressEdit,
  validateEmail,
  validateJobTitle,
  validateSalaryEdit,
  validateBranchId,
  validateDateOfBirthStaff
} from '@/utils/validation';

interface EditStaffFormProps {
  formData: StaffFormData;
  onInputChange: (field: keyof StaffFormData, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  t: (key: string) => string;
  loading?: boolean;
  currentBranchName?: string;
}

export default function EditStaffForm({
  formData,
  onInputChange,
  onSave,
  onCancel,
  t,
  loading = false,
  currentBranchName
}: EditStaffFormProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { branches, loading: branchesLoading } = useBranch();
  const currentUser = useUser();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onInputChange('dateOfBirth', formattedDate);
      setDatePickerOpen(false);
      validateField('dateOfBirth', formattedDate);
    }
  };

  // Validation functions
  const validateField = (fieldName: string, value: string) => {
    let validation;

    switch (fieldName) {
      case 'fullName':
        validation = validateFullName(value);
        break;
      case 'phoneNumber':
        validation = validatePhoneNumberEdit(value);
        break;
      case 'address':
        validation = validateAddressEdit(value);
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'jobTitle':
        validation = validateJobTitle(value);
        break;
      case 'salary':
        validation = validateSalaryEdit(value);
        break;
      case 'branchId':
        validation = validateBranchId(value);
        break;
      case 'dateOfBirth':
        validation = validateDateOfBirthStaff(value);
        break;
      default:
        return;
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: validation.isValid ? '' : validation.error || ''
    }));
  };

  const handleInputChange = (field: keyof StaffFormData, value: string) => {
    onInputChange(field, value);
    validateField(field, value);
  };

  const validateAllFields = () => {
    const newErrors: Record<string, string> = {};

    // Validate all fields
    const fullNameValidation = validateFullName(formData.fullName || '');
    if (!fullNameValidation.isValid) {
      newErrors.fullName = fullNameValidation.error || '';
    }

    const phoneValidation = validatePhoneNumberEdit(formData.phoneNumber || '');
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber = phoneValidation.error || '';
    }

    const addressValidation = validateAddressEdit(formData.address || '');
    if (!addressValidation.isValid) {
      newErrors.address = addressValidation.error || '';
    }

    const emailValidation = validateEmail(formData.email || '');
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || '';
    }

    const jobTitleValidation = validateJobTitle(formData.jobTitle || '');
    if (!jobTitleValidation.isValid) {
      newErrors.jobTitle = jobTitleValidation.error || '';
    }

    const salaryValidation = validateSalaryEdit(formData.salary || '');
    if (!salaryValidation.isValid) {
      newErrors.salary = salaryValidation.error || '';
    }

    const branchValidation = validateBranchId(formData.branchId || '');
    if (!branchValidation.isValid) {
      newErrors.branchId = branchValidation.error || '';
    }

    const dobValidation = validateDateOfBirthStaff(formData.dateOfBirth || '');
    if (!dobValidation.isValid) {
      newErrors.dateOfBirth = dobValidation.error || '';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateAllFields()) {
      onSave();
    }
  };

  const selectedDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined;
  const canEditBranch = currentUser?.role === 'OWNER';
  // const canSelectManagerRole = currentUser?.role !== 'MANAGER';

  // Find the current branch name for display
  const currentBranch = branches.find((branch) => branch._id === formData.branchId);

  // Use currentBranchName prop if available, otherwise use found branch name
  const displayBranchName = currentBranchName || currentBranch?.branchName;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-orange-500">{t('staff_modal.edit_profile').toUpperCase()}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-transparent text-red-600 border-red-600 hover:bg-red-50"
            onClick={onCancel}
            disabled={loading}
          >
            <XCircle className="w-4 h-4" />
            {t('staff_modal.cancel')}
          </Button>
          <Button
            className="flex items-center gap-2 bg-[#f05a29] hover:bg-[#df4615] text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? t('staff_modal.saving') : t('staff_modal.save')}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Row 1: Full name, Date of birth, Gender */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.full_name')}</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={cn(
                'bg-white border-gray-200 focus:border-orange-500',
                errors.fullName && 'border-red-500 focus:border-red-500'
              )}
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.date_of_birth')}</span>
            </Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal bg-white border-gray-200 hover:bg-gray-50 focus:border-orange-500',
                    !selectedDate && 'text-muted-foreground',
                    errors.dateOfBirth && 'border-red-500 focus:border-red-500'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: vi }) : t('staff_modal.select_date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
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
            {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <Label htmlFor="gender" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.gender')}</span>
            </Label>
            <Select value={formData.gender} onValueChange={(value) => onInputChange('gender', value)}>
              <SelectTrigger className="bg-white border-gray-200 focus:border-orange-500">
                <SelectValue placeholder={t('staff_modal.select_gender')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">{t('staff_modal.gender_male')}</SelectItem>
                <SelectItem value="FEMALE">{t('staff_modal.gender_female')}</SelectItem>
                <SelectItem value="OTHER">{t('staff_modal.gender_other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Phone number, Address */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="phoneNumber" className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.phone_number')}</span>
            </Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={cn(
                'bg-white border-gray-200 focus:border-orange-500',
                errors.phoneNumber && 'border-red-500 focus:border-red-500'
              )}
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1 break-words">{errors.phoneNumber}</p>}
          </div>

          <div className="col-span-2">
            <Label htmlFor="address" className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.address')}</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={cn(
                'bg-white border-gray-200 focus:border-orange-500',
                errors.address && 'border-red-500 focus:border-red-500'
              )}
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>
        </div>

        {/* Row 3: Email, Role, Salary */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="email" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.email')}</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={cn(
                'bg-white border-gray-200 focus:border-orange-500',
                errors.email && 'border-red-500 focus:border-red-500'
              )}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="salary" className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.salary')}</span>
            </Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary}
              onChange={(e) => handleInputChange('salary', e.target.value)}
              className={cn(
                'bg-white border-gray-200 focus:border-orange-500',
                errors.salary && 'border-red-500 focus:border-red-500'
              )}
            />
            {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
          </div>

          <div>
            <Label htmlFor="jobTitle" className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.role')}</span>
            </Label>
            <Select
              value={formData.jobTitle}
              onValueChange={(value) => handleInputChange('jobTitle', value as StaffJobTitle)}
            >
              <SelectTrigger
                className={cn(
                  'bg-white border-gray-200 focus:border-orange-500',
                  errors.jobTitle && 'border-red-500 focus:border-red-500'
                )}
              >
                <SelectValue placeholder={t('staff_modal.select_role')} />
              </SelectTrigger>
              <SelectContent>
                {/* {canSelectManagerRole && <SelectItem value="Manager">{t('staff_modal.role_manager')}</SelectItem>} */}
                <SelectItem value="Personal Trainer">{t('staff_modal.role_personal_trainer')}</SelectItem>
                <SelectItem value="Technician">{t('staff_modal.role_technician')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.jobTitle && <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>}
          </div>
        </div>

        {/* Row 4: Branch, Status */}
        <div className="flex gap-6">
          <div>
            <Label htmlFor="branchName" className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.branch')}</span>
            </Label>
            {canEditBranch ? (
              <Select
                value={formData.branchId}
                onValueChange={(value) => handleInputChange('branchId', value)}
                disabled={branchesLoading}
              >
                <SelectTrigger
                  className={cn(
                    'bg-white border-gray-200 focus:border-orange-500',
                    errors.branchId && 'border-red-500 focus:border-red-500'
                  )}
                >
                  <SelectValue
                    placeholder={branchesLoading ? t('staff_modal.loading_branches') : t('staff_modal.select_branch')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-gray-700">
                {displayBranchName || t('staff_modal.no_branch_selected')}
              </div>
            )}
            {errors.branchId && <p className="text-red-500 text-sm mt-1">{errors.branchId}</p>}
            {!canEditBranch && <p className="text-xs text-gray-500 mt-1">{t('staff_modal.branch_edit_restriction')}</p>}
          </div>

          <div>
            <Label htmlFor="status" className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.status')}</span>
            </Label>
            <Select value={formData.status} onValueChange={(value) => onInputChange('status', value as StaffStatus)}>
              <SelectTrigger className="bg-white border-gray-200 focus:border-orange-500">
                <SelectValue placeholder={t('staff_modal.select_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t('staff_modal.status_active')}</SelectItem>
                <SelectItem value="INACTIVE">{t('staff_modal.status_inactive')}</SelectItem>
                <SelectItem value="SUSPENDED">{t('staff_modal.status_suspended')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
