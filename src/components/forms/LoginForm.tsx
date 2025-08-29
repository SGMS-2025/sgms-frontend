import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, User, Crown } from 'lucide-react';
import { useState } from 'react';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'owner'>('customer');

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-orange-500 mb-2">ĐĂNG NHẬP</h1>
        <p className="text-gray-300 text-xl">
          Đăng nhập ngay để tiếp tục hành trình biến đổi vóc dáng với đầy cảm hứng!
        </p>
      </div>
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-10 py-4 text-white">
        {/* Role Selection */}
        <div className="mb-6">
          <p className="text-md text-gray-300 mb-3 font-semibold">Vai trò đăng nhập</p>
          <div className="flex space-x-2">
            <Button
              onClick={() => setSelectedRole('customer')}
              className={`flex-1 rounded-full py-5 ${
                selectedRole === 'customer'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-white hover:bg-gray-100 text-orange-500'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Khách hàng
            </Button>
            <Button
              onClick={() => setSelectedRole('owner')}
              className={`flex-1 rounded-full py-5 ${
                selectedRole === 'owner'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-white hover:bg-gray-100 text-orange-500'
              }`}
            >
              <Crown className="w-4 h-4 mr-2" />
              Owner
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center">
            <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
              i
            </span>
            Chọn đúng vai trò để đăng nhập. Nếu chọn sai sẽ không thể đăng nhập.
          </p>
        </div>

        {/* Email Field */}
        <div className="mb-4">
          <label className="block text-md text-gray-300 mb-2 font-semibold">Email</label>
          <Input type="text" className="w-full bg-white text-black border-0 rounded-full px-4 py-6" placeholder="" />
        </div>

        {/* Password Field */}
        <div className="mb-4">
          <label className="block text-md text-gray-300 mb-2 font-semibold">Mật khẩu</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-white text-black border-0 rounded-full px-4 py-6 pr-12"
              placeholder=""
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" className="border-white" />
            <label htmlFor="remember" className="text-sm text-gray-300">
              Ghi nhớ đăng nhập
            </label>
          </div>
          <a href="#" className="text-sm text-orange-500 hover:text-orange-400">
            Quên mật khẩu?
          </a>
        </div>

        {/* Login Button */}
        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 rounded-full mb-6">
          ĐĂNG NHẬP
        </Button>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-gray-500"></div>
          <span className="px-4 text-sm text-gray-400">Hoặc</span>
          <div className="flex-1 border-t border-gray-500"></div>
        </div>

        {/* Google Login */}
        <Button
          variant="outline"
          className="mx-auto bg-white text-black border-0 py-6 rounded-full mb-6 hover:bg-gray-100 flex items-center justify-center w-1/2"
        >
          <svg style={{ width: '28px', height: '28px' }} className="" viewBox="0 0 24 24">
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
          <span className="text-md text-gray-500">Google</span>
        </Button>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-400">
          Bạn chưa có tài khoản?{' '}
          <a href="#" className="text-orange-500 hover:text-orange-400">
            Đăng ký ngay
          </a>
        </p>
      </div>
    </div>
  );
}
