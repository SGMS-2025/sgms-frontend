import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, User, Crown, Phone, Mail, Lock, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '@/services/api/authApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { RegisterRequest } from '@/types/api/Auth';

export function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'owner'>('customer');
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { username, fullName, email, phoneNumber, password, confirmPassword } = formData;

    if (!username || !fullName || !email || !phoneNumber || !password || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return false;
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email không hợp lệ');
      return false;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error('Số điện thoại không hợp lệ');
      return false;
    }

    if (!agreeTerms) {
      toast.error('Vui lòng đồng ý với điều khoản sử dụng');
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registerData: RegisterRequest = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: selectedRole
      };

      const response = await authApi.register(registerData);

      if (response.success) {
        toast.success('Mã OTP đã được gửi đến email của bạn!');

        // Navigate to verify OTP page with email
        navigate('/verify-otp', {
          state: { email: formData.email }
        });
      }
    } catch (error: unknown) {
      console.error('Register error:', error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đăng ký thất bại';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-3xl font-bold text-orange-500 mb-2 leading-tight">ĐĂNG KÝ</h1>
        <p className="text-gray-600 text-base">Tạo tài khoản mới để bắt đầu hành trình biến đổi vóc dáng của bạn!</p>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Role Selection */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <p className="text-md text-gray-600 mb-3 font-semibold">Vai trò đăng ký</p>
          <div className="flex space-x-2">
            <Button
              type="button"
              onClick={() => setSelectedRole('customer')}
              className={`flex-1 rounded-lg py-4 text-base ${
                selectedRole === 'customer'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
              }`}
            >
              <User className="w-5 h-5 mr-2" />
              Khách hàng
            </Button>
            <Button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`flex-1 rounded-lg py-4 text-base ${
                selectedRole === 'owner'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300'
              }`}
            >
              <Crown className="w-5 h-5 mr-2" />
              Owner
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1 md:mt-2 flex items-center">
            <span className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
              i
            </span>
            Chọn đúng vai trò để đăng ký. Bạn có thể thay đổi sau này.
          </p>
        </div>

        {/* Input Fields */}
        <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
          {/* Row 1: Username and Full Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">Tên đăng nhập</label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">Họ và tên</label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
                  placeholder="Nhập họ và tên của bạn"
                  required
                />
                <UserCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Row 2: Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">Email</label>
              <div className="relative">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
                  placeholder="Nhập email của bạn"
                  required
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">Số điện thoại</label>
              <div className="relative">
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 border-gray-300 rounded-lg px-4 py-4 pl-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-500"
                  placeholder="Nhập số điện thoại"
                  required
                />
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Row 3: Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">Mật khẩu</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-gray-50 backdrop-blur-sm text-black border-gray-300 rounded-lg px-4 py-4 pl-12 pr-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-300"
                  placeholder="Nhập mật khẩu"
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-md text-gray-600 mb-2 font-semibold">Xác nhận mật khẩu</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full bg-gray-50 backdrop-blur-sm text-black border-gray-300 rounded-lg px-4 py-4 pl-12 pr-12 text-base focus:border-orange-500 focus:ring-orange-500 placeholder-gray-300"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="flex items-center mb-4 animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
          <Checkbox
            id="terms"
            checked={agreeTerms}
            onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
            className="border-gray-300"
          />
          <label htmlFor="terms" className="text-sm text-gray-600 ml-2">
            Tôi đồng ý với{' '}
            <a href="#" className="text-orange-500 hover:text-orange-400">
              điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a href="#" className="text-orange-500 hover:text-orange-400">
              chính sách bảo mật
            </a>
          </label>
        </div>

        {/* Register Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 text-base rounded-lg mb-4 disabled:opacity-50 animate-fadeInUp"
          style={{ animationDelay: '1.0s' }}
        >
          {isLoading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
        </Button>

        {/* Divider */}
        <div className="flex items-center mb-4 animate-fadeInUp" style={{ animationDelay: '1.2s' }}>
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-base text-gray-600">Hoặc</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Register */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white/20 backdrop-blur-sm text-white border-gray-300 py-4 rounded-lg mb-4 hover:bg-white/30 flex items-center justify-center animate-fadeInUp"
          style={{ animationDelay: '1.4s' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm text-gray-600 ml-2">Google</span>
        </Button>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-500 animate-fadeInUp" style={{ animationDelay: '1.6s' }}>
          Đã có tài khoản?{' '}
          <a href="/login" className="text-orange-500 hover:text-orange-400">
            Đăng nhập ngay
          </a>
        </p>
      </form>
    </div>
  );
}
