import { Button } from '@/components/ui/button';
import { Bell, HelpCircle, ImageIcon } from 'lucide-react';

export function Header() {
  return (
    <>
      {/* Navigation Bar */}
      <nav className="bg-orange-500 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-end">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <Bell className="w-4 h-4" />
              <span className="text-sm">Thông báo</span>
            </div>
            <div className="flex items-center space-x-1">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Hỗ trợ</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Header with Logo and Auth Buttons */}
      <div className="bg-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="bg-gray-300 p-3 rounded">
            <ImageIcon className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              className="text-orange-500 bg-white hover:bg-orange-600 hover:text-white text-sm rounded-full"
            >
              Đăng ký
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-6 rounded-full">
              Đăng nhập
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
