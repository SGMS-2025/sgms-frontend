import { LoginForm } from '@/components/forms/LoginForm';
import backgroundImage from '@/assets/images/background1.png';

export default function LoginPage() {
  return (
    <div className="min-h-screen md:h-screen bg-gray-100">
      {/* Login Form */}
      <div
        className="relative min-h-screen md:h-full bg-cover bg-center bg-no-repeat flex items-center justify-center pt-4 md:pt-0 pb-8 md:pb-0 px-4 md:px-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('${backgroundImage}')`
        }}
      >
        <div className="w-full max-w-sm md:max-w-lg mx-0 md:mx-2">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
