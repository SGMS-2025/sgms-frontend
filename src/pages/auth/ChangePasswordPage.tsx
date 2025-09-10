import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';
import { Header } from '@/components/layout/BaseHeader';
import { Footer } from '@/components/layout/BaseFooter';

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <ChangePasswordForm />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
