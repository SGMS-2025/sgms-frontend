import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, AlertCircle, Camera, Shield } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userApi } from '@/services/api/userApi';
import { useAuthActions } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ProfileAccountSettingsPage: React.FC = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    userData,
    profile,
    isUploading,
    setIsUploading,
    setUserData,
    formData,
    dateInputValue,
    validationErrors,
    handleFieldChange,
    handleDateChange,
    handleSaveProfile,
    handleCancelEdit,
    handleDeleteAvatar,
    isLoading,
    isSaving,
    setIsEditing,
    isEditing,
    passwordForm,
    setPasswordForm,
    isChangingPassword,
    handlePasswordChange
  } = useProfileData();
  const { updateUser } = useAuthActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeNav, setActiveNav] = useState<'edit-profile' | 'security'>('edit-profile');

  useEffect(() => {
    setIsEditing(true);
  }, [setIsEditing]);

  const initials = useMemo(() => {
    if (userData.name) {
      return userData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return profile?.username?.slice(0, 2)?.toUpperCase() || 'GM';
  }, [userData.name, profile?.username]);

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn, tối đa 5MB');
      return;
    }

    setIsUploading(true);
    const response = await userApi.uploadAvatar(file);
    if (response.success && response.data) {
      setUserData((prev) => ({ ...prev, avatar: response.data.avatar?.url || '' }));
      updateUser(response.data);
      toast.success('Đã cập nhật ảnh đại diện');
    }
    setIsUploading(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

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

  const navItems: { key: 'edit-profile' | 'security'; label: string }[] = [
    { key: 'edit-profile', label: 'Chỉnh sửa hồ sơ' },
    { key: 'security', label: 'Bảo mật' }
  ];

  const handleNavClick = (key: 'edit-profile' | 'security') => {
    setActiveNav(key);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f8] py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h1 className="text-lg font-semibold text-gray-900">Cài đặt</h1>
            <p className="text-sm text-gray-500">Cập nhật thông tin cá nhân của bạn</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
            <div className="border-r border-gray-100 bg-[#fafafa] p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activeNav === item.key
                      ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
                      : 'text-gray-600 hover:bg-white hover:border hover:border-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              <div className="max-w-3xl">
                {activeNav === 'edit-profile' && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Hồ sơ</p>
                        <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
                      </div>
                      <Badge variant="outline" className="text-xs border-gray-200 text-gray-700 bg-white">
                        {isEditing ? 'Đang chỉnh sửa' : 'Chỉ xem'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                      />
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={userData.avatar} alt={userData.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{userData.name || profile?.username}</p>
                          <p className="text-xs text-gray-500">{profile?.username}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 rounded-full border-gray-200 text-gray-700"
                          onClick={handleAvatarClick}
                          disabled={isUploading}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {isUploading ? 'Đang tải...' : 'Thay đổi ảnh'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                          id="fullName"
                          className="rounded-full border-gray-200 h-11"
                          value={formData.fullName || ''}
                          onChange={(e) => handleFieldChange('fullName', e.target.value)}
                          placeholder="Nhập họ và tên"
                          disabled={!isEditing}
                          aria-invalid={Boolean(validationErrors.fullName)}
                        />
                        {validationErrors.fullName && (
                          <p className="text-sm text-red-600">{validationErrors.fullName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Email</Label>
                          <Input
                            className="rounded-full border-gray-200 h-11 bg-gray-50"
                            value={userData.email}
                            disabled
                          />
                          <p className="text-xs text-gray-400 mt-1">Email đăng nhập và nhận thông báo</p>
                        </div>
                        <div>
                          <Label>Tên đăng nhập</Label>
                          <Input
                            className="rounded-full border-gray-200 h-11 bg-gray-50"
                            value={profile?.username || ''}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Số điện thoại</Label>
                          <Input
                            id="phone"
                            className="rounded-full border-gray-200 h-11"
                            value={formData.phoneNumber || ''}
                            onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                            placeholder="Nhập số điện thoại"
                            disabled={!isEditing}
                            aria-invalid={Boolean(validationErrors.phoneNumber)}
                          />
                          {validationErrors.phoneNumber && (
                            <p className="text-sm text-red-600">{validationErrors.phoneNumber}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            className="rounded-full border-gray-200 h-11"
                            value={dateInputValue}
                            onChange={(e) => handleDateChange(e.target.value)}
                            disabled={!isEditing}
                            aria-invalid={Boolean(validationErrors.dateOfBirth)}
                          />
                          {validationErrors.dateOfBirth && (
                            <p className="text-sm text-red-600">{validationErrors.dateOfBirth}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Giới tính</Label>
                          <div className="flex gap-2 mt-2">
                            {['MALE', 'FEMALE', 'OTHER'].map((gender) => (
                              <Button
                                key={gender}
                                type="button"
                                variant={formData.gender === gender ? 'default' : 'outline'}
                                className={`rounded-full ${
                                  formData.gender === gender
                                    ? 'bg-gray-900 hover:bg-black text-white border-gray-900'
                                    : 'border-gray-200 text-gray-700'
                                }`}
                                onClick={() => handleFieldChange('gender', gender)}
                                disabled={!isEditing}
                              >
                                {gender === 'MALE' ? 'Nam' : gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="address">Địa chỉ</Label>
                          <Input
                            id="address"
                            className="rounded-full border-gray-200 h-11"
                            value={formData.address || ''}
                            onChange={(e) => handleFieldChange('address', e.target.value)}
                            placeholder="Địa chỉ sinh sống"
                            disabled={!isEditing}
                            aria-invalid={Boolean(validationErrors.address)}
                          />
                          {validationErrors.address && (
                            <p className="text-sm text-red-600">{validationErrors.address}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          rows={4}
                          className="rounded-2xl border-gray-200"
                          value={formData.bio || ''}
                          onChange={(e) => handleFieldChange('bio', e.target.value)}
                          placeholder="Chia sẻ đôi nét về bản thân và phong cách làm việc của bạn."
                          disabled={!isEditing}
                          aria-invalid={Boolean(validationErrors.bio)}
                        />
                        {validationErrors.bio && <p className="text-sm text-red-600">{validationErrors.bio}</p>}
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <Button variant="outline" className="rounded-full border-gray-200" onClick={handleCancelEdit}>
                          Hủy
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="rounded-full bg-gray-900 hover:bg-black text-white"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Đang lưu
                            </>
                          ) : (
                            'Lưu thay đổi'
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {activeNav === 'security' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Bảo mật</p>
                        <h2 className="text-xl font-semibold text-gray-900">Mật khẩu & đăng nhập</h2>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white/60 p-5 space-y-4">
                      <form className="space-y-3" onSubmit={handlePasswordChange}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              className="rounded-full border-gray-200 h-11"
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                              }
                              placeholder="Nhập mật khẩu đang dùng"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newPassword">Mật khẩu mới</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              className="rounded-full border-gray-200 h-11"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Mật khẩu mới mạnh hơn"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              className="rounded-full border-gray-200 h-11"
                              value={passwordForm.confirmNewPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))
                              }
                              placeholder="Nhập lại mật khẩu mới"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="submit"
                              disabled={isChangingPassword}
                              className="rounded-full bg-gray-900 hover:bg-black text-white w-full"
                            >
                              {isChangingPassword ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Đang cập nhật
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Đổi mật khẩu
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-800">Xóa ảnh đại diện</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-gray-600 px-4">
            Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại? Hành động này không thể hoàn tác.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAvatar}
              className="bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
              {isUploading ? 'Đang xóa...' : 'Xóa ảnh'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileAccountSettingsPage;
