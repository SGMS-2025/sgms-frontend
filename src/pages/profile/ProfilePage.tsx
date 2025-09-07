import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/BaseHeader';
import { Footer } from '@/components/layout/BaseFooter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  User as UserIcon,
  Calendar as CalendarIcon,
  AlertCircle,
  TrendingUp,
  Loader2,
  LogIn,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/services/api/userApi';
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
import type { UpdateProfileData, User as ApiUser } from '@/types/api/User';
import { validateFormData } from '@/utils/validation';

// Import các component đã tách
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PersonalInfoTab } from '@/components/profile/PersonalInfoTab';
import { ServicePackageTab } from '@/components/profile/ServicePackageTab';
import { TrainingProgressTab } from '@/components/profile/TrainingProgressTab';

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { state } = useAuth();
  const isMobile = useIsMobile();

  // Helper functions to avoid nested ternary operators
  const getServiceTabText = (isMobile: boolean): string => {
    return isMobile ? 'Dịch vụ' : 'Gói dịch vụ';
  };

  // Extract loading screen component
  const renderLoadingScreen = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin"></div>
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="text-gray-600 font-medium mt-6 text-lg">Đang tải thông tin...</p>
    </div>
  );

  // Extract login prompt component
  const renderLoginPrompt = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Bạn chưa đăng nhập</h2>
        <p className="text-gray-600 mb-8">Vui lòng đăng nhập để xem thông tin cá nhân và quản lý tài khoản của bạn</p>
        <Button
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transform hover:scale-105 transition-all duration-200 px-8 py-3 text-lg"
          onClick={() => (window.location.href = '/login')}
        >
          <LogIn className="w-5 h-5 mr-2" />
          Đăng nhập ngay
        </Button>
      </div>
    </div>
  );

  // Extract main profile content
  const renderProfileContent = () => (
    <div>
      {/* Unified Container */}
      <div className="bg-white rounded-t-2xl rounded-b-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <ProfileHeader
          userData={userData}
          userRole={state.user?.role}
          username={state.user?.username}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
          setUserData={setUserData}
          setShowDeleteDialog={setShowDeleteDialog}
        />

        {/* Enhanced Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 border-b border-gray-200 h-auto p-1 rounded-none">
            <TabsTrigger
              value="personal"
              className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-md px-4 py-3 rounded-lg m-1 font-medium transition-all duration-200"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              <span className={isMobile ? 'text-sm' : 'text-base'}>{isMobile ? 'Cá nhân' : 'Thông tin cá nhân'}</span>
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
              <span className={isMobile ? 'text-sm' : 'text-base'}>{isMobile ? 'Tiến độ' : 'Tiến độ tập luyện'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="p-0">
            <PersonalInfoTab
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              isSaving={isSaving}
              formData={formData}
              userData={userData}
              handleInputChange={handleInputChange}
              handleGenderChange={handleGenderChange}
              handleSaveProfile={handleSaveProfile}
              handleCancelEdit={handleCancelEdit}
              setFormData={setFormData}
              validationErrors={validationErrors}
            />
          </TabsContent>

          {/* Service Package Tab */}
          <TabsContent value="service" className="p-0">
            <ServicePackageTab servicePackage={servicePackage} />
          </TabsContent>

          {/* Training Progress Tab */}
          <TabsContent
            value="progress"
            className="p-0 rounded-t-none rounded-b-2xl"
            style={{ backgroundColor: '#F1F3F4' }}
          >
            <TrainingProgressTab
              workoutStats={workoutStats}
              workoutSchedule={workoutSchedule}
              fitnessMetrics={fitnessMetrics}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

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

  // Extract user data mapping logic
  const mapUserDataFromResponse = (responseData: ApiUser) => {
    const birthDate = responseData.dateOfBirth
      ? new Date(responseData.dateOfBirth as string).toLocaleDateString('vi-VN')
      : '';

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
      gender: ['MALE', 'FEMALE', 'OTHER'].includes((responseData.gender || 'OTHER') as string)
        ? (responseData.gender as 'MALE' | 'FEMALE' | 'OTHER')
        : 'OTHER',
      bio: responseData.bio || ''
    });
  };

  // Load user data from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);

      if (!state.isAuthenticated || !state.user) {
        console.log('User not authenticated, cannot fetch profile');
        setIsLoading(false);
        return;
      }

      console.log('Fetching profile for user:', state.user._id);
      const response = await userApi.getProfile();
      console.log('Profile API response:', response);

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

  // Handle form submission
  const handleSaveProfile = async () => {
    // Validate form data
    const validation = validateFormData(formData);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    // Clear validation errors if all valid
    setValidationErrors({});
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
    // Clear validation errors
    setValidationErrors({});
    setIsEditing(false);
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

  // Mock data - trong thực tế sẽ lấy từ API
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
          {isLoading && renderLoadingScreen()}
          {!isLoading && !state.isAuthenticated && renderLoginPrompt()}
          {!isLoading && state.isAuthenticated && renderProfileContent()}
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
                  <XCircle className="w-4 h-4 mr-2" />
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
