import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogIn } from 'lucide-react';

const CustomerSecurity: React.FC = () => {
  const { state } = useAuth();

  // Login prompt component
  const renderLoginPrompt = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Bạn chưa đăng nhập</h2>
        <p className="text-gray-600 mb-8">Vui lòng đăng nhập để truy cập trang bảo mật của bạn</p>
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

  // Not authenticated state
  if (!state.isAuthenticated) {
    return renderLoginPrompt();
  }

  return (
    <div className="space-y-6 pb-32">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bảo mật tài khoản</h1>
        <p className="text-gray-600 mt-2">Quản lý mật khẩu và cài đặt bảo mật cho tài khoản của bạn</p>
      </div>

      {/* Change Password Form - Full width */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              Thay đổi mật khẩu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>

      {/* Extra space to ensure scroll works */}
      <div className="h-20 sm:h-8"></div>
    </div>
  );
};

export default CustomerSecurity;
