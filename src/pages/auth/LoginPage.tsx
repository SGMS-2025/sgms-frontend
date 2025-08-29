import { Header } from '@/components/layout/Header';
import { LoginForm } from '@/components/forms/LoginForm';
import { ScrollingBanner } from '@/components/layout/ScrollingBanner';
import { Footer } from '@/components/layout/Footer';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Login Form Section */}
      <div
        className="relative min-h-[600px] bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/src/assets/images/background1.png')`
        }}
      >
        <div className="w-full max-w-lg mx-2 my-12">
          <LoginForm />
        </div>
      </div>

      <ScrollingBanner />
      <Footer />
    </div>
  );
}
