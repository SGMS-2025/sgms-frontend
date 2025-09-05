'use client';

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
  Calendar,
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
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, type UpdateProfileData } from '@/services/api/userApi';
import { toast } from 'sonner';
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
      try {
        setIsLoading(true);

        // Kiểm tra xem đã đăng nhập chưa
        if (!state.isAuthenticated || !state.user) {
          console.log('User not authenticated, cannot fetch profile');
          toast.error('Vui lòng đăng nhập để xem thông tin cá nhân');
          return;
        }

        console.log('Fetching profile for user:', state.user._id);
        const response = await userApi.getProfile();
        console.log('Profile API response:', response);

        // Map API response to component state
        if (response.data) {
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
          setFormData({
            fullName: response.data.fullName || '',
            phoneNumber: response.data.phoneNumber || '',
            address: response.data.address || '',
            dateOfBirth: response.data.dateOfBirth || '',
            gender: response.data.gender || 'OTHER',
            bio: response.data.bio || ''
          });
        }
      } catch (error: unknown) {
        console.error('Error fetching user profile:', error);
        const err = error as { response?: { data?: unknown }; message?: string };
        console.log('Error details:', err.response?.data || err.message);
        toast.error('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    if (state.user?._id) {
      fetchUserProfile();
    } else {
      setIsLoading(false); // Stop loading if no user is logged in
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
    try {
      setIsSaving(true);

      // Process date format if needed
      const profileData = { ...formData };
      if (formData.dateOfBirth) {
        try {
          // Try to parse date from Vietnamese format to ISO
          const parts = formData.dateOfBirth.split('/');
          if (parts.length === 3) {
            const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            profileData.dateOfBirth = isoDate;
          }
        } catch (error) {
          console.error('Error parsing date:', error);
        }
      }

      const response = await userApi.updateProfile(profileData);

      if (response.success) {
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
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    } finally {
      setIsSaving(false);
    }
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

    try {
      setIsUploading(true);
      const response = await userApi.uploadAvatar(file);

      if (response.success) {
        setUserData({
          ...userData,
          avatar: response.data.avatar?.url || ''
        });
        toast.success('Avatar đã được cập nhật');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Không thể tải lên avatar. Vui lòng thử lại sau.');
    } finally {
      setIsUploading(false);
      // Reset input để có thể chọn lại cùng một file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Xóa avatar
  const handleDeleteAvatar = async () => {
    try {
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
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Không thể xóa avatar. Vui lòng thử lại sau.');
    } finally {
      setIsUploading(false);
    }
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
    { label: 'Số buổi tập', value: '16/24', color: 'bg-orange-100 border-orange-200' },
    { label: 'Số buổi tham gia', value: '14/24', color: 'bg-orange-500 text-white' },
    { label: 'Số buổi vắng', value: '2', color: 'bg-orange-500 text-white' },
    { label: 'Số buổi đi muộn', value: '1', color: 'bg-orange-500 text-white' }
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
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-600">Đang tải thông tin...</p>
          </div>
        ) : !state.isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-10 h-10 text-orange-500 mb-4" />
            <p className="text-gray-600 font-medium text-lg mb-2">Bạn chưa đăng nhập</p>
            <p className="text-gray-500 mb-4">Vui lòng đăng nhập để xem thông tin cá nhân</p>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => (window.location.href = '/login')}>
              <LogIn className="w-4 h-4 mr-2" />
              Đăng nhập ngay
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-orange-500 text-white rounded-lg p-4 md:p-6 relative overflow-hidden">
              <div className={`${isMobile ? 'flex flex-col items-center text-center' : 'flex items-center gap-4'}`}>
                <div className="relative mb-3 md:mb-0">
                  {/* Input ẩn để chọn file */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Avatar có thể click */}
                  <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                    <Avatar className={`${isMobile ? 'w-24 h-24' : 'w-20 h-20'} border-4 border-white`}>
                      <AvatarImage src={userData.avatar || '/placeholder.svg'} alt={userData.name} />
                      <AvatarFallback className="bg-orange-600 text-white text-xl">
                        {userData.name
                          ? userData.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                          : state.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Overlay khi hover */}
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Nút xóa avatar */}
                  {userData.avatar && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-1"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}

                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <div className={`flex-1 ${isMobile ? 'w-full' : ''}`}>
                  <h1 className="text-xl md:text-2xl font-bold mb-2">{userData.name || state.user?.username}</h1>
                  <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      Đang hoạt động
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {state.user?.role === 'CUSTOMER' ? 'Khách hàng' : state.user?.role || 'Khách hàng'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white border">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 px-2 md:px-4"
                >
                  <User className="w-4 h-4 mr-0 md:mr-2" />
                  <span className={isMobile ? 'hidden' : 'inline'}>Thông tin cá nhân</span>
                  <span className={isMobile ? 'inline text-xs mt-1' : 'hidden'}>Cá nhân</span>
                </TabsTrigger>
                <TabsTrigger
                  value="service"
                  className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 px-2 md:px-4"
                >
                  <Calendar className="w-4 h-4 mr-0 md:mr-2" />
                  <span className={isMobile ? 'hidden' : 'inline'}>Gói dịch vụ</span>
                  <span className={isMobile ? 'inline text-xs mt-1' : 'hidden'}>Dịch vụ</span>
                </TabsTrigger>
                <TabsTrigger
                  value="progress"
                  className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 px-2 md:px-4"
                >
                  <TrendingUp className="w-4 h-4 mr-0 md:mr-2" />
                  <span className={isMobile ? 'hidden' : 'inline'}>Tiến độ tập luyện</span>
                  <span className={isMobile ? 'inline text-xs mt-1' : 'hidden'}>Tiến độ</span>
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="mt-6">
                <Card>
                  <CardHeader className={`${isMobile ? 'pb-2' : 'flex flex-row items-center justify-between'}`}>
                    <CardTitle className="text-orange-600 text-base md:text-lg">THÔNG TIN CÁ NHÂN</CardTitle>
                    {isMobile && (
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50 px-2 py-1 h-8"
                          disabled={isSaving}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          {isEditing ? 'Hủy' : 'Sửa'}
                        </Button>
                      </div>
                    )}
                    {!isMobile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        disabled={isSaving}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        {isEditing ? 'Hủy' : 'Chỉnh sửa hồ sơ'}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className={`space-y-4 md:space-y-6 ${isMobile ? 'pt-2 px-3' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Họ và tên
                        </Label>
                        {isEditing ? (
                          <Input id="name" value={formData.fullName} onChange={handleInputChange} />
                        ) : (
                          <p className="text-gray-900 font-medium">{userData.name || 'Chưa cập nhật'}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthDate" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Ngày sinh
                        </Label>
                        {isEditing ? (
                          <Input
                            id="birthDate"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            placeholder="DD/MM/YYYY"
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{userData.birthDate || 'Chưa cập nhật'}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Số điện thoại
                        </Label>
                        {isEditing ? (
                          <Input id="phone" value={formData.phoneNumber} onChange={handleInputChange} />
                        ) : (
                          <p className="text-gray-900 font-medium">{userData.phone || 'Chưa cập nhật'}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Giới tính
                        </Label>
                        {isEditing ? (
                          <RadioGroup
                            value={(formData.gender || 'OTHER').toLowerCase()}
                            onValueChange={handleGenderChange}
                            className={`flex ${isMobile ? 'flex-col space-y-2' : 'gap-6'}`}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="female" />
                              <Label htmlFor="female">Nữ</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="male" />
                              <Label htmlFor="male">Nam</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="other" id="other" />
                              <Label htmlFor="other">Khác</Label>
                            </div>
                          </RadioGroup>
                        ) : (
                          <div className="flex gap-2">
                            <Badge
                              variant={userData.gender === 'female' ? 'default' : 'secondary'}
                              className={userData.gender === 'female' ? 'bg-orange-100 text-orange-800' : ''}
                            >
                              Nữ
                            </Badge>
                            <Badge
                              variant={userData.gender === 'male' ? 'default' : 'secondary'}
                              className={userData.gender === 'male' ? 'bg-orange-100 text-orange-800' : ''}
                            >
                              Nam
                            </Badge>
                            <Badge
                              variant={userData.gender === 'other' ? 'default' : 'secondary'}
                              className={userData.gender === 'other' ? 'bg-orange-100 text-orange-800' : ''}
                            >
                              Khác
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Địa chỉ
                        </Label>
                        {isEditing ? (
                          <Input id="address" value={formData.address} onChange={handleInputChange} />
                        ) : (
                          <p className="text-gray-900 font-medium">{userData.address || 'Chưa cập nhật'}</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <p className="text-gray-900 font-medium">{userData.email}</p>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio">Giới thiệu bản thân</Label>
                        {isEditing ? (
                          <Textarea id="bio" value={formData.bio} onChange={handleInputChange} rows={3} />
                        ) : (
                          <p className="text-gray-900 font-medium">{userData.bio || 'Chưa cập nhật'}</p>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className={`flex ${isMobile ? 'flex-col' : ''} gap-2 pt-4`}>
                        <Button
                          className="bg-orange-500 hover:bg-orange-600 w-full md:w-auto"
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {isMobile ? 'Đang lưu...' : 'Đang lưu thay đổi...'}
                            </>
                          ) : isMobile ? (
                            'Lưu'
                          ) : (
                            'Lưu thay đổi'
                          )}
                        </Button>
                        {!isMobile && (
                          <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                            Hủy
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Service Package Tab */}
              <TabsContent value="service" className="mt-6">
                <Card>
                  <CardHeader className={isMobile ? 'pb-2' : ''}>
                    <CardTitle className="text-orange-600 text-base md:text-lg">GÓI DỊCH VỤ</CardTitle>
                  </CardHeader>
                  <CardContent className={`space-y-4 md:space-y-6 ${isMobile ? 'pt-2 px-3' : ''}`}>
                    <div className="bg-orange-50 p-3 md:p-4 rounded-lg">
                      <h3 className="font-bold text-orange-800 mb-2 text-sm md:text-base">
                        Gói hiện tại: {servicePackage.name}
                      </h3>
                      <div className={`${isMobile ? 'flex flex-col space-y-1' : 'flex items-center gap-2'} mb-4`}>
                        <div className={`flex ${isMobile ? 'justify-between' : 'items-center gap-2'}`}>
                          <span className="text-sm text-gray-600">Lịch sử gói:</span>
                          <span className="text-sm font-medium">{servicePackage.schedule}</span>
                        </div>
                        <span className="text-sm text-gray-600">{servicePackage.description}</span>
                        <Badge className="bg-orange-500 mt-1 md:mt-0 self-start md:self-auto">Đang tập luyện</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Ngày bắt đầu</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{servicePackage.startDate}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Ngày kết thúc</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{servicePackage.endDate}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Lịch tập</Label>
                        <span className="font-medium">{servicePackage.time}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Số buổi tập:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                          </div>
                          <span className="font-medium">{servicePackage.sessions}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Huấn luyện viên phụ trách:</Label>
                          <span className="font-medium">{servicePackage.trainer}</span>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Phòng tập:</Label>
                          <span className="font-medium">{servicePackage.gym}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Trạng thái thanh toán:</Label>
                        <Badge className="bg-orange-500">{servicePackage.paymentStatus}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Training Progress Tab */}
              <TabsContent value="progress" className="mt-6">
                <div className="space-y-4 md:space-y-6">
                  {/* Stats Cards */}
                  <Card>
                    <CardHeader className={isMobile ? 'pb-2' : ''}>
                      <CardTitle className="text-orange-600 text-base md:text-lg">CHUYÊN CẦN</CardTitle>
                    </CardHeader>
                    <CardContent className={isMobile ? 'pt-2 px-3' : ''}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        {workoutStats.map((stat, index) => (
                          <div key={index} className={`p-2 md:p-4 rounded-lg border-2 ${stat.color}`}>
                            <div className="text-center">
                              <div className="text-xs md:text-sm font-medium mb-1">{stat.label}</div>
                              <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Workout Schedule */}
                  <Card>
                    <CardHeader className={isMobile ? 'pb-2' : ''}>
                      <CardTitle className="text-orange-600 text-base md:text-lg">LỊCH SỬ TẬP LUYỆN</CardTitle>
                    </CardHeader>
                    <CardContent className={isMobile ? 'pt-2 px-3' : ''}>
                      {isMobile ? (
                        // Mobile view: stacked cards
                        <div className="space-y-3">
                          {workoutSchedule.map((session, index) => (
                            <div key={index} className="border rounded-lg p-3 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{session.date}</span>
                                <span className="text-xs">{session.time}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <div>
                                  {session.status === 'completed' && (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <CheckCircle className="w-3 h-3" />
                                      <span className="text-xs">Có mặt</span>
                                    </div>
                                  )}
                                  {session.status === 'warning' && (
                                    <div className="flex items-center gap-1 text-yellow-600">
                                      <AlertCircle className="w-3 h-3" />
                                      <span className="text-xs">Có mặt</span>
                                    </div>
                                  )}
                                  {session.status === 'missed' && (
                                    <div className="flex items-center gap-1 text-red-600">
                                      <XCircle className="w-3 h-3" />
                                      <span className="text-xs">Vắng</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  {session.status !== 'missed' && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                      Hoàn thành
                                    </Badge>
                                  )}
                                  {session.status === 'missed' && (
                                    <Badge variant="destructive" className="text-xs">
                                      Không hoàn thành
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {session.workout && (
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Nội dung: </span>
                                  {session.workout}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Desktop view: table
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-medium">Ngày</th>
                                <th className="text-left py-2 font-medium">Check-in</th>
                                <th className="text-left py-2 font-medium">Trạng thái</th>
                                <th className="text-left py-2 font-medium">Nội dung buổi tập</th>
                                <th className="text-left py-2 font-medium">Tiến độ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workoutSchedule.map((session, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-3">{session.date}</td>
                                  <td className="py-3">{session.time}</td>
                                  <td className="py-3">
                                    {session.status === 'completed' && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm">Có mặt</span>
                                      </div>
                                    )}
                                    {session.status === 'warning' && (
                                      <div className="flex items-center gap-1 text-yellow-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm">Có mặt</span>
                                      </div>
                                    )}
                                    {session.status === 'missed' && (
                                      <div className="flex items-center gap-1 text-red-600">
                                        <XCircle className="w-4 h-4" />
                                        <span className="text-sm">Vắng</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3">{session.workout}</td>
                                  <td className="py-3">
                                    {session.status !== 'missed' && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800">
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

                  {/* Fitness Metrics */}
                  <Card>
                    <CardHeader className={isMobile ? 'pb-2' : ''}>
                      <CardTitle className="text-orange-600 text-base md:text-lg">KẾT QUẢ HUẤN LUYỆN CÁ NHÂN</CardTitle>
                    </CardHeader>
                    <CardContent className={isMobile ? 'pt-2 px-3' : ''}>
                      <div className="space-y-4 md:space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm md:text-base">Đánh giá kĩ thuật:</span>
                            <span className="text-orange-600 font-bold">70%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                          <div className="space-y-3 md:space-y-4">
                            <h4 className="font-semibold text-sm md:text-base">Chỉ số cơ thể:</h4>
                            <div className="space-y-2 md:space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm md:text-base">Cân nặng:</span>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="text-xs md:text-sm">
                                    {fitnessMetrics.weight.previous}
                                  </Badge>
                                  <Badge className="bg-orange-500 text-xs md:text-sm">
                                    {fitnessMetrics.weight.current}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm md:text-base">Body Fat:</span>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="text-xs md:text-sm">
                                    {fitnessMetrics.bodyFat.previous}
                                  </Badge>
                                  <Badge className="bg-orange-500 text-xs md:text-sm">
                                    {fitnessMetrics.bodyFat.current}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm md:text-base">BMI:</span>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="text-xs md:text-sm">
                                    {fitnessMetrics.bmi.previous}
                                  </Badge>
                                  <Badge className="bg-orange-500 text-xs md:text-sm">
                                    {fitnessMetrics.bmi.current}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 md:space-y-4">
                            <h4 className="font-semibold text-sm md:text-base">Thành tích nâng tạ:</h4>
                            <div className="space-y-2 md:space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm md:text-base">• Squat:</span>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="text-xs md:text-sm">
                                    {fitnessMetrics.squat.previous}
                                  </Badge>
                                  <Badge className="bg-orange-500 text-xs md:text-sm">
                                    {fitnessMetrics.squat.current}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm md:text-base">• Deadlift:</span>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="text-xs md:text-sm">
                                    {fitnessMetrics.deadlift.previous}
                                  </Badge>
                                  <Badge className="bg-orange-500 text-xs md:text-sm">
                                    {fitnessMetrics.deadlift.current}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm md:text-base">• Bench press:</span>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="text-xs md:text-sm">
                                    {fitnessMetrics.benchPress.previous}
                                  </Badge>
                                  <Badge className="bg-orange-500 text-xs md:text-sm">
                                    {fitnessMetrics.benchPress.current}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      {!isMobile && <Footer />}

      {/* Dialog xác nhận xóa avatar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ảnh đại diện</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa ảnh đại diện của mình không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAvatar} className="bg-red-500 hover:bg-red-600">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
