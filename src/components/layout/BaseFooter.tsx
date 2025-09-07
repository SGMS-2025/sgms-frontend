import logoImage from '@/assets/images/logo2.png';

export function Footer() {
  return (
    <>
      {/* Footer */}
      <footer className="bg-gray-100 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 items-start">
            {/* Logo */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={logoImage} alt="Gym Smart Logo" className="w-10 h-10 object-contain" />
                <div>
                  <h2 className="text-xl font-bold">
                    <span className="text-orange-500">GYM</span>
                    <span className="text-slate-800 ml-1">SMART</span>
                  </h2>
                </div>
              </div>
            </div>

            {/* About Us */}
            <div>
              <h3 className="font-semibold text-orange-500 mb-4">Về chúng tôi</h3>
              <p className="text-gray-600 text-sm mb-2">Đánh giá</p>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Phòng tập</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Gym</li>
                <li>Yoga</li>
                <li>Boxing</li>
              </ul>
            </div>

            {/* Advantages */}
            <div className="sm:col-span-2 lg:col-span-2 flex flex-col lg:flex-row lg:space-x-8">
              <div className="mb-6 lg:mb-0">
                <h3 className="font-semibold text-gray-800 mb-4">Ưu đãi</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Gói dịch vụ</li>
                  <li>Phòng tập</li>
                  <li>Huấn luyện viên cá nhân</li>
                </ul>
              </div>

              {/* Contact Support */}
              <div className="lg:ml-auto">
                <h4 className="font-semibold text-gray-800 mb-3">Liên hệ hỗ trợ</h4>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex space-x-2">
                    <div className="w-5 h-5 bg-blue-600 rounded"></div>
                    <div className="w-5 h-5 bg-red-600 rounded"></div>
                  </div>
                  <span className="text-sm text-gray-600">0123 - 456 - 789</span>
                </div>
                <p className="text-sm text-gray-600">Trường Đại học FPT Đà Nẵng</p>
                <p className="text-xs text-gray-500">Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Copyright */}
      <div className="bg-orange-500 text-white text-center py-3">
        <p className="text-sm">Copyright © from 2025 by Gym Smart</p>
      </div>
    </>
  );
}
