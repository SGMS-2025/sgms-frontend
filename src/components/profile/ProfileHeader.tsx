import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Upload, Trash2, Award } from 'lucide-react';
import { AVATAR_PLACEHOLDER } from '@/constants/images';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { userApi } from '@/services/api/userApi';
import type { ProfileHeaderProps } from '@/types/api/User';
import { useAuthActions } from '@/hooks/useAuth';

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userData,
  userRole,
  username,
  setIsUploading,
  setUserData,
  setShowDeleteDialog
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { updateUser } = useAuthActions();

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Chỉ chấp nhận file hình ảnh';
    }

    if (file.size > 5 * 1024 * 1024) {
      return 'Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB';
    }

    return null;
  };

  // Upload avatar to server
  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    const response = await userApi.uploadAvatar(file);

    if (response.success && response.data) {
      setUserData((prev) => ({
        ...prev,
        avatar: response.data.avatar?.url || ''
      }));

      // Update AuthContext with new user data
      updateUser(response.data);

      toast.success('Avatar đã được cập nhật');
    }

    setIsUploading(false);
  };

  // Reset file input after upload
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate avatar fallback text
  const getAvatarFallback = (): string => {
    if (userData.name) {
      return userData.name
        .split(' ')
        .map((n) => n[0])
        .join('');
    }
    return username?.substring(0, 2).toUpperCase() || 'U';
  };

  // Get user role display text
  const getRoleDisplayText = (): string => {
    return userRole === 'CUSTOMER' ? 'Khách hàng' : userRole || 'Khách hàng';
  };

  // Mở cửa sổ chọn file khi click vào avatar
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle keyboard navigation for avatar
  const handleAvatarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAvatarClick();
    }
  };

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  // Xử lý upload avatar khi file được chọn
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    await uploadAvatar(file);
    resetFileInput();
  };

  return (
    <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6 md:p-8 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

      <div
        className={`relative z-10 ${isMobile ? 'flex flex-col items-center text-center' : 'flex items-center gap-6'}`}
      >
        <div className="relative mb-4 md:mb-0">
          {/* Input ẩn để chọn file */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* Enhanced Avatar */}
          <button
            type="button"
            className="relative cursor-pointer group bg-transparent border-0 p-0"
            onClick={handleAvatarClick}
            onKeyDown={handleAvatarKeyDown}
            aria-label="Thay đổi ảnh đại diện"
          >
            <div className="relative">
              <Avatar
                className={`${isMobile ? 'w-28 h-28' : 'w-24 h-24'} border-4 border-white shadow-xl ring-4 ring-white/20`}
              >
                <AvatarImage src={userData.avatar || AVATAR_PLACEHOLDER} alt={userData.name} />
                <AvatarFallback className="bg-gradient-to-br from-orange-600 to-orange-700 text-white text-xl font-bold">
                  {getAvatarFallback()}
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
                onClick={handleDeleteClick}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            {/* Status indicator */}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </button>
        </div>

        <div className={`flex-1 ${isMobile ? 'w-full' : ''}`}>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{userData.name || username}</h1>
          <div className={`flex gap-3 ${isMobile ? 'justify-center flex-wrap' : ''}`}>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Đang hoạt động
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1">
              <Award className="w-4 h-4 mr-1" />
              {getRoleDisplayText()}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
