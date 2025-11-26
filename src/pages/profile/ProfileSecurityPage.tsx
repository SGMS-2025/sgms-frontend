import React, { useState } from 'react';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { ProfileTopSection } from '@/components/profile/ProfileTopSection';
import { useProfileData } from '@/hooks/useProfileData';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

const ProfileSecurityPage: React.FC = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    userData,
    profile,
    isUploading,
    setIsUploading,
    setUserData,
    statCards,
    isLoading,
    passwordForm,
    setPasswordForm,
    isChangingPassword,
    handlePasswordChange,
    handleDeleteAvatar
  } = useProfileData();

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
        <ProfileTopSection
          userData={userData}
          profile={profile}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
          setUserData={setUserData}
          setShowDeleteDialog={setShowDeleteDialog}
          statCards={statCards}
        />

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

export default ProfileSecurityPage;
