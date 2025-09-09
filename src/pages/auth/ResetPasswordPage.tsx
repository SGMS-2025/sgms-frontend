import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';
import { MarketingPanel } from '@/components/auth/MarketingPanel';

export default function ResetPasswordPage() {
  return (
    <div className="h-screen w-full bg-gray-100 overflow-hidden flex animate-fadeIn">
      {/* Left Panel - Marketing */}
      <MarketingPanel titleKey="marketing.reset_password_title" />

      {/* Right Panel - Reset Password Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-4 animate-slideInRight">
        <div className="w-full max-w-md">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
