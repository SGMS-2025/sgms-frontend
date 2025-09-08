import { Bell, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthActions, useUser } from '@/hooks/useAuth';
import type { User as UserType } from '@/types/api/User';
import type { MobileAuthenticatedMenuProps } from '@/types/components/navbar';

export function MobileAuthenticatedMenu({ onClose }: MobileAuthenticatedMenuProps) {
  const navigate = useNavigate();
  const { logout } = useAuthActions();
  const user = useUser();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const getAvatarFallback = (user: UserType) => {
    if (user.fullName) {
      return user.fullName
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.username[0].toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="pt-4 border-t border-gray-200">
      {/* User Info */}
      <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-xl mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar?.url} alt={user.fullName || user.username} />
          <AvatarFallback className="bg-orange-500 text-white font-medium">{getAvatarFallback(user)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user.fullName || user.username}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <p className="text-xs text-orange-600 capitalize">{user.role.toLowerCase()}</p>
        </div>
        <div className="relative">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
            3
          </span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-left text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-xl py-3"
          onClick={() => handleNavigation('/profile')}
        >
          <User className="mr-3 h-4 w-4" />
          Hồ sơ cá nhân
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-left text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-xl py-3"
          onClick={() => handleNavigation('/settings')}
        >
          <Settings className="mr-3 h-4 w-4" />
          Cài đặt
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl py-3"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
