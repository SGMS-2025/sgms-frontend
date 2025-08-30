import { useAuthState, useAuthActions } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, Shield, LogOut } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuthState();
  const { logout } = useAuthActions();

  // Hiển thị loading khi đang tải
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Redirect về login nếu chưa đăng nhập
  if (!isAuthenticated || !user) {
    window.location.href = '/login';
    return null;
  }

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'customer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chào mừng trở lại!</h1>
            <p className="text-gray-600 mt-2">Đây là thông tin tài khoản của bạn</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>

        {/* Thông tin user */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Thông tin cơ bản */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ID</label>
                <p className="text-gray-900 font-mono text-sm">{user._id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Tên đăng nhập</label>
                <p className="text-gray-900">{user.username}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                <p className="text-gray-900">{user.fullName || 'Chưa cập nhật'}</p>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">{user.email}</span>
              </div>

              {user.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{user.phoneNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thông tin hệ thống */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Thông tin hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Vai trò</label>
                <div className="mt-1">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role === 'admin'
                      ? 'Quản trị viên'
                      : user.role === 'owner'
                        ? 'Chủ sở hữu'
                        : user.role === 'customer'
                          ? 'Khách hàng'
                          : user.role}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                <div className="mt-1">
                  <Badge
                    className={user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  >
                    {user.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="text-gray-900 text-sm">{formatDate(user.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                  <p className="text-gray-900 text-sm">{formatDate(user.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify({ isAuthenticated, user }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
