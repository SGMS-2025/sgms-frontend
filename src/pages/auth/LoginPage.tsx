import { Header } from '@/components/layout/BaseHeader';
import { LoginForm } from '@/components/forms/LoginForm';
import { ScrollingBanner } from '@/components/layout/ScrollingBanner';
import { Footer } from '@/components/layout/BaseFooter';
import backgroundImage from '@/assets/images/background1.png';

export default function LoginPage() {
  return (
    <div className="h-screen bg-gray-100">
      <Header />

      {/* Login Form */}
      <div
        className="relative h-full bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundImage})`
        }}
      >
        <div className="w-full max-w-lg mx-2">
          <LoginForm />
        </div>
      </div>

      <ScrollingBanner />
      <Footer />
    </div>
  );
}
