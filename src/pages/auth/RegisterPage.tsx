import { RegisterForm } from '@/components/forms/RegisterForm';
import backgroundImage from '@/assets/images/background1.png';

export default function RegisterPage() {
  return (
    <div className="h-screen w-full bg-gray-100 overflow-hidden flex animate-fadeIn">
      {/* Left Panel - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat flex flex-col justify-between p-8 animate-slideInLeft"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${backgroundImage}')`
          }}
        >
          {/* Logo */}
          <div className="flex items-center space-x-2 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-white text-xl font-bold">SGMS</span>
          </div>

          {/* Main Content */}
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              Tạo tài khoản và bắt đầu hành trình fitness của bạn
            </h2>
            <p className="text-lg text-gray-300 mb-8 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
              Quản lý phòng gym, thành viên, lớp học và doanh thu một cách dễ dàng và hiệu quả.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center animate-fadeInUp"
                style={{ animationDelay: '0.8s' }}
              >
                <div className="text-2xl font-bold text-orange-500 mb-1">24/7</div>
                <div className="text-sm text-gray-300">Theo dõi thời gian thực</div>
              </div>
              <div
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center animate-fadeInUp"
                style={{ animationDelay: '1.0s' }}
              >
                <div className="text-2xl font-bold text-orange-500 mb-1">ISO</div>
                <div className="text-sm text-gray-300">Bảo mật cao</div>
              </div>
              <div
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center animate-fadeInUp"
                style={{ animationDelay: '1.2s' }}
              >
                <div className="text-2xl font-bold text-orange-500 mb-1">+AI</div>
                <div className="text-sm text-gray-300">Quản lý thông minh</div>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-white/70 text-sm animate-fadeInUp" style={{ animationDelay: '1.4s' }}>
            <p>Đã có hơn 1000+ phòng gym tin tưởng sử dụng</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-4 animate-slideInRight">
        <div className="w-full max-w-md">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
