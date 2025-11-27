import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthActions } from '@/hooks/useAuth';
import { userApi } from '@/services/api/userApi';
import { authApi } from '@/services/api/authApi';
import { validateFormData } from '@/utils/validation';
import { validateChangePasswordForm } from '@/utils/authValidation';
import type { ProfileUserData, UpdateProfileData, User as ApiUser } from '@/types/api/User';
import { CalendarDays, CheckCircle2, Shield } from 'lucide-react';

const roleLabelMap: Record<string, string> = {
  OWNER: 'Chủ phòng',
  STAFF: 'Nhân viên',
  ADMIN: 'Quản trị viên',
  CUSTOMER: 'Khách hàng'
};

const statusLabelMap: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Tạm dừng',
  SUSPENDED: 'Bị khóa'
};

const formatIsoToVietnamese = (isoDate: string) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return '';
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

const formatVietnameseToIso = (vnDate: string) => {
  if (!vnDate) return '';
  const parts = vnDate.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const useProfileData = () => {
  const { t } = useTranslation();
  const { state } = useAuth();
  const { updateUser } = useAuthActions();

  const initialIsoDob = state.user?.dateOfBirth ? new Date(state.user.dateOfBirth).toISOString().split('T')[0] : '';
  const initialGender = (state.user?.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'OTHER';

  const [profile, setProfile] = useState<ApiUser | null>(state.user ?? null);
  const [userData, setUserData] = useState<ProfileUserData>({
    name: state.user?.fullName || state.user?.username || '',
    email: state.user?.email || '',
    phone: state.user?.phoneNumber || '',
    birthDate: initialIsoDob ? new Date(initialIsoDob).toLocaleDateString('vi-VN') : '',
    gender: (state.user?.gender || 'OTHER').toLowerCase(),
    address: state.user?.address || '',
    bio: state.user?.bio || '',
    avatar: state.user?.avatar?.url || ''
  });
  const [formData, setFormData] = useState<UpdateProfileData>({
    fullName: state.user?.fullName || '',
    phoneNumber: state.user?.phoneNumber || '',
    address: state.user?.address || '',
    dateOfBirth: initialIsoDob ? formatIsoToVietnamese(initialIsoDob) : '',
    gender: initialGender,
    bio: state.user?.bio || ''
  });
  const [dateInputValue, setDateInputValue] = useState(initialIsoDob);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const mapUserDataFromResponse = (responseData: ApiUser) => {
    const isoDob = responseData.dateOfBirth ? new Date(responseData.dateOfBirth).toISOString().split('T')[0] : '';
    const formattedDob = isoDob ? formatIsoToVietnamese(isoDob) : '';
    setUserData({
      name: responseData.fullName || responseData.username || '',
      email: responseData.email || '',
      phone: responseData.phoneNumber || '',
      birthDate: isoDob ? new Date(isoDob).toLocaleDateString('vi-VN') : '',
      gender: (responseData.gender || 'OTHER').toLowerCase(),
      address: responseData.address || '',
      bio: responseData.bio || '',
      avatar: responseData.avatar?.url || ''
    });

    setFormData({
      fullName: responseData.fullName || '',
      phoneNumber: responseData.phoneNumber || '',
      address: responseData.address || '',
      dateOfBirth: formattedDob,
      gender: ['MALE', 'FEMALE', 'OTHER'].includes((responseData.gender || 'OTHER') as string)
        ? (responseData.gender as 'MALE' | 'FEMALE' | 'OTHER')
        : 'OTHER',
      bio: responseData.bio || ''
    });

    setDateInputValue(isoDob);
    setProfile(responseData);
  };

  useEffect(() => {
    let mounted = true;
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await userApi.getProfile();
        if (response.success && response.data && mounted) {
          mapUserDataFromResponse(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile data', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (state.isAuthenticated) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [state.isAuthenticated]);

  const handleFieldChange = (field: keyof UpdateProfileData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDateChange = (value: string) => {
    setDateInputValue(value);
    const formatted = value ? formatIsoToVietnamese(value) : '';
    handleFieldChange('dateOfBirth', formatted);
  };

  const handleSaveProfile = async () => {
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Vui lòng kiểm tra lại thông tin hồ sơ');
      return;
    }

    setIsSaving(true);
    const profileData = {
      ...formData,
      dateOfBirth: formatVietnameseToIso(formData.dateOfBirth || '')
    };

    const response = await userApi.updateProfile(profileData);
    if (response.success && response.data) {
      mapUserDataFromResponse(response.data);
      updateUser(response.data);
      toast.success('Hồ sơ đã được cập nhật');
    }

    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    if (profile) {
      mapUserDataFromResponse(profile);
    }
    setValidationErrors({});
  };

  const handleDeleteAvatar = async () => {
    setIsUploading(true);
    const response = await userApi.deleteAvatar();
    if (response.success && response.data) {
      mapUserDataFromResponse(response.data);
      updateUser(response.data);
      toast.success('Ảnh đại diện đã được xóa');
    }
    setIsUploading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateChangePasswordForm(passwordForm);
    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(t(`error.${error}`)));
      return;
    }

    setIsChangingPassword(true);
    const response = await authApi.changePassword(passwordForm);
    if (response.success) {
      toast.success('Đổi mật khẩu thành công');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    }
    setIsChangingPassword(false);
  };

  const roleLabel = useMemo(
    () => (profile?.role ? roleLabelMap[profile.role] || profile.role : 'Chưa cập nhật'),
    [profile]
  );
  const statusLabel = useMemo(
    () => (profile?.status ? statusLabelMap[profile.status] || profile.status : 'Chưa cập nhật'),
    [profile]
  );
  const joinedAt = useMemo(
    () => (profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'),
    [profile?.createdAt]
  );
  const lastUpdated = useMemo(
    () => (profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString('vi-VN') : 'Chưa cập nhật'),
    [profile?.updatedAt]
  );
  const branchLabel = useMemo(() => {
    if (!profile?.customer?.branchId) return 'Chưa liên kết chi nhánh';
    if (Array.isArray(profile.customer.branchId)) {
      return `${profile.customer.branchId.length} chi nhánh`;
    }
    return `Chi nhánh: ${profile.customer.branchId}`;
  }, [profile?.customer?.branchId]);
  const genderLabel = useMemo(() => {
    if (!userData.gender) return 'Chưa cập nhật';
    if (userData.gender === 'male' || userData.gender === 'MALE') return 'Nam';
    if (userData.gender === 'female' || userData.gender === 'FEMALE') return 'Nữ';
    return 'Khác';
  }, [userData.gender]);

  const getStatusBadgeColor = () => {
    if (profile?.status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (profile?.status === 'SUSPENDED') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const statCards = [
    {
      title: 'Trạng thái',
      value: statusLabel,
      icon: CheckCircle2,
      hint: 'Tình trạng tài khoản hiện tại',
      badgeClass: getStatusBadgeColor()
    },
    {
      title: 'Quyền truy cập',
      value: roleLabel,
      icon: Shield,
      hint: 'Vai trò và phạm vi thao tác'
    },
    {
      title: 'Ngày tham gia',
      value: joinedAt,
      icon: CalendarDays,
      hint: 'Tham gia hệ thống'
    }
  ];

  return {
    profile,
    userData,
    setUserData,
    formData,
    setFormData,
    dateInputValue,
    setDateInputValue,
    isEditing,
    setIsEditing,
    isLoading,
    isSaving,
    isUploading,
    setIsUploading,
    validationErrors,
    handleFieldChange,
    handleDateChange,
    handleSaveProfile,
    handleCancelEdit,
    handleDeleteAvatar,
    roleLabel,
    statusLabel,
    joinedAt,
    lastUpdated,
    branchLabel,
    genderLabel,
    statCards,
    passwordForm,
    setPasswordForm,
    isChangingPassword,
    handlePasswordChange
  };
};
