import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, User, LogOut, History, KeyRound, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState, useAuthActions } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export function Header() {
  // Use AuthContext to get user and role
  const { isAuthenticated, user } = useAuthState();
  const { logout } = useAuthActions();
  const isCustomer = isAuthenticated && user?.role?.toLowerCase() === 'customer';
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
    setIsMobileMenuOpen(false);
  };
  return (
    <>
      {isCustomer ? (
        // LOGGED IN CUSTOMER NAVBAR
        <>
          <nav className="flex items-center px-4 md:px-6 py-3 bg-[#f3f6f8] border-b border-gray-200">
            {/* Logo placeholder - fixed width */}
            <div className={`${isMobile ? 'w-auto' : 'w-[180px]'} flex items-center`}>
              <button
                aria-label="Image placeholder button"
                className="flex items-center justify-center w-32 h-10 rounded-md overflow-hidden p-0 bg-[#d9d9d9] text-[#1e293b]"
              >
                <img
                  src="https://res.cloudinary.com/dqdwaljcc/image/upload/v1756985248/sgms_avatars/lspoumruhhozuzeoszky.png"
                  alt="Logo image"
                  className="w-full h-full object-cover"
                />
              </button>
            </div>

            {/* Navigation Links - Only visible on desktop */}
            {!isMobile && (
              <div className="flex-1 flex justify-center">
                <ul className="flex items-center gap-6 text-sm font-normal text-[#f15a24]">
                  <li>
                    <Link
                      to="/"
                      className="inline-flex items-center justify-center h-8 px-4 rounded-full bg-white text-[#f15a24] transition-colors duration-200 ease-in-out hover:bg-[#fef6f3]"
                    >
                      Về chúng tôi
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dich-vu"
                      className="inline-flex items-center justify-center h-8 px-4 rounded-full bg-white text-[#f15a24] transition-colors duration-200 ease-in-out hover:bg-[#fef6f3]"
                    >
                      Dịch vụ
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/lich-su-dung-dich-vu"
                      className="inline-flex items-center justify-center h-8 px-4 rounded-full bg-white text-[#f15a24] transition-colors duration-200 ease-in-out hover:bg-[#fef6f3]"
                    >
                      Lịch sử sử dụng dịch vụ
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/khieu-nai-va-danh-gia"
                      className="inline-flex items-center justify-center h-8 px-4 rounded-full bg-white text-[#f15a24] transition-colors duration-200 ease-in-out hover:bg-[#fef6f3]"
                    >
                      Khiếu nại &amp; đánh giá
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {/* Right Side Controls */}
            <div className={`${isMobile ? 'flex-1 justify-end' : 'w-[180px]'} flex items-center gap-3 justify-end`}>
              {!isMobile && (
                <>
                  <Button
                    aria-label="Chat icon button"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#0f172a] text-white p-0 min-w-0"
                  >
                    <MessageSquare size={16} />
                  </Button>
                  <Button
                    aria-label="Lịch tập button"
                    className="inline-flex items-center justify-center gap-1.5 px-3 h-10 rounded-md bg-[#0f172a] text-white text-sm font-normal"
                  >
                    <Calendar size={16} />
                    Lịch tập
                  </Button>
                </>
              )}

              {/* Mobile menu toggle */}
              {isMobile && (
                <Button
                  aria-label="Menu toggle"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#0f172a] text-white p-0 min-w-0"
                  onClick={toggleMobileMenu}
                >
                  {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                </Button>
              )}

              {/* User profile dropdown - always visible */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label="User profile button"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#f15a24] text-white p-0 min-w-0"
                  >
                    <User size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px] p-2 rounded-lg shadow-lg border bg-white">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => navigate('/profile')}
                      className="cursor-pointer px-4 py-2 rounded-md transition-colors hover:bg-orange-50 hover:text-orange-600 font-medium"
                    >
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      Xem hồ sơ cá nhân
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate('/lich-su-giao-dich')}
                      className="cursor-pointer px-4 py-2 rounded-md transition-colors hover:bg-orange-50 hover:text-orange-600 font-medium"
                    >
                      <History className="mr-2 h-4 w-4 text-gray-500" />
                      Xem lịch sử giao dịch
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate('/doi-mat-khau')}
                      className="cursor-pointer px-4 py-2 rounded-md transition-colors hover:bg-orange-50 hover:text-orange-600 font-medium"
                    >
                      <KeyRound className="mr-2 h-4 w-4 text-gray-500" />
                      Đổi mật khẩu
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 h-px bg-gray-200" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer px-4 py-2 rounded-md transition-colors hover:bg-red-50 hover:text-red-600 font-medium"
                    >
                      <LogOut className="mr-2 h-4 w-4 text-gray-500" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          {/* Mobile menu - appears when menu is toggled */}
          {isMobile && isMobileMenuOpen && (
            <div className="bg-[#f3f6f8] border-b border-gray-200 shadow-md">
              <ul className="flex flex-col py-3 px-4">
                <li className="py-2">
                  <Link
                    to="/"
                    className="block w-full px-4 py-2 rounded-md bg-white text-[#f15a24] transition-colors hover:bg-[#fef6f3]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Về chúng tôi
                  </Link>
                </li>
                <li className="py-2">
                  <Link
                    to="/dich-vu"
                    className="block w-full px-4 py-2 rounded-md bg-white text-[#f15a24] transition-colors hover:bg-[#fef6f3]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dịch vụ
                  </Link>
                </li>
                <li className="py-2">
                  <Link
                    to="/lich-su-dung-dich-vu"
                    className="block w-full px-4 py-2 rounded-md bg-white text-[#f15a24] transition-colors hover:bg-[#fef6f3]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Lịch sử sử dụng dịch vụ
                  </Link>
                </li>
                <li className="py-2">
                  <Link
                    to="/khieu-nai-va-danh-gia"
                    className="block w-full px-4 py-2 rounded-md bg-white text-[#f15a24] transition-colors hover:bg-[#fef6f3]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Khiếu nại &amp; đánh giá
                  </Link>
                </li>
                <li className="py-2">
                  <Button
                    aria-label="Chat icon button"
                    className="flex w-full items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#0f172a] text-white text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <MessageSquare size={16} />
                    Chat hỗ trợ
                  </Button>
                </li>
                <li className="py-2">
                  <Button
                    aria-label="Lịch tập button"
                    className="flex w-full items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#0f172a] text-white text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Calendar size={16} />
                    Lịch tập
                  </Button>
                </li>
              </ul>
            </div>
          )}
        </>
      ) : (
        // NOT LOGGED IN NAVBAR - Using the new design
        <>
          {/* Header with Logo and Auth Buttons */}
          <div className="bg-gray-200 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div
                className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-300 rounded overflow-hidden flex items-center justify-center`}
              >
                {isMobile ? (
                  <img
                    src="https://res.cloudinary.com/dqdwaljcc/image/upload/v1756985248/sgms_avatars/lspoumruhhozuzeoszky.png"
                    alt="Logo image"
                    className="w-6 h-6 object-cover"
                  />
                ) : (
                  <img
                    src="https://res.cloudinary.com/dqdwaljcc/image/upload/v1756985248/sgms_avatars/lspoumruhhozuzeoszky.png"
                    alt="Logo image"
                    className="w-6 h-6 object-cover"
                  />
                )}
              </div>

              {/* Navigation Links - Only visible on desktop */}
              {!isMobile && (
                <div className="flex-1 flex justify-center">
                  <ul className="flex items-center gap-4 text-sm font-normal text-gray-700">
                    <li>
                      <Link
                        to="/"
                        className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white text-gray-700 transition-colors duration-200 ease-in-out hover:bg-gray-50"
                      >
                        Giới thiệu
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dich-vu"
                        className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white text-gray-700 transition-colors duration-200 ease-in-out hover:bg-gray-50"
                      >
                        Các dịch vụ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/lien-he"
                        className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white text-gray-700 transition-colors duration-200 ease-in-out hover:bg-gray-50"
                      >
                        Liên hệ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/ve-chung-toi"
                        className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white text-gray-700 transition-colors duration-200 ease-in-out hover:bg-gray-50"
                      >
                        Về chúng tôi
                      </Link>
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex items-center space-x-2 md:space-x-3">
                {isMobile && (
                  <Button
                    aria-label="Menu toggle"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#0f172a] text-white p-0 min-w-0 mr-1"
                    onClick={toggleMobileMenu}
                  >
                    {isMobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className={`text-orange-500 bg-white hover:bg-orange-600 hover:text-white text-xs md:text-sm rounded-full ${isMobile ? 'px-3 py-1 h-8' : ''}`}
                  asChild
                >
                  <Link to="/dang-ky">Đăng ký</Link>
                </Button>
                <Button
                  className={`bg-orange-600 hover:bg-orange-700 text-white text-xs md:text-sm rounded-full ${isMobile ? 'px-3 py-1 h-8' : 'px-6'}`}
                  asChild
                >
                  <Link to="/dang-nhap">Đăng nhập</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile navigation menu for users who are not logged in */}
          {!isAuthenticated && isMobile && isMobileMenuOpen && (
            <div className="bg-gray-100 shadow-md border-b border-gray-200">
              <ul className="flex flex-col py-2 px-4">
                <li className="py-1.5">
                  <Link
                    to="/"
                    className="block w-full px-3 py-2 rounded-md bg-white text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Giới thiệu
                  </Link>
                </li>
                <li className="py-1.5">
                  <Link
                    to="/dich-vu"
                    className="block w-full px-3 py-2 rounded-md bg-white text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Các dịch vụ
                  </Link>
                </li>
                <li className="py-1.5">
                  <Link
                    to="/lien-he"
                    className="block w-full px-3 py-2 rounded-md bg-white text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Liên hệ
                  </Link>
                </li>
                <li className="py-1.5">
                  <Link
                    to="/ve-chung-toi"
                    className="block w-full px-3 py-2 rounded-md bg-white text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Về chúng tôi
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
