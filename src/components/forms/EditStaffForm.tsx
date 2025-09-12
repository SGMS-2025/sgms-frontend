import { useState } from 'react';
import { User, Building2, Phone, MapPin, Calendar, Shield, DollarSign, Save, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { StaffFormData, StaffStatus, StaffJobTitle } from '@/types/api/Staff';

interface EditStaffFormProps {
  formData: StaffFormData;
  onInputChange: (field: keyof StaffFormData, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}

export default function EditStaffForm({ formData, onInputChange, onSave, onCancel, t }: EditStaffFormProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onInputChange('dateOfBirth', formattedDate);
      setDatePickerOpen(false);
    }
  };

  const selectedDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-orange-500">{t('staff_modal.edit_profile').toUpperCase()}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-transparent text-red-600 border-red-600 hover:bg-red-50"
            onClick={onCancel}
          >
            <XCircle className="w-4 h-4" />
            {t('staff_modal.cancel')}
          </Button>
          <Button className="flex items-center gap-2 bg-[#f05a29] hover:bg-[#df4615] text-white" onClick={onSave}>
            <Save className="w-4 h-4" />
            {t('staff_modal.save')}
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
              onChange={(e) => onInputChange('fullName', e.target.value)}
              className="bg-white border-gray-200 focus:border-orange-500"
            />
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
                    !selectedDate && 'text-muted-foreground'
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
                />
              </PopoverContent>
            </Popover>
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
        <div className="flex gap-4">
          <div>
            <Label htmlFor="phoneNumber" className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.phone_number')}</span>
            </Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => onInputChange('phoneNumber', e.target.value)}
              className="bg-white border-gray-200 focus:border-orange-500 w-40"
            />
          </div>

          <div className="flex-1">
            <Label htmlFor="address" className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.address')}</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              className="bg-white border-gray-200 focus:border-orange-500"
            />
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
              onChange={(e) => onInputChange('email', e.target.value)}
              className="bg-white border-gray-200 focus:border-orange-500"
            />
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
              onChange={(e) => onInputChange('salary', e.target.value)}
              className="bg-white border-gray-200 focus:border-orange-500"
            />
          </div>

          <div>
            <Label htmlFor="jobTitle" className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.role')}</span>
            </Label>
            <Select
              value={formData.jobTitle}
              onValueChange={(value) => onInputChange('jobTitle', value as StaffJobTitle)}
            >
              <SelectTrigger className="bg-white border-gray-200 focus:border-orange-500">
                <SelectValue placeholder={t('staff_modal.select_role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manager">{t('staff_modal.role_manager')}</SelectItem>
                <SelectItem value="Admin">{t('staff_modal.role_admin')}</SelectItem>
                <SelectItem value="Owner">{t('staff_modal.role_owner')}</SelectItem>
                <SelectItem value="Personal Trainer">{t('staff_modal.role_personal_trainer')}</SelectItem>
                <SelectItem value="Technician">{t('staff_modal.role_technician')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 4: Branch name, Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="branchName" className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.branch_name')}</span>
            </Label>
            <Input
              id="branchName"
              value={formData.branchName}
              onChange={(e) => onInputChange('branchName', e.target.value)}
              className="bg-white border-gray-200 focus:border-orange-500"
            />
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
