import { VerifyForgotPasswordOTPForm } from '@/components/forms/VerifyForgotPasswordOTPForm';
import { MarketingPanel } from '@/components/auth/MarketingPanel';

export default function VerifyForgotPasswordOTPPage() {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex animate-fadeIn">
      {/* Left Panel - Marketing */}
      <MarketingPanel titleKey="marketing.verify_otp_title" />

      {/* Right Panel - Verify OTP Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-4 animate-slideInRight overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <VerifyForgotPasswordOTPForm />
        </div>
      </div>
    </div>
  );
}
