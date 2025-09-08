import { useState } from 'react';
import { Bell, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuthActions, useUser } from '@/hooks/useAuth';
import type { User as UserType } from '@/types/api/User';
import type { AuthenticatedNavbarProps } from '@/types/api/navbar';

export function AuthenticatedNavbar({ isScrolled }: AuthenticatedNavbarProps) {
  const [notificationCount] = useState(3); // Mock notification count
  const navigate = useNavigate();
  const { logout } = useAuthActions();
  const user = useUser();

  const handleLogout = () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
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

  const getNotificationButtonClasses = () => {
    const baseClasses = 'relative p-2 rounded-full transition-all duration-300';

    if (isScrolled) {
      return `${baseClasses} text-gray-600 hover:text-orange-500 hover:bg-orange-50`;
    }
    return `${baseClasses} text-gray-700 hover:text-orange-500 hover:bg-white/20`;
  };

  const getAvatarContainerClasses = () => {
    const baseClasses = 'flex items-center space-x-2 p-1.5 rounded-full transition-all duration-300 cursor-pointer';

    if (isScrolled) {
      return `${baseClasses} hover:bg-gray-50 text-gray-700`;
    }
    return `${baseClasses} hover:bg-white/20 text-gray-800`;
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-3">
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className={getNotificationButtonClasses()}
          onClick={() => console.log('Show notifications')}
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>
      </div>

      {/* User Avatar Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={getAvatarContainerClasses()}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatar?.url} alt={user.fullName || user.username} />
              <AvatarFallback className="bg-orange-500 text-white font-medium text-sm">
                {getAvatarFallback(user)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex items-center space-x-1">
              <span className="text-sm font-medium">{user.fullName || user.username}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.fullName || user.username}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <p className="text-xs leading-none text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Hồ sơ cá nhân</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Cài đặt</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogout} variant="destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
