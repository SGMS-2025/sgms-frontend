import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, User, LogOut, History, KeyRound, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState, useAuthActions } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { LOGO } from '@/constants/images';

export function Header() {
  // Use AuthContext to get user and role
  const { isAuthenticated, user } = useAuthState();
  const { logout } = useAuthActions();
  const isCustomer = isAuthenticated && user?.role?.toLowerCase() === 'customer';
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {isCustomer ? (
        // LOGGED IN CUSTOMER NAVBAR
        <>
          <nav className="flex items-center px-4 md:px-6 py-3 bg-[#f3f6f8] border-b border-gray-200 relative">
            {/* Mobile menu button - moved to left */}
            {isMobile && (
              <Button
                aria-label="Menu toggle"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#0f172a] text-white p-0 min-w-0 mr-3"
                onClick={toggleMobileMenu}
              >
                <Menu size={16} />
              </Button>
            )}

            {/* Logo placeholder - fixed width */}
            <div className={`${isMobile ? 'flex-1' : 'w-[180px]'} flex items-center`}>
              <button
                aria-label="Image placeholder button"
                className="flex items-center justify-center w-32 h-10 rounded-md overflow-hidden p-0 bg-[#d9d9d9] text-[#1e293b]"
                onClick={() => navigate('/')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/');
                  }
                }}
              >
                <img src={LOGO} alt="Logo image" className="w-full h-full object-cover" />
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
            <div className={`${isMobile ? 'w-auto' : 'w-[180px]'} flex items-center gap-3 justify-end`}>
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

          {/* Mobile sidebar overlay */}
          {isMobile && isMobileMenuOpen && (
            <div className="fixed inset-0 z-50">
              {/* Backdrop overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={closeMobileMenu}
              />

              {/* Sidebar */}
              <div
                className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                {/* Sidebar header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <img src="{LOGO}" alt="Logo image" className="w-8 h-8 object-cover rounded" />
                    <span className="ml-3 text-lg font-semibold text-gray-800">Menu</span>
                  </div>
                  <Button
                    aria-label="Close menu"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 p-0 min-w-0 hover:bg-gray-200"
                    onClick={closeMobileMenu}
                  >
                    <X size={16} />
                  </Button>
                </div>

                {/* Sidebar content */}
                <div className="flex flex-col h-full">
                  <ul className="flex flex-col py-4 px-4 space-y-2">
                    <li>
                      <Link
                        to="/"
                        className="flex items-center w-full px-4 py-3 rounded-lg bg-orange-50 text-[#f15a24] transition-colors hover:bg-orange-100 font-medium"
                        onClick={closeMobileMenu}
                      >
                        Về chúng tôi
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dich-vu"
                        className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-colors hover:bg-gray-50 font-medium"
                        onClick={closeMobileMenu}
                      >
                        Dịch vụ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/lich-su-dung-dich-vu"
                        className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-colors hover:bg-gray-50 font-medium"
                        onClick={closeMobileMenu}
                      >
                        Lịch sử sử dụng dịch vụ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/khieu-nai-va-danh-gia"
                        className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-colors hover:bg-gray-50 font-medium"
                        onClick={closeMobileMenu}
                      >
                        Khiếu nại &amp; đánh giá
                      </Link>
                    </li>
                  </ul>

                  {/* Mobile action buttons */}
                  <div className="px-4 py-4 space-y-3 border-t border-gray-200 mt-auto">
                    <Button
                      aria-label="Chat hỗ trợ"
                      className="flex w-full items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#0f172a] text-white text-sm font-medium hover:bg-gray-800"
                      onClick={closeMobileMenu}
                    >
                      <MessageSquare size={18} />
                      Chat hỗ trợ
                    </Button>
                    <Button
                      aria-label="Lịch tập"
                      className="flex w-full items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#f15a24] text-white text-sm font-medium hover:bg-orange-700"
                      onClick={closeMobileMenu}
                    >
                      <Calendar size={18} />
                      Lịch tập
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // NOT LOGGED IN NAVBAR - Using the new design
        <>
          {/* Header with Logo and Auth Buttons */}
          <div className="bg-gray-200 px-4 py-3 relative">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Mobile menu button for non-logged in users */}
              {isMobile && (
                <Button
                  aria-label="Menu toggle"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#0f172a] text-white p-0 min-w-0 mr-3"
                  onClick={toggleMobileMenu}
                >
                  <Menu size={14} />
                </Button>
              )}

              <button
                className={`${isMobile ? 'flex-1' : 'p-3'} bg-gray-300 rounded overflow-hidden flex items-center justify-center`}
                onClick={() => navigate('/')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/');
                  }
                }}
                aria-label="Về trang chủ"
              >
                <img src="{LOGO}" alt="Logo image" className="w-6 h-6 object-cover" />
              </button>

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

          {/* Mobile sidebar for non-logged in users */}
          {!isAuthenticated && isMobile && isMobileMenuOpen && (
            <div className="fixed inset-0 z-50">
              {/* Backdrop overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={closeMobileMenu}
              />

              {/* Sidebar */}
              <div
                className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
                  isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                {/* Sidebar header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <img src="{LOGO}" alt="Logo image" className="w-8 h-8 object-cover rounded" />
                    <span className="ml-3 text-lg font-semibold text-gray-800">Menu</span>
                  </div>
                  <Button
                    aria-label="Close menu"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 p-0 min-w-0 hover:bg-gray-200"
                    onClick={closeMobileMenu}
                  >
                    <X size={16} />
                  </Button>
                </div>

                {/* Sidebar content */}
                <div className="flex flex-col h-full">
                  <ul className="flex flex-col py-4 px-4 space-y-2">
                    <li>
                      <Link
                        to="/"
                        className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-colors hover:bg-gray-50 font-medium"
                        onClick={closeMobileMenu}
                      >
                        Giới thiệu
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dich-vu"
                        className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-colors hover:bg-gray-50 font-medium"
                        onClick={closeMobileMenu}
                      >
                        Các dịch vụ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/lien-he"
                        className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-colors hover:bg-gray-50 font-medium"
                        onClick={closeMobileMenu}
                      >
                        Liên hệ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/ve-chung-toi"
                        className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-colors hover:bg-gray-50 font-medium"
                        onClick={closeMobileMenu}
                      >
                        Về chúng tôi
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
