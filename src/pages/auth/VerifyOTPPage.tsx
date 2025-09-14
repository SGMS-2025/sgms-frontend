import VerifyOTPForm from '@/components/forms/VerifyOTPForm';
import backgroundImage from '@/assets/images/background1.png';
import { useTranslation } from 'react-i18next';

export default function VerifyOTPPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full bg-gray-100 flex">
      {/* Left Panel - Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat flex flex-col justify-between p-8"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${backgroundImage}')`
          }}
        >
          {/* Logo */}
          <div className="flex items-center space-x-2">
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
            <h2 className="text-3xl font-bold mb-4">{t('marketing.create_account_title')}</h2>
            <p className="text-lg text-gray-300 mb-8">{t('marketing.manage_description')}</p>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-500 mb-1">24/7</div>
                <div className="text-sm text-gray-300">{t('marketing.real_time')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-500 mb-1">ISO</div>
                <div className="text-sm text-gray-300">{t('marketing.high_security')}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-500 mb-1">+AI</div>
                <div className="text-sm text-gray-300">{t('marketing.smart_management')}</div>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-white/70 text-sm">
            <p>{t('marketing.trusted_gyms')}</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Verify OTP Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <VerifyOTPForm />
        </div>
      </div>
    </div>
  );
}
