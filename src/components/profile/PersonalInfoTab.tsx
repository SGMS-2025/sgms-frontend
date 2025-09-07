import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { FormField } from './FormField';
import { useIsMobile } from '@/hooks/use-mobile';
import { User, Calendar as CalendarIcon, Phone, MapPin, Mail, Edit3, CheckCircle, Loader2 } from 'lucide-react';
import type { UpdateProfileData } from '@/types/api/User';

interface PersonalInfoTabProps {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isSaving: boolean;
  formData: UpdateProfileData;
  userData: {
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: string;
    address: string;
    bio: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleGenderChange: (value: string) => void;
  handleSaveProfile: () => Promise<void>;
  handleCancelEdit: () => void;
  setFormData: (data: UpdateProfileData) => void;
  validationErrors: Record<string, string>;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  isEditing,
  setIsEditing,
  isSaving,
  formData,
  userData,
  handleInputChange,
  handleGenderChange,
  handleSaveProfile,
  handleCancelEdit,
  setFormData,
  validationErrors
}) => {
  const isMobile = useIsMobile();

  return (
    <Card className="border-0 shadow-none rounded-t-none rounded-b-2xl" style={{ backgroundColor: '#F1F3F4' }}>
      <CardHeader className={`p-6 md:p-8 ${isMobile ? 'pb-4' : 'flex flex-row items-center justify-between pb-6'}`}>
        <CardTitle className="text-orange-600 text-xl md:text-2xl font-bold flex items-center">
          <User className="w-6 h-6 mr-3" />
          THÔNG TIN CÁ NHÂN
        </CardTitle>
        {isMobile && (
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
              className="text-orange-600 border-orange-200 hover:bg-orange-50 px-4 py-2 h-auto rounded-lg font-medium"
              disabled={isSaving}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? 'Hủy' : 'Sửa'}
            </Button>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="outline"
            onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
            className="text-orange-600 border-orange-200 hover:bg-orange-50 px-6 py-3 h-auto rounded-lg font-medium"
            disabled={isSaving}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6 p-6 md:p-8 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            id="name"
            label="Họ và tên"
            icon={User}
            value={formData.fullName || ''}
            placeholder="Nhập họ và tên của bạn"
            isEditing={isEditing}
            onChange={handleInputChange}
            error={validationErrors.fullName}
            required={true}
          />

          <div className="space-y-3">
            <Label
              htmlFor={isEditing ? 'birthDate' : undefined}
              className="flex items-center gap-2 text-gray-700 font-medium"
            >
              <CalendarIcon className="w-4 h-4 text-orange-500" />
              Ngày sinh
            </Label>
            {isEditing ? (
              <>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.dateOfBirth ? formData.dateOfBirth.split('/').reverse().join('-') : ''}
                  onChange={(e) => {
                    const date = e.target.value;
                    if (date) {
                      const [year, month, day] = date.split('-');
                      const formattedDate = `${day}/${month}/${year}`;
                      setFormData({
                        ...formData,
                        dateOfBirth: formattedDate
                      });
                    } else {
                      setFormData({
                        ...formData,
                        dateOfBirth: ''
                      });
                    }
                  }}
                  className={`bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg px-4 py-3 h-12 text-base font-medium ${
                    validationErrors.dateOfBirth ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  max={new Date().toISOString().split('T')[0]}
                  min="1900-01-01"
                />
                {validationErrors.dateOfBirth && (
                  <p className="text-red-500 text-sm font-medium flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {validationErrors.dateOfBirth}
                  </p>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 h-12 flex items-center">
                <p className="text-gray-900 font-medium">{userData.birthDate || 'Chưa cập nhật'}</p>
              </div>
            )}
          </div>

          <FormField
            id="phone"
            label="Số điện thoại"
            icon={Phone}
            value={formData.phoneNumber || ''}
            placeholder="Nhập số điện thoại (VD: 0123456789)"
            isEditing={isEditing}
            onChange={handleInputChange}
            error={validationErrors.phoneNumber}
          />

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <User className="w-4 h-4 text-orange-500" />
              Giới tính
            </Label>
            {isEditing ? (
              <RadioGroup
                value={(formData.gender || 'OTHER').toLowerCase()}
                onValueChange={handleGenderChange}
                className={`flex ${isMobile ? 'flex-col space-y-3' : 'gap-6'}`}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="female"
                    id="female"
                    className="accent-orange-500 border-orange-500 focus:ring-orange-500 focus:ring-2"
                    style={{ accentColor: '#FF6600' }}
                  />
                  <Label htmlFor="female" className="font-medium">
                    Nữ
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="male"
                    id="male"
                    className="accent-orange-500 border-orange-500 focus:ring-orange-500 focus:ring-2"
                    style={{ accentColor: '#FF6600' }}
                  />
                  <Label htmlFor="male" className="font-medium">
                    Nam
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="other"
                    id="other"
                    className="accent-orange-500 border-orange-500 focus:ring-orange-500 focus:ring-2"
                    style={{ accentColor: '#FF6600' }}
                  />
                  <Label htmlFor="other" className="font-medium">
                    Khác
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <div className="flex gap-3">
                <Badge
                  variant={userData.gender === 'female' ? 'default' : 'secondary'}
                  className={
                    userData.gender === 'female'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : 'bg-gray-100 text-gray-600'
                  }
                >
                  Nữ
                </Badge>
                <Badge
                  variant={userData.gender === 'male' ? 'default' : 'secondary'}
                  className={
                    userData.gender === 'male'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : 'bg-gray-100 text-gray-600'
                  }
                >
                  Nam
                </Badge>
                <Badge
                  variant={userData.gender === 'other' ? 'default' : 'secondary'}
                  className={
                    userData.gender === 'other'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : 'bg-gray-100 text-gray-600'
                  }
                >
                  Khác
                </Badge>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <FormField
              id="address"
              label="Địa chỉ"
              icon={MapPin}
              value={formData.address || ''}
              placeholder="Nhập địa chỉ của bạn"
              isEditing={isEditing}
              onChange={handleInputChange}
              error={validationErrors.address}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <Mail className="w-4 h-4 text-orange-500" />
              Email
            </Label>
            <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 h-12 flex items-center">
              <p className="text-gray-900 font-medium">{userData.email}</p>
            </div>
          </div>

          <div className="md:col-span-2">
            <FormField
              id="bio"
              label="Giới thiệu bản thân"
              icon={User}
              value={formData.bio || ''}
              placeholder="Chia sẻ một chút về bản thân bạn... (tối đa 500 ký tự)"
              isEditing={isEditing}
              onChange={handleInputChange}
              isTextarea={true}
              rows={4}
              error={validationErrors.bio}
            />
          </div>
        </div>

        {isEditing && (
          <div className={`flex ${isMobile ? 'flex-col' : ''} gap-3 pt-6 border-t border-gray-200`}>
            <Button
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transform hover:scale-105 transition-all duration-200 px-8 py-3 rounded-lg font-medium"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isMobile ? 'Đang lưu...' : 'Đang lưu thay đổi...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isMobile ? 'Lưu' : 'Lưu thay đổi'}
                </>
              )}
            </Button>
            {!isMobile && (
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="border-gray-200 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium"
              >
                Hủy
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
