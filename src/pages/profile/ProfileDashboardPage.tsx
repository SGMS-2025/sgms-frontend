import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Activity,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  Settings,
  User,
  UserCog
} from 'lucide-react';
import { toast } from 'sonner';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthActions } from '@/hooks/useAuth';
import { userApi } from '@/services/api/userApi';
import { authApi } from '@/services/api/authApi';
import { validateFormData } from '@/utils/validation';
import { validateChangePasswordForm } from '@/utils/authValidation';
import type { ProfileUserData, UpdateProfileData, User as ApiUser } from '@/types/api/User';
import { useTranslation } from 'react-i18next';

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

const ProfileDashboardPage: React.FC = () => {
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'account' | 'security'>('profile');

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
        console.error('Failed to fetch profile dashboard data', error);
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

  useEffect(() => {
    setIsEditing(activeSection === 'account');
  }, [activeSection]);

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
    setIsEditing(activeSection === 'account');
  };

  const handleDeleteAvatar = async () => {
    setIsUploading(true);
    const response = await userApi.deleteAvatar();
    if (response.success && response.data) {
      mapUserDataFromResponse(response.data);
      updateUser(response.data);
      toast.success('Ảnh đại diện đã được xóa');
    }
    setShowDeleteDialog(false);
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

  const renderStatCard = (card: (typeof statCards)[number]) => {
    const Icon = card.icon;
    return (
      <div key={card.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Icon className="w-5 h-5" />
          </div>
          {card.badgeClass && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${card.badgeClass}`}>{card.value}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-3">{card.title}</p>
        {!card.badgeClass && <p className="text-lg font-semibold text-gray-900 mt-1">{card.value}</p>}
        <p className="text-xs text-gray-400 mt-1">{card.hint}</p>
      </div>
    );
  };

  const navItems = [
    { key: 'profile', label: 'Profile', description: 'Xem thông tin', icon: User },
    { key: 'account', label: 'Account settings', description: 'Chỉnh sửa hồ sơ', icon: Settings },
    { key: 'security', label: 'Security', description: 'Đổi mật khẩu', icon: Shield }
  ] as const;

  const genderLabel = useMemo(() => {
    if (!userData.gender) return 'Chưa cập nhật';
    if (userData.gender === 'male' || userData.gender === 'MALE') return 'Nam';
    if (userData.gender === 'female' || userData.gender === 'FEMALE') return 'Nữ';
    return 'Khác';
  }, [userData.gender]);

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hồ sơ</h3>
            <p className="text-sm text-gray-500">Thông tin hiển thị cho hệ thống và đối tác.</p>
          </div>
          <Badge variant="outline" className="text-xs border-slate-200 text-slate-700 bg-slate-50">
            Chỉ xem
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: User, label: 'Họ và tên', value: userData.name || 'Chưa cập nhật' },
            { icon: Mail, label: 'Email', value: userData.email || 'Chưa cập nhật' },
            { icon: Phone, label: 'Số điện thoại', value: userData.phone || 'Chưa cập nhật' },
            { icon: CalendarDays, label: 'Ngày sinh', value: userData.birthDate || 'Chưa cập nhật' },
            { icon: Shield, label: 'Giới tính', value: genderLabel },
            { icon: MapPin, label: 'Địa chỉ', value: userData.address || 'Chưa cập nhật' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 break-words">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs text-gray-500 mb-1">Giới thiệu</p>
          <p className="text-sm text-gray-800">{userData.bio || 'Chưa có giới thiệu.'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Thông tin hệ thống</h3>
            <p className="text-sm text-gray-500">ID, vai trò và chi nhánh liên kết.</p>
          </div>
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
            {profile?._id?.slice(-6) || '---'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tên đăng nhập</p>
              <p className="text-sm font-semibold text-gray-900">{profile?.username || 'Chưa cập nhật'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Quyền hiện tại</p>
              <p className="text-sm font-semibold text-gray-900">{roleLabel}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Chi nhánh</p>
              <p className="text-sm font-semibold text-gray-900">{branchLabel}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Liên hệ</p>
              <p className="text-sm font-semibold text-gray-900">{userData.phone || 'Chưa có số điện thoại'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-semibold text-gray-900 break-all">{userData.email || 'Chưa cập nhật'}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Ngày sinh</p>
            <p className="text-sm font-semibold text-gray-900">{userData.birthDate || 'Chưa cập nhật'}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Cập nhật gần nhất</p>
            <p className="text-sm font-semibold text-gray-900">{lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
            <p className="text-sm text-gray-500">Theo dõi lịch sử cập nhật hồ sơ</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-50 text-orange-600">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Cập nhật thông tin</p>
                <p className="text-xs text-gray-500">Tên, số điện thoại, địa chỉ</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-right">{lastUpdated}</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-50 text-orange-600">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Bảo mật tài khoản</p>
                <p className="text-xs text-gray-500">Khuyến nghị đổi mật khẩu mỗi 90 ngày</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-right">Luôn bật</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-50 text-orange-600">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Ngày tham gia</p>
                <p className="text-xs text-gray-500">Thời gian khởi tạo tài khoản</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-right">{joinedAt}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-500">Quản lý hồ sơ cá nhân</p>
          <h2 className="text-2xl font-bold text-gray-900">Account settings</h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
            onClick={handleCancelEdit}
          >
            <UserCog className="w-4 h-4 mr-2" />
            Đặt lại
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
            <p className="text-sm text-gray-500">Thông tin hiển thị trong các khu vực quản lý</p>
          </div>
          <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50">
            Đang chỉnh sửa
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              value={formData.fullName || ''}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              placeholder="Nhập họ và tên"
              disabled={!isEditing}
              aria-invalid={Boolean(validationErrors.fullName)}
            />
            {validationErrors.fullName && <p className="text-sm text-red-600">{validationErrors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={userData.email} disabled />
            <p className="text-xs text-gray-400">Email dùng để đăng nhập và nhận thông báo</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={formData.phoneNumber || ''}
              onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
              placeholder="Nhập số điện thoại"
              disabled={!isEditing}
              aria-invalid={Boolean(validationErrors.phoneNumber)}
            />
            {validationErrors.phoneNumber && <p className="text-sm text-red-600">{validationErrors.phoneNumber}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateInputValue}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={!isEditing}
              aria-invalid={Boolean(validationErrors.dateOfBirth)}
            />
            {validationErrors.dateOfBirth && <p className="text-sm text-red-600">{validationErrors.dateOfBirth}</p>}
          </div>

          <div className="space-y-2">
            <Label>Giới tính</Label>
            <div className="flex gap-2 flex-wrap">
              {['MALE', 'FEMALE', 'OTHER'].map((gender) => (
                <Button
                  key={gender}
                  type="button"
                  variant={formData.gender === gender ? 'default' : 'outline'}
                  className={
                    formData.gender === gender
                      ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                      : 'border-gray-200 text-gray-700'
                  }
                  onClick={() => handleFieldChange('gender', gender)}
                  disabled={!isEditing}
                >
                  {gender === 'MALE' ? 'Nam' : gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="Địa chỉ sinh sống"
              disabled={!isEditing}
              aria-invalid={Boolean(validationErrors.address)}
            />
            {validationErrors.address && <p className="text-sm text-red-600">{validationErrors.address}</p>}
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="bio">Giới thiệu ngắn</Label>
          <Textarea
            id="bio"
            rows={4}
            value={formData.bio || ''}
            onChange={(e) => handleFieldChange('bio', e.target.value)}
            placeholder="Chia sẻ về phong cách làm việc, mục tiêu hoặc ghi chú dành cho nội bộ."
            disabled={!isEditing}
            aria-invalid={Boolean(validationErrors.bio)}
          />
          {validationErrors.bio && <p className="text-sm text-red-600">{validationErrors.bio}</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Thông báo & liên hệ</h3>
            <p className="text-sm text-gray-500">Cập nhật kênh liên lạc ưu tiên để không bỏ lỡ thông báo.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Email chính</p>
              <p className="text-xs text-gray-500">{userData.email || 'Chưa cập nhật'}</p>
            </div>
            <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
              Đã xác minh
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Di động</p>
              <p className="text-xs text-gray-500">{userData.phone || 'Thêm số điện thoại'}</p>
            </div>
            <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
              Ưu tiên
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bảo mật & mật khẩu</h3>
            <p className="text-sm text-gray-500">Đổi mật khẩu định kỳ để đảm bảo an toàn.</p>
          </div>
        </div>

        <form className="space-y-3" onSubmit={handlePasswordChange}>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Nhập mật khẩu đang dùng"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Mật khẩu mới mạnh hơn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <Button
            type="submit"
            disabled={isChangingPassword}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang cập nhật
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Đổi mật khẩu
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f4f5fb]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span>Đang tải hồ sơ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5fb]">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <ProfileHeader
            userData={userData}
            userRole={profile?.role}
            username={profile?.username}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
            setUserData={setUserData}
            setShowDeleteDialog={setShowDeleteDialog}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-br from-orange-50/70 to-white">
            {statCards.map(renderStatCard)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${isActive ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-800 hover:bg-gray-50'}`}
                  >
                    <span
                      className={`p-2 rounded-full ${
                        isActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className={`text-xs ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeSection === 'profile' && renderProfileSection()}
            {activeSection === 'account' && renderAccountSection()}
            {activeSection === 'security' && renderSecuritySection()}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-800">Xóa ảnh đại diện</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAvatar} className="bg-red-500 hover:bg-red-600 rounded-lg">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Xóa ảnh
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileDashboardPage;
