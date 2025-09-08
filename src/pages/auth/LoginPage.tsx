import { LoginForm } from '@/components/forms/LoginForm';
import backgroundImage from '@/assets/images/background1.png';
import logoImage from '@/assets/images/logo2.png';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();

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
          <div className="flex items-center gap-3 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="cursor-pointer">
              <img src={logoImage} alt="Gym Smart Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-orange-500">GYM</span>
                <span className="text-white ml-1">SMART</span>
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              {t('marketing.welcome_back_title')}
            </h2>
            <p className="text-lg text-gray-300 mb-8 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
              {t('marketing.manage_description')}
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center animate-fadeInUp"
                style={{ animationDelay: '0.8s' }}
              >
                <div className="text-2xl font-bold text-orange-500 mb-1">24/7</div>
                <div className="text-sm text-gray-300">{t('marketing.real_time')}</div>
              </div>
              <div
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center animate-fadeInUp"
                style={{ animationDelay: '1.0s' }}
              >
                <div className="text-2xl font-bold text-orange-500 mb-1">ISO</div>
                <div className="text-sm text-gray-300">{t('marketing.high_security')}</div>
              </div>
              <div
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center animate-fadeInUp"
                style={{ animationDelay: '1.2s' }}
              >
                <div className="text-2xl font-bold text-orange-500 mb-1">+AI</div>
                <div className="text-sm text-gray-300">{t('marketing.smart_management')}</div>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-white/70 text-sm animate-fadeInUp" style={{ animationDelay: '1.4s' }}>
            <p>{t('marketing.trusted_gyms')}</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-4 animate-slideInRight">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
