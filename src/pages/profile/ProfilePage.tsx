import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/BaseHeader';
import { Footer } from '@/components/layout/BaseFooter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  User,
  Calendar as CalendarIcon,
  Phone,
  MapPin,
  Mail,
  Edit3,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  Loader2,
  LogIn,
  Upload,
  Trash2,
  Award,
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/services/api/userApi';
import { toast } from 'sonner';
import { AVATAR_PLACEHOLDER } from '@/constants/images';
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
import type { UpdateProfileData } from '@/types/api/User';

// Helper components defined outside to prevent re-creation on each render
interface FormFieldProps {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  placeholder?: string;
  type?: string;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isTextarea?: boolean;
  rows?: number;
  min?: string;
  max?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  icon: Icon,
  value,
  placeholder,
  type = 'text',
  isEditing,
  onChange,
  isTextarea = false,
  rows = 4,
  min,
  max
}) => (
  <div className="space-y-3">
    <Label htmlFor={isEditing ? id : undefined} className="flex items-center gap-2 text-gray-700 font-medium">
      <Icon className="w-4 h-4 text-orange-500" />
      {label}
    </Label>
    {isEditing ? (
      isTextarea ? (
        <Textarea
          id={id}
          value={value}
          onChange={onChange}
          rows={rows}
          className="bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg px-4 py-3 text-base font-medium resize-none"
          placeholder={placeholder}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          className="bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg px-4 py-3 h-12 text-base font-medium"
          placeholder={placeholder}
          min={min}
          max={max}
        />
      )
    ) : (
      <div
        className={`bg-white rounded-lg px-4 py-3 border border-gray-200 ${isTextarea ? 'min-h-[100px] flex items-start' : 'h-12 flex items-center'}`}
      >
        <p className="text-gray-900 font-medium">{value || 'Chưa cập nhật'}</p>
      </div>
    )}
  </div>
);

interface StatusBadgeProps {
  status: string;
  completedText?: string;
  warningText?: string;
  missedText?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  completedText = 'Hoàn thành',
  warningText = 'Đi muộn',
  missedText = 'Vắng mặt'
}) => {
  if (status === 'completed') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        {completedText}
      </Badge>
    );
  }
  if (status === 'warning') {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        {warningText}
      </Badge>
    );
  }
  if (status === 'missed') {
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        {missedText}
      </Badge>
    );
  }
  return null;
};

interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
    <Label className="font-semibold text-gray-600 mb-3 block flex items-center">
      <Icon className="w-5 h-5 mr-2 text-orange-500" />
      {title}
    </Label>
    {children}
  </div>
);

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state } = useAuth();
  const isMobile = useIsMobile();

  // Helper functions to avoid nested ternary operators
  const getServiceTabText = (isMobile: boolean): string => {
    return isMobile ? 'Dịch vụ' : 'Gói dịch vụ';
  };

  const getBodyMetricLabel = (key: string): string => {
    switch (key) {
      case 'weight':
        return 'Cân nặng';
      case 'bodyFat':
        return 'Body Fat';
      case 'bmi':
        return 'BMI';
      default:
        return key;
    }
  };

  const getStrengthMetricLabel = (key: string): string => {
    switch (key) {
      case 'squat':
        return 'Squat';
      case 'deadlift':
        return 'Deadlift';
      case 'benchPress':
        return 'Bench press';
      default:
        return key;
    }
  };

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
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'OTHER',
    address: '',
    bio: '',
    avatar: ''
  });

  // Load user data from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);

      // Kiểm tra xem đã đăng nhập chưa
      if (!state.isAuthenticated || !state.user) {
        console.log('User not authenticated, cannot fetch profile');
        setIsLoading(false);
        return;
      }

      console.log('Fetching profile for user:', state.user._id);
      const response = await userApi.getProfile();
      console.log('Profile API response:', response);

      // Map API response to component state
      if (response.success && response.data) {
        setUserData({
          name: response.data.fullName || '',
          email: response.data.email || '',
          phone: response.data.phoneNumber || '',
          birthDate: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toLocaleDateString('vi-VN') : '',
          gender: response.data.gender?.toLowerCase() || 'other',
          address: response.data.address || '',
          bio: response.data.bio || '',
          avatar: response.data.avatar?.url || ''
        });

        // Initialize form data
        const displayDate = response.data.dateOfBirth
          ? new Date(response.data.dateOfBirth).toLocaleDateString('vi-VN')
          : '';

        setFormData({
          fullName: response.data.fullName || '',
          phoneNumber: response.data.phoneNumber || '',
          address: response.data.address || '',
          dateOfBirth: displayDate,
          gender: response.data.gender || 'OTHER',
          bio: response.data.bio || ''
        });
      }

      setIsLoading(false);
    };

    if (state.user?._id) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [state.user?._id, state.isAuthenticated, state.user]);

  // Handle input change
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

    setFormData({
      ...formData,
      [fieldMapping[id] || id]: value
    });
  };

  // Handle radio change for gender
  const handleGenderChange = (value: string) => {
    setFormData({
      ...formData,
      gender: value.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER'
    });
  };

  // Handle form submission
  const handleSaveProfile = async () => {
    if (!formData.fullName?.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    setIsSaving(true);

    // Process date format if needed
    let processedDateOfBirth = formData.dateOfBirth;
    if (formData.dateOfBirth) {
      // Try to parse date from Vietnamese format to ISO
      const parts = formData.dateOfBirth.split('/');
      if (parts.length === 3) {
        processedDateOfBirth = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const profileData = {
      ...formData,
      dateOfBirth: processedDateOfBirth
    };

    const response = await userApi.updateProfile(profileData);

    if (response.success && response.data) {
      // Update local state with new data
      setUserData({
        name: response.data.fullName || '',
        email: response.data.email || '',
        phone: response.data.phoneNumber || '',
        birthDate: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toLocaleDateString('vi-VN') : '',
        gender: response.data.gender?.toLowerCase() || 'other',
        address: response.data.address || '',
        bio: response.data.bio || '',
        avatar: response.data.avatar?.url || ''
      });

      toast.success('Thông tin cá nhân đã được cập nhật.');
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
    setIsEditing(false);
  };

  // Mở cửa sổ chọn file khi click vào avatar
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Xử lý upload avatar khi file được chọn
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.match('image.*')) {
      toast.error('Chỉ chấp nhận file hình ảnh');
      return;
    }

    // Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
      return;
    }

    setIsUploading(true);
    const response = await userApi.uploadAvatar(file);

    if (response.success && response.data) {
      setUserData({
        ...userData,
        avatar: response.data.avatar?.url || ''
      });
      toast.success('Avatar đã được cập nhật');
    }

    setIsUploading(false);
    // Reset input để có thể chọn lại cùng một file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xóa avatar
  const handleDeleteAvatar = async () => {
    setIsUploading(true);
    const response = await userApi.deleteAvatar();

    if (response.success) {
      setUserData({
        ...userData,
        avatar: ''
      });
      toast.success('Avatar đã được xóa');
    }

    setShowDeleteDialog(false);
    setIsUploading(false);
  };

  const servicePackage = {
    name: 'ƯU ĐÃI BAN NGÀY 24 BUỔI',
    schedule: 'Tháng 8/2025',
    description: 'Gói ưu đãi ban ngày 24 buổi',
    startDate: '01/08/2025',
    endDate: '30/09/2025',
    sessions: '16 buổi / 24 buổi',
    time: '16:00 - thứ 2, 4, 6 (Cố định)',
    trainer: 'Nguyễn Phương Anh',
    gym: 'Phòng tập The New Gym',
    paymentStatus: 'Đã thanh toán 100%'
  };

  const workoutStats = [
    {
      label: 'Số buổi tập',
      value: '16/24',
      color: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 text-orange-800',
      icon: Target
    },
    {
      label: 'Số buổi tham gia',
      value: '14/24',
      color: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-800',
      icon: CheckCircle
    },
    {
      label: 'Số buổi vắng',
      value: '2',
      color: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 text-red-800',
      icon: XCircle
    },
    {
      label: 'Số buổi đi muộn',
      value: '1',
      color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800',
      icon: AlertCircle
    }
  ];

  const workoutSchedule = [
    { date: '01/08/2025 (Thứ 6)', time: '18:00', status: 'completed', workout: 'Tập Toàn Thân (Full Body)' },
    { date: '04/08/2025 (Thứ 2)', time: '18:00', status: 'completed', workout: 'Ngực & Tay trước' },
    {
      date: '06/08/2025 (Thứ 4)',
      time: '18:00',
      status: 'warning',
      workout: 'Lưng & Xô - Pull-up, Lat pulldown, Rowing'
    },
    { date: '08/08/2025 (Thứ 6)', time: '18:00', status: 'missed', workout: '' }
  ];

  const fitnessMetrics = {
    weight: { current: '50kg', previous: '53kg' },
    bodyFat: { current: '23%', previous: '26%' },
    bmi: { current: '20.5', previous: '21.3' },
    squat: { current: '45kg', previous: '30kg' },
    deadlift: { current: '60kg', previous: '40kg' },
    benchPress: { current: '30kg', previous: '20kg' }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin"></div>
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="text-gray-600 font-medium mt-6 text-lg">Đang tải thông tin...</p>
            </div>
          ) : !state.isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md mx-auto text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Bạn chưa đăng nhập</h2>
                <p className="text-gray-600 mb-8">
                  Vui lòng đăng nhập để xem thông tin cá nhân và quản lý tài khoản của bạn
                </p>
                <Button
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transform hover:scale-105 transition-all duration-200 px-8 py-3 text-lg"
                  onClick={() => (window.location.href = '/login')}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Đăng nhập ngay
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Unified Container */}
              <div className="bg-white rounded-t-2xl rounded-b-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Enhanced Header */}
                <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6 md:p-8 overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

                  <div
                    className={`relative z-10 ${isMobile ? 'flex flex-col items-center text-center' : 'flex items-center gap-6'}`}
                  >
                    <div className="relative mb-4 md:mb-0">
                      {/* Input ẩn để chọn file */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />

                      {/* Enhanced Avatar */}
                      <div
                        className="relative cursor-pointer group"
                        onClick={handleAvatarClick}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleAvatarClick();
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label="Thay đổi ảnh đại diện"
                      >
                        <div className="relative">
                          <Avatar
                            className={`${isMobile ? 'w-28 h-28' : 'w-24 h-24'} border-4 border-white shadow-xl ring-4 ring-white/20`}
                          >
                            <AvatarImage src={userData.avatar || AVATAR_PLACEHOLDER} alt={userData.name} />
                            <AvatarFallback className="bg-gradient-to-br from-orange-600 to-orange-700 text-white text-xl font-bold">
                              {userData.name
                                ? userData.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                : state.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>

                          {/* Enhanced Upload overlay */}
                          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 group-focus:scale-105">
                            <div className="text-center">
                              <Upload className="w-6 h-6 text-white mx-auto mb-1" />
                              <span className="text-xs text-white font-medium">Thay đổi</span>
                            </div>
                          </div>
                        </div>

                        {/* Delete button */}
                        {userData.avatar && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-1 -right-1 w-8 h-8 rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Status indicator */}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      </div>
                    </div>

                    <div className={`flex-1 ${isMobile ? 'w-full' : ''}`}>
                      <h1 className="text-2xl md:text-3xl font-bold mb-3">{userData.name || state.user?.username}</h1>
                      <div className={`flex gap-3 ${isMobile ? 'justify-center flex-wrap' : ''}`}>
                        <Badge
                          variant="secondary"
                          className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1"
                        >
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                          Đang hoạt động
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1"
                        >
                          <Award className="w-4 h-4 mr-1" />
                          {state.user?.role === 'CUSTOMER' ? 'Khách hàng' : state.user?.role || 'Khách hàng'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Navigation Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-50 border-b border-gray-200 h-auto p-1 rounded-none">
                    <TabsTrigger
                      value="personal"
                      className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md px-4 py-3 rounded-lg m-1 font-medium transition-all duration-200"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span className={isMobile ? 'text-sm' : 'text-base'}>
                        {isMobile ? 'Cá nhân' : 'Thông tin cá nhân'}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="service"
                      className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md px-4 py-3 rounded-lg m-1 font-medium transition-all duration-200"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      <span className={isMobile ? 'text-sm' : 'text-base'}>{getServiceTabText(isMobile)}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="progress"
                      className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md px-4 py-3 rounded-lg m-1 font-medium transition-all duration-200"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span className={isMobile ? 'text-sm' : 'text-base'}>
                        {isMobile ? 'Tiến độ' : 'Tiến độ tập luyện'}
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="p-0">
                    <Card
                      className="border-0 shadow-none rounded-t-none rounded-b-2xl"
                      style={{ backgroundColor: '#F1F3F4' }}
                    >
                      <CardHeader
                        className={`p-6 md:p-8 ${isMobile ? 'pb-4' : 'flex flex-row items-center justify-between pb-6'}`}
                      >
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
                                className="bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-lg px-4 py-3 h-12 text-base font-medium"
                                max={new Date().toISOString().split('T')[0]}
                                min="1900-01-01"
                              />
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
                            placeholder="Nhập số điện thoại"
                            isEditing={isEditing}
                            onChange={handleInputChange}
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
                              placeholder="Chia sẻ một chút về bản thân bạn..."
                              isEditing={isEditing}
                              onChange={handleInputChange}
                              isTextarea={true}
                              rows={4}
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
                  </TabsContent>

                  {/* Service Package Tab */}
                  <TabsContent value="service" className="p-0">
                    <Card
                      className="border-0 shadow-none rounded-t-none rounded-b-2xl"
                      style={{ backgroundColor: '#F1F3F4' }}
                    >
                      <CardHeader className="p-6 md:p-8 pb-6">
                        <CardTitle className="text-orange-600 text-xl md:text-2xl font-bold flex items-center">
                          <CalendarIcon className="w-6 h-6 mr-3" />
                          GÓI DỊCH VỤ
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6 md:p-8 pt-0">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-orange-800 mb-2 text-lg">{servicePackage.name}</h3>
                              <p className="text-orange-700">{servicePackage.description}</p>
                            </div>
                            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
                              Đang tập luyện
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-orange-700 font-medium">Lịch sử gói:</span>
                              <span className="text-orange-800 font-semibold">{servicePackage.schedule}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Ngày bắt đầu</Label>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-orange-500" />
                              <span className="font-medium">{servicePackage.startDate}</span>
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Ngày kết thúc</Label>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-orange-500" />
                              <span className="font-medium">{servicePackage.endDate}</span>
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Lịch tập</Label>
                            <span className="font-medium text-sm">{servicePackage.time}</span>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-semibold text-gray-700">Tiến độ tập luyện:</span>
                              <span className="font-bold text-lg">{servicePackage.sessions}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full shadow-sm"
                                style={{ width: '67%' }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600">67% hoàn thành</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoCard icon={User} title="Huấn luyện viên phụ trách:">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="font-medium text-lg">{servicePackage.trainer}</span>
                              </div>
                            </InfoCard>
                            <InfoCard icon={MapPin} title="Phòng tập:">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                  <MapPin className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="font-medium text-lg">{servicePackage.gym}</span>
                              </div>
                            </InfoCard>
                          </div>

                          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <Label className="font-semibold text-gray-600 mb-3 block">Trạng thái thanh toán:</Label>
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-base">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {servicePackage.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Training Progress Tab */}
                  <TabsContent
                    value="progress"
                    className="p-0 rounded-t-none rounded-b-2xl"
                    style={{ backgroundColor: '#F1F3F4' }}
                  >
                    <div className="space-y-8 p-6 md:p-8">
                      {/* Enhanced Stats Cards */}
                      <Card className="border-0 shadow-none">
                        <CardHeader className="pb-6">
                          <CardTitle className="text-orange-600 text-xl md:text-2xl font-bold flex items-center">
                            <TrendingUp className="w-6 h-6 mr-3" />
                            CHUYÊN CẦN
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {workoutStats.map((stat, index) => {
                              const IconComponent = stat.icon;
                              return (
                                <div
                                  key={index}
                                  className={`p-6 rounded-xl border-2 ${stat.color} shadow-lg transform hover:scale-105 transition-all duration-200`}
                                >
                                  <div className="text-center">
                                    <IconComponent className="w-8 h-8 mx-auto mb-3" />
                                    <div className="text-sm font-semibold mb-2">{stat.label}</div>
                                    <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Enhanced Workout Schedule */}
                      <Card className="border-0 shadow-lg rounded-xl">
                        <CardHeader className="pb-6">
                          <CardTitle className="text-orange-600 text-xl md:text-2xl font-bold flex items-center">
                            <CalendarIcon className="w-6 h-6 mr-3" />
                            LỊCH SỬ TẬP LUYỆN
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isMobile ? (
                            // Enhanced Mobile view
                            <div className="space-y-4">
                              {workoutSchedule.map((session, index) => (
                                <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-semibold text-gray-800">{session.date}</p>
                                      <p className="text-sm text-gray-600">{session.time}</p>
                                    </div>
                                    <StatusBadge status={session.status} />
                                  </div>
                                  {session.workout && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                      <p className="text-sm font-medium text-gray-700">
                                        <span className="text-orange-600">Nội dung: </span>
                                        {session.workout}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Enhanced Desktop view
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-4 px-2 font-semibold text-gray-700">Ngày</th>
                                    <th className="text-left py-4 px-2 font-semibold text-gray-700">Check-in</th>
                                    <th className="text-left py-4 px-2 font-semibold text-gray-700">Trạng thái</th>
                                    <th className="text-left py-4 px-2 font-semibold text-gray-700">
                                      Nội dung buổi tập
                                    </th>
                                    <th className="text-left py-4 px-2 font-semibold text-gray-700">Tiến độ</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {workoutSchedule.map((session, index) => (
                                    <tr
                                      key={index}
                                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                      <td className="py-4 px-2 font-medium">{session.date}</td>
                                      <td className="py-4 px-2">{session.time}</td>
                                      <td className="py-4 px-2">
                                        {session.status === 'completed' && (
                                          <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-medium">Có mặt</span>
                                          </div>
                                        )}
                                        {session.status === 'warning' && (
                                          <div className="flex items-center gap-2 text-yellow-600">
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="font-medium">Đi muộn</span>
                                          </div>
                                        )}
                                        {session.status === 'missed' && (
                                          <div className="flex items-center gap-2 text-red-600">
                                            <XCircle className="w-5 h-5" />
                                            <span className="font-medium">Vắng</span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-4 px-2">{session.workout}</td>
                                      <td className="py-4 px-2">
                                        {session.status !== 'missed' && (
                                          <Badge className="bg-green-100 text-green-800 border-green-200">
                                            Hoàn thành
                                          </Badge>
                                        )}
                                        {session.status === 'missed' && (
                                          <Badge variant="destructive">Không hoàn thành</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Enhanced Fitness Metrics */}
                      <Card className="border-0 shadow-lg rounded-xl">
                        <CardHeader className="pb-6">
                          <CardTitle className="text-orange-600 text-xl md:text-2xl font-bold flex items-center">
                            <Award className="w-6 h-6 mr-3" />
                            KẾT QUẢ HUẤN LUYỆN CÁ NHÂN
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                          {/* Overall progress */}
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-semibold text-lg text-gray-700">Đánh giá kĩ thuật:</span>
                              <span className="text-orange-600 font-bold text-2xl">70%</span>
                            </div>
                            <div className="w-full bg-white rounded-full h-4 shadow-inner">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full shadow-sm"
                                style={{ width: '70%' }}
                              ></div>
                            </div>
                            <p className="text-sm text-orange-700 mt-2 font-medium">Tiến bộ tốt! Tiếp tục duy trì.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Body metrics */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                              <h4 className="font-bold text-lg mb-6 text-gray-800 flex items-center">
                                <Target className="w-5 h-5 mr-2 text-orange-500" />
                                Chỉ số cơ thể:
                              </h4>
                              <div className="space-y-4">
                                {Object.entries(fitnessMetrics)
                                  .slice(0, 3)
                                  .map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                                    >
                                      <span className="font-medium capitalize">{getBodyMetricLabel(key)}:</span>
                                      <div className="flex gap-3">
                                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                          {value.previous}
                                        </Badge>
                                        <span className="text-gray-400">→</span>
                                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                                          {value.current}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Strength metrics */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                              <h4 className="font-bold text-lg mb-6 text-gray-800 flex items-center">
                                <Award className="w-5 h-5 mr-2 text-orange-500" />
                                Thành tích nâng tạ:
                              </h4>
                              <div className="space-y-4">
                                {Object.entries(fitnessMetrics)
                                  .slice(3)
                                  .map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                                    >
                                      <span className="font-medium capitalize">• {getStrengthMetricLabel(key)}:</span>
                                      <div className="flex gap-3">
                                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                          {value.previous}
                                        </Badge>
                                        <span className="text-gray-400">→</span>
                                        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                                          {value.current}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
      {!isMobile && <Footer />}

      {/* Enhanced Delete Avatar Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-800">Xóa ảnh đại diện</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Bạn có chắc chắn muốn xóa ảnh đại diện của mình không? Hành động này không thể hoàn tác.
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
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
