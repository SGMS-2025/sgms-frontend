import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';
import { MarketingPanel } from '@/components/auth/MarketingPanel';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex animate-fadeIn">
      {/* Left Panel - Marketing */}
      <MarketingPanel titleKey="marketing.forgot_password_title" />

      {/* Right Panel - Forgot Password Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-4 animate-slideInRight overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
