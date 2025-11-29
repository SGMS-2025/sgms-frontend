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
  Camera,
  Shield,
  Sparkles,
  Clock3,
  ArrowRight,
  ShieldCheck,
  Link2,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/services/api/userApi';
import { authApi } from '@/services/api/authApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { UpdateProfileData, User as ApiUser, ProfileUserData } from '@/types/api/User';
import { validateFormData } from '@/utils/validation';
import { useAuthActions } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { FormField } from '@/components/profile/FormField';
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [isLinkingZalo, setIsLinkingZalo] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('personal');
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

  const profileFields = [
    { key: 'fullName', label: t('customer.profile.full_name'), value: formData.fullName },
    { key: 'phoneNumber', label: t('customer.profile.phone'), value: formData.phoneNumber },
    { key: 'address', label: t('customer.profile.address'), value: formData.address },
    { key: 'dateOfBirth', label: t('customer.profile.birth_date'), value: formData.dateOfBirth },
    { key: 'bio', label: t('customer.profile.bio'), value: formData.bio }
  ];

  const completedFields = profileFields.filter((field) => field.value && field.value.toString().trim());
  const profileCompletion = Math.round((completedFields.length / profileFields.length) * 100);
  const missingFields = profileFields.filter((field) => !field.value || !field.value.toString().trim());
  const memberSinceText = state.user?.createdAt
    ? new Date(state.user.createdAt).toLocaleDateString('vi-VN')
    : t('customer.profile.not_updated');
  const memberDurationText = state.user?.createdAt
    ? getMembershipDurationText(state.user.createdAt, t)
    : t('customer.profile.member');
  const hasZaloLinked = Boolean(state.user?.zaloUserId);

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

  const handleLinkZalo = () => {
    if (hasZaloLinked) return;
    try {
      setIsLinkingZalo(true);
      authApi.linkZaloAccount();
    } catch (error) {
      console.error('Failed to initiate Zalo linking:', error);
      toast.error(t('error.common'));
      setIsLinkingZalo(false);
    }
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
  const EditButton: React.FC<{ className?: string }> = ({ className }) => {
    const handleClick = isEditing ? handleCancelEdit : () => setIsEditing(true);
    const baseClasses = isEditing
      ? 'bg-white text-orange-600 border-white/60 hover:bg-white/90'
      : 'bg-white/10 text-white border-white/30 hover:bg-white/20';

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
        className={`backdrop-blur px-4 py-2 h-auto rounded-lg font-semibold shadow-sm ${baseClasses} ${className || ''}`}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-orange-500" />
          <span>{t('customer.profile.subtitle')}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md px-6 py-3 rounded-lg font-semibold"
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
              className="border-gray-200 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold"
            >
              {t('customer.profile.cancel')}
            </Button>
          )}
        </div>
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
    <div className="space-y-6 pb-28">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-600 text-white shadow-xl">
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_20%,#fef3c7,transparent_30%),radial-gradient(circle_at_80%_0%,#fb923c,transparent_25%)]" />
        <div className="absolute -right-24 -bottom-24 w-80 h-80 bg-white/10 blur-3xl rounded-full" />

        <div className="relative p-6 sm:p-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                <button
                  type="button"
                  className="relative cursor-pointer group bg-white/10 border border-white/20 p-1 rounded-full focus:outline-none focus:ring-4 focus:ring-white/30 transition"
                  onClick={handleAvatarClick}
                  aria-label={t('customer.profile.avatar_change')}
                  disabled={isUploading}
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-orange-500 rounded-full flex items-center justify-center relative overflow-hidden border-4 border-white/60 shadow-lg">
                    {userData.avatar ? (
                      <img src={userData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                        {getUserInitials(userData.name)}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition-all duration-300 transform group-hover:scale-105">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <div className="text-center">
                          <Camera className="w-6 h-6 text-white mx-auto mb-1" />
                          <span className="text-xs text-white font-medium">
                            {t('customer.profile.avatar_change_btn')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {userData.avatar && !isUploading && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full p-1 shadow-md bg-white/90 text-red-600 border border-white/40 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAvatar();
                      }}
                      disabled={isUploading}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('customer.profile.title')}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  {userData.name || t('customer.profile.not_updated')}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                  <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
                    {memberDurationText}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Clock3 className="w-4 h-4" />
                    {memberSinceText}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {userData.email}
                  </span>
                  {userData.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {userData.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setActiveTab('security')}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 px-4 py-2 h-auto rounded-lg font-semibold backdrop-blur"
              >
                <ShieldCheck className="w-4 h-4" />
                {t('customer.profile.security_login')}
              </Button>
              <EditButton className="bg-white text-orange-600 border-white/70 hover:bg-white/90" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4 flex items-start gap-3">
              <div className="rounded-xl bg-white/15 p-2">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-white/70">{t('customer.profile.profile_label')}</p>
                <p className="text-lg font-semibold">
                  {profileCompletion}% {t('customer.profile.complete')}
                </p>
                <p className="text-sm text-white/80">
                  {missingFields.length > 0
                    ? t('customer.profile.items_to_add', { count: missingFields.length })
                    : t('customer.profile.all_main_info_complete')}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4 flex items-start gap-3">
              <div className="rounded-xl bg-white/15 p-2">
                <Clock3 className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-white/70">{t('customer.profile.member_label')}</p>
                <p className="text-lg font-semibold">{memberDurationText}</p>
                <p className="text-sm text-white/80">
                  {t('customer.profile.from')} {memberSinceText}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4 flex items-start gap-3">
              <div className="rounded-xl bg-white/15 p-2">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-white/70">{t('customer.profile.contact')}</p>
                <p className="text-lg font-semibold">{userData.phone || t('customer.profile.not_updated')}</p>
                <p className="text-sm text-white/80 truncate">{userData.address || t('customer.profile.address')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4 flex items-start gap-3 text-left hover:bg-white/15 transition group"
            >
              <div className="rounded-xl bg-white/15 p-2">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs uppercase tracking-wide text-white/70">{t('customer.profile.security')}</p>
                <p className="text-lg font-semibold">{t('customer.profile.update_password')}</p>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  {t('customer.profile.open_security_settings')}{' '}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                {t('customer.profile.quick_overview')}
              </CardTitle>
              <p className="text-sm text-gray-600">{t('customer.profile.contact_personal_info')}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Mail, label: t('customer.profile.email'), value: userData.email },
                {
                  icon: Phone,
                  label: t('customer.profile.phone'),
                  value: userData.phone || t('customer.profile.not_updated')
                },
                {
                  icon: MapPin,
                  label: t('customer.profile.address'),
                  value: userData.address || t('customer.profile.address_placeholder')
                },
                {
                  icon: Calendar,
                  label: t('customer.profile.birth_date'),
                  value: userData.birthDate || t('customer.profile.not_updated')
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-lg border border-gray-100/80 bg-gray-50/60 px-3 py-2"
                >
                  <item.icon className="w-4 h-4 text-orange-500 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 break-words">{item.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500" />
                {t('customer.profile.profile_progress')}
              </CardTitle>
              <p className="text-sm text-gray-600">{t('customer.profile.profile_progress_description')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('customer.profile.completion_level')}</span>
                <span className="text-gray-900 font-semibold">{profileCompletion}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              {missingFields.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{t('customer.profile.missing_items')}</p>
                  <div className="flex flex-wrap gap-2">
                    {missingFields.map((field) => (
                      <Badge
                        key={field.key}
                        variant="secondary"
                        className="bg-orange-50 text-orange-700 border-orange-100"
                      >
                        {field.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  {t('customer.profile.profile_complete')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-orange-500" />
                {t('customer.profile.zalo_account')}
              </CardTitle>
              <p className="text-sm text-gray-600">{t('customer.profile.zalo_account_description')}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{t('customer.profile.status')}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        hasZaloLinked
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : 'bg-orange-50 text-orange-700 border border-orange-100'
                      }`}
                    >
                      {hasZaloLinked ? (
                        <>
                          <Check className="w-4 h-4" /> {t('customer.profile.linked')}
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" /> {t('customer.profile.not_linked')}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 rounded-md bg-white border border-dashed border-gray-200 px-3 py-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{userData.email || t('customer.profile.email')}</span>
                  </div>
                  <p className="text-xs text-gray-500">{t('customer.profile.zalo_connect_description')}</p>
                </div>
                <Button
                  variant={hasZaloLinked ? 'secondary' : 'default'}
                  className={`w-full justify-center ${hasZaloLinked ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                  onClick={handleLinkZalo}
                  disabled={hasZaloLinked || isLinkingZalo}
                >
                  {hasZaloLinked
                    ? t('customer.profile.linked')
                    : isLinkingZalo
                      ? t('auth.sending')
                      : t('customer.profile.link_zalo')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
            <TabsList className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl p-1 flex">
              <TabsTrigger
                value="personal"
                className="flex-1 rounded-xl px-4 py-3 text-base font-semibold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
              >
                <User className="w-4 h-4" />
                <span>{isMobile ? t('customer.profile.personal') : t('customer.profile.personal_info_tab')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex-1 rounded-xl px-4 py-3 text-base font-semibold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
              >
                <Shield className="w-4 h-4" />
                <span>{isMobile ? t('customer.profile.security') : t('customer.profile.security_password')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-2">
              <Card className="border border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/80 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">{t('customer.profile.subtitle')}</p>
                      <CardTitle className="text-xl text-gray-900">{t('customer.profile.personal_info')}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={
                          isEditing
                            ? 'bg-orange-100 text-orange-700 border-orange-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }
                      >
                        {isEditing ? t('customer.profile.editing') : t('customer.profile.saved')}
                      </Badge>
                      <EditButton className="bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8 pt-6">
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
                </CardContent>

                {isEditing && (
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                    <SaveActions />
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-2">
              <Card className="border border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/80 border-b border-gray-100">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    {t('customer.profile.change_password')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChangePasswordForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
