import React, { useMemo, useState } from 'react';
import { CalendarDays, Mail, MapPin, Phone, Shield, User, Loader2, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { ProfileTopSection } from '@/components/profile/ProfileTopSection';
import { useProfileData } from '@/hooks/useProfileData';

const ProfileOverviewPage: React.FC = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const {
    userData,
    profile,
    isUploading,
    setIsUploading,
    setUserData,
    statCards,
    branchLabel,
    roleLabel,
    genderLabel,
    joinedAt,
    lastUpdated,
    handleDeleteAvatar,
    isLoading
  } = useProfileData();

  const personalDetails = useMemo(
    () => [
      { icon: User, label: 'Họ và tên', value: userData.name || 'Chưa cập nhật' },
      { icon: Mail, label: 'Email', value: userData.email || 'Chưa cập nhật' },
      { icon: Phone, label: 'Số điện thoại', value: userData.phone || 'Chưa cập nhật' },
      { icon: CalendarDays, label: 'Ngày sinh', value: userData.birthDate || 'Chưa cập nhật' },
      { icon: Shield, label: 'Giới tính', value: genderLabel },
      { icon: MapPin, label: 'Địa chỉ', value: userData.address || 'Chưa cập nhật' }
    ],
    [userData, genderLabel]
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
        <ProfileTopSection
          userData={userData}
          profile={profile}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
          setUserData={setUserData}
          setShowDeleteDialog={setShowDeleteDialog}
          statCards={statCards}
        />

        <div className="space-y-5">
          <div className="bg-gradient-to-br from-[#fff6ec] via-white to-[#f9fbff] border border-orange-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Tổng quan nhanh</p>
                <h3 className="text-lg font-semibold text-gray-900">Hồ sơ Owner</h3>
                <p className="text-sm text-gray-500">Thông tin quan trọng để xác thực và liên hệ.</p>
              </div>
              <span className="text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
                {statCards[0]?.value || 'Đang cập nhật'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickChip label="Quyền" value={roleLabel} />
              <QuickChip label="Chi nhánh" value={branchLabel} />
              <QuickChip label="Tham gia" value={joinedAt} />
              <QuickChip label="Cập nhật" value={lastUpdated} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Thông tin cá nhân</p>
                    <h4 className="text-xl font-semibold text-gray-900">Chi tiết chủ phòng</h4>
                    <p className="text-sm text-gray-500">Các thông tin giúp nhận diện và liên lạc với bạn.</p>
                  </div>
                  <span className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full">
                    Chỉ xem
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {personalDetails.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white px-3 py-3"
                      >
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p className="text-sm font-semibold text-gray-900 break-words">{item.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-[#fff6ec] via-white to-[#f9fbff] p-5">
                  <p className="text-xs text-gray-500 mb-2">Giới thiệu</p>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {userData.bio ||
                      'Chưa có giới thiệu. Thêm vài dòng để đội ngũ và đối tác hiểu hơn về phong cách làm việc của bạn.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Tài khoản</p>
                    <h4 className="text-lg font-semibold text-gray-900">Thông tin hệ thống</h4>
                  </div>
                  <span className="text-xs text-gray-500">{profile?._id?.slice(-6) || '---'}</span>
                </div>

                <div className="space-y-3">
                  <InfoRow label="Tên đăng nhập" value={profile?.username || 'Chưa cập nhật'} />
                  <InfoRow label="Trạng thái" value={statCards[0]?.value || 'Chưa cập nhật'} />
                  <InfoRow label="Chi nhánh" value={branchLabel} />
                  <InfoRow label="Tham gia" value={joinedAt} />
                  <InfoRow label="Cập nhật gần nhất" value={lastUpdated} />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Liên hệ</p>
                  <h4 className="text-lg font-semibold text-gray-900">Thông tin liên lạc</h4>
                </div>
                <InfoRow label="Email" value={userData.email || 'Chưa cập nhật'} />
                <InfoRow label="Di động" value={userData.phone || 'Chưa có số điện thoại'} />
                <InfoRow label="Hỗ trợ" value="support@gymsmart.site" />
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

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-gray-900 text-right">{value}</p>
  </div>
);

const QuickChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-xs px-3 py-3 flex flex-col gap-1">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

export default ProfileOverviewPage;
