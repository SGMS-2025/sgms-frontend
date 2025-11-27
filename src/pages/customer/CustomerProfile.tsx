import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Edit3,
  CheckCircle,
  Loader2,
  AlertCircle,
  LogIn,
  Trash2,
  Camera
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/services/api/userApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { UpdateProfileData, User as ApiUser, ProfileUserData } from '@/types/api/User';
import { validateFormData } from '@/utils/validation';
import { useAuthActions } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { FormField } from '@/components/profile/FormField';
import { ZaloAccountSection } from '@/components/profile/ZaloAccountSection';
import {
  formatDateToVietnamese,
  normalizeGenderForApi,
  prepareFormDataForApi,
  getUserInitials,
  getMembershipDurationText
} from '@/utils/customerProfileUtils';

const CustomerProfile: React.FC = () => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { state } = useAuth();
  const { updateUser } = useAuthActions();
  const isMobile = useIsMobile();

  // Ref cho file input avatar
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data for editing
  const [formData, setFormData] = useState<UpdateProfileData>({
    fullName: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    gender: 'OTHER',
    bio: ''
  });

  // User data
  const [userData, setUserData] = useState<ProfileUserData>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'OTHER',
    address: '',
    bio: '',
    avatar: ''
  });

  // Extract user data mapping logic
  const mapUserDataFromResponse = (responseData: ApiUser) => {
    const birthDate = responseData.dateOfBirth ? formatDateToVietnamese(responseData.dateOfBirth as string) : '';

    setUserData({
      name: responseData.fullName || '',
      email: responseData.email || '',
      phone: responseData.phoneNumber || '',
      birthDate,
      gender: (responseData.gender || 'OTHER').toLowerCase(),
      address: responseData.address || '',
      bio: responseData.bio || '',
      avatar: responseData.avatar?.url || ''
    });

    setFormData({
      fullName: responseData.fullName || '',
      phoneNumber: responseData.phoneNumber || '',
      address: responseData.address || '',
      dateOfBirth: birthDate,
      gender: normalizeGenderForApi(responseData.gender || 'OTHER'),
      bio: responseData.bio || ''
    });
  };

  // Load user data from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);

      if (!state.isAuthenticated || !state.user) {
        setIsLoading(false);
        return;
      }

      const response = await userApi.getProfile();
      if (response.success && response.data) {
        mapUserDataFromResponse(response.data);
      }

      setIsLoading(false);
    };

    if (state.user?._id) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [state.user?._id, state.isAuthenticated, state.user]);

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;

    // Map form field IDs to API field names
    const fieldMapping: Record<string, keyof UpdateProfileData> = {
      name: 'fullName',
      phone: 'phoneNumber',
      birthDate: 'dateOfBirth',
      address: 'address',
      bio: 'bio'
    };

    const fieldName = fieldMapping[id] || id;
    const updatedFormData = {
      ...formData,
      [fieldName]: value
    };

    setFormData(updatedFormData);

    // Clear validation error for this field when user starts typing
    if (validationErrors[fieldName]) {
      setValidationErrors({
        ...validationErrors,
        [fieldName]: ''
      });
    }
  };

  // Handle radio change for gender
  const handleGenderChange = (value: string) => {
    setFormData({
      ...formData,
      gender: value.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER'
    });
  };

  // Handle date change for birth date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      // Convert YYYY-MM-DD to DD/MM/YYYY using utility
      const formattedDate = formatDateToVietnamese(date);
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
  };

  // Handle form submission
  const handleSaveProfile = async () => {
    // Validate form data
    const validation = validateFormData(formData);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error(t('customer.profile.validation_error'));
      return;
    }

    // Clear validation errors if all valid
    setValidationErrors({});
    setIsSaving(true);

    // Prepare form data for API using utility function
    const profileData = prepareFormDataForApi(formData);

    const response = await userApi.updateProfile(profileData);

    if (response.success && response.data) {
      // Update local state with new data using utility function
      const birthDate = response.data.dateOfBirth ? formatDateToVietnamese(response.data.dateOfBirth) : '';

      setUserData({
        name: response.data.fullName || '',
        email: response.data.email || '',
        phone: response.data.phoneNumber || '',
        birthDate,
        gender: response.data.gender?.toLowerCase() || 'other',
        address: response.data.address || '',
        bio: response.data.bio || '',
        avatar: response.data.avatar?.url || ''
      });

      // Update AuthContext with new user data
      updateUser(response.data);

      toast.success(t('customer.profile.update_success'));
      setIsEditing(false);
    }

    setIsSaving(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // Reset form data to current user data
    setFormData({
      fullName: userData.name,
      phoneNumber: userData.phone,
      address: userData.address,
      dateOfBirth: userData.birthDate,
      gender: userData.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
      bio: userData.bio
    });
    // Clear validation errors
    setValidationErrors({});
    setIsEditing(false);
  };

  //  validate file before upload
  const validateFile = (file: File): string | null => {
    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      return t('customer.profile.file_type_error');
    }

    //  5MB size limit
    if (file.size > 5 * 1024 * 1024) {
      return t('customer.profile.file_size_error');
    }

    return null;
  };

  // Bước 2: Upload avatar to server
  const uploadAvatar = async (file: File) => {
    setIsUploading(true);

    const response = await userApi.uploadAvatar(file);

    if (response.success && response.data) {
      // update local state with new avatar URL
      setUserData((prev) => ({
        ...prev,
        avatar: response.data.avatar?.url || ''
      }));

      // update AuthContext with new user data
      updateUser(response.data);

      toast.success(t('customer.profile.avatar_upload_success'));
    } else {
      console.error('Failed to upload avatar:', response.message);
      toast.error(t('customer.profile.avatar_upload_error'));
    }

    setIsUploading(false); // end loading
  };

  // Bước 3: Reset file input after upload
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Bước 4: process user pick file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file before upload
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      resetFileInput();
      return;
    }

    // Upload file
    await uploadAvatar(file);
    resetFileInput();
  };

  //  Trigger click avatar
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  //  delete avatar
  const handleDeleteAvatar = async () => {
    if (!userData.avatar) return;

    setIsUploading(true);

    const response = await userApi.deleteAvatar();

    if (response.success && response.data) {
      setUserData((prev) => ({
        ...prev,
        avatar: ''
      }));

      updateUser(response.data);
      toast.success(t('customer.profile.avatar_delete_success'));
    } else {
      console.error('Failed to delete avatar:', response.message);
      toast.error(t('customer.profile.avatar_delete_error'));
    }

    setIsUploading(false);
  };

  // Loading screen component
  const renderLoadingScreen = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin"></div>
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="text-gray-600 font-medium mt-6 text-lg">{t('customer.profile.loading')}</p>
    </div>
  );

  // Login prompt component
  const renderLoginPrompt = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('customer.profile.not_logged_in')}</h2>
        <p className="text-gray-600 mb-8">{t('customer.profile.login_prompt')}</p>
        <Button
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transform hover:scale-105 transition-all duration-200 px-8 py-3 text-lg"
          onClick={() => (window.location.href = '/login')}
        >
          <LogIn className="w-5 h-5 mr-2" />
          {t('customer.profile.login_now')}
        </Button>
      </div>
    </div>
  );

  // Gender field component
  const GenderField: React.FC = () => {
    const genderOptions = [
      { value: 'female', label: t('customer.profile.gender_female'), id: 'female' },
      { value: 'male', label: t('customer.profile.gender_male'), id: 'male' },
      { value: 'other', label: t('customer.profile.gender_other'), id: 'other' }
    ];

    const getBadgeVariant = (gender: string) => {
      return userData.gender === gender ? 'default' : 'secondary';
    };

    const getBadgeClassName = (gender: string) => {
      return userData.gender === gender
        ? 'bg-orange-100 text-orange-800 border-orange-200'
        : 'bg-gray-100 text-gray-600';
    };

    return (
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-gray-700 font-medium">
          <User className="w-4 h-4 text-orange-500" />
          {t('customer.profile.gender')}
        </Label>
        {isEditing ? (
          <RadioGroup
            value={(formData.gender || 'OTHER').toLowerCase()}
            onValueChange={handleGenderChange}
            className={`flex ${isMobile ? 'flex-col space-y-3' : 'gap-6'}`}
          >
            {genderOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={option.id}
                  className="accent-orange-500 border-orange-500 focus:ring-orange-500 focus:ring-2"
                  style={{ accentColor: '#FF6600' }}
                />
                <Label htmlFor={option.id} className="font-medium">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="flex gap-3">
            {genderOptions.map((option) => (
              <Badge
                key={option.value}
                variant={getBadgeVariant(option.value)}
                className={getBadgeClassName(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Birth date field component
  const BirthDateField: React.FC = () => {
    return (
      <div className="space-y-3">
        <Label
          htmlFor={isEditing ? 'birthDate' : undefined}
          className="flex items-center gap-2 text-gray-700 font-medium"
        >
          <Calendar className="w-4 h-4 text-orange-500" />
          {t('customer.profile.birth_date')}
        </Label>
        {isEditing ? (
          <>
            <Input
              id="birthDate"
              type="date"
              value={formData.dateOfBirth ? formData.dateOfBirth.split('/').reverse().join('-') : ''}
              onChange={handleDateChange}
              className={`bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg px-4 py-3 h-12 text-base font-medium ${
                validationErrors.dateOfBirth ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              max={new Date().toISOString().split('T')[0]}
              min="1900-01-01"
            />
            {validationErrors.dateOfBirth && (
              <p className="text-red-500 text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {validationErrors.dateOfBirth}
              </p>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 h-12 flex items-center">
            <p className="text-gray-900 font-medium">{userData.birthDate || t('customer.profile.not_updated')}</p>
          </div>
        )}
      </div>
    );
  };

  // Email field component (readonly)
  const EmailField: React.FC = () => (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-gray-700 font-medium">
        <Mail className="w-4 h-4 text-orange-500" />
        {t('customer.profile.email')}
      </Label>
      <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 h-12 flex items-center">
        <p className="text-gray-900 font-medium">{userData.email}</p>
      </div>
    </div>
  );

  // Edit buttons
  const EditButton: React.FC = () => {
    const handleClick = isEditing ? handleCancelEdit : () => setIsEditing(true);

    const getButtonText = () => {
      if (isEditing) {
        return isMobile ? t('customer.profile.cancel') : t('customer.profile.cancel_edit');
      }
      return isMobile ? t('customer.profile.edit') : t('customer.profile.edit_profile');
    };

    return (
      <Button
        variant="outline"
        size={isMobile ? 'sm' : 'default'}
        onClick={handleClick}
        className="text-orange-600 border-orange-200 hover:bg-orange-50 px-4 py-2 h-auto rounded-lg font-medium"
        disabled={isSaving}
      >
        <Edit3 className="w-4 h-4 mr-2" />
        {getButtonText()}
      </Button>
    );
  };

  // Save actions
  const SaveActions: React.FC = () => {
    if (!isEditing) return null;

    return (
      <div className={`flex ${isMobile ? 'flex-col' : ''} gap-3 pt-6 border-t border-gray-200`}>
        <Button
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transform hover:scale-105 transition-all duration-200 px-8 py-3 rounded-lg font-medium"
          onClick={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isMobile ? t('customer.profile.saving') : t('customer.profile.saving_changes')}
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {isMobile ? t('customer.profile.save') : t('customer.profile.save_changes')}
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
            {t('customer.profile.cancel')}
          </Button>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return renderLoadingScreen();
  }

  // Not authenticated state
  if (!state.isAuthenticated) {
    return renderLoginPrompt();
  }

  return (
    <div className="space-y-6 pb-32">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('customer.profile.title')}</h1>
        <p className="text-gray-600 mt-2">{t('customer.profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Overview */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">{t('customer.profile.overview')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {/* 🎨 AVATAR UPLOAD COMPONENT */}
              <div className="relative">
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                {/* Clickable Avatar */}
                <button
                  type="button"
                  className="relative cursor-pointer group bg-transparent border-0 p-0 focus:outline-none focus:ring-4 focus:ring-orange-200 rounded-full"
                  onClick={handleAvatarClick}
                  aria-label={t('customer.profile.avatar_change')}
                  disabled={isUploading}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-500 rounded-full flex items-center justify-center relative overflow-hidden border-4 border-white shadow-lg">
                    {userData.avatar ? (
                      <img src={userData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-orange-500 flex items-center justify-center text-white text-xl font-bold">
                        {getUserInitials(userData.name)}
                      </div>
                    )}

                    {/* Upload Overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition-all duration-300 transform group-hover:scale-105">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <div className="text-center">
                          <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white mx-auto mb-1" />
                          <span className="text-xs text-white font-medium">
                            {t('customer.profile.avatar_change_btn')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete button - chỉ hiện khi có avatar */}
                  {userData.avatar && !isUploading && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn click event bubble lên avatar
                        handleDeleteAvatar();
                      }}
                      disabled={isUploading}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                </button>
              </div>
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold">
                  {userData.name || t('customer.profile.not_updated')}
                </h3>
                <p className="text-sm text-gray-500">{t('customer.profile.member')}</p>
                <p className="text-xs text-gray-400">
                  {state.user?.createdAt
                    ? `${t('customer.profile.member_duration')} ${getMembershipDurationText(state.user.createdAt, t)}`
                    : `${t('customer.profile.member_since')} ${new Date().getFullYear()}`}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{userData.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{userData.phone || t('customer.profile.not_updated')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{userData.address || t('customer.profile.not_updated')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>
                  {t('customer.profile.born')}: {userData.birthDate || t('customer.profile.not_updated')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="xl:col-span-2">
          <CardHeader className={`${isMobile ? 'pb-4' : 'flex flex-row items-center justify-between pb-6'}`}>
            <CardTitle className="text-lg sm:text-xl">{t('customer.profile.personal_info')}</CardTitle>

            {isMobile && (
              <div className="flex justify-end mt-4">
                <EditButton />
              </div>
            )}

            {!isMobile && <EditButton />}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                id="name"
                label={t('customer.profile.full_name')}
                icon={User}
                value={formData.fullName || ''}
                placeholder={t('customer.profile.full_name_placeholder')}
                isEditing={isEditing}
                onChange={handleInputChange}
                error={validationErrors.fullName}
                required={true}
              />

              <BirthDateField />

              <FormField
                id="phone"
                label={t('customer.profile.phone')}
                icon={Phone}
                value={formData.phoneNumber || ''}
                placeholder={t('customer.profile.phone_placeholder')}
                isEditing={isEditing}
                onChange={handleInputChange}
                error={validationErrors.phoneNumber}
              />

              <GenderField />

              <div className="md:col-span-2">
                <FormField
                  id="address"
                  label={t('customer.profile.address')}
                  icon={MapPin}
                  value={formData.address || ''}
                  placeholder={t('customer.profile.address_placeholder')}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                  error={validationErrors.address}
                />
              </div>

              <div className="md:col-span-2">
                <EmailField />
              </div>

              <div className="md:col-span-2">
                <FormField
                  id="bio"
                  label={t('customer.profile.bio')}
                  icon={User}
                  value={formData.bio || ''}
                  placeholder={t('customer.profile.bio_placeholder')}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                  isTextarea={true}
                  rows={4}
                  error={validationErrors.bio}
                />
              </div>
            </div>

            <SaveActions />
          </CardContent>
        </Card>
      </div>

      {/* Zalo Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{t('customer.profile.security_settings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ZaloAccountSection />
        </CardContent>
      </Card>

      {/* Extra space to ensure scroll works */}
      <div className="h-20 sm:h-8"></div>
    </div>
  );
};

export default CustomerProfile;
