import React from 'react';

type SidebarContextType = {
  isCollapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  toggleMobile: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
    try {
      const v = localStorage.getItem('ownerSidebarCollapsed');
      return v === '1';
    } catch {
      return false;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      localStorage.setItem('ownerSidebarCollapsed', isCollapsed ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [isCollapsed]);

  // Close mobile sidebar when screen size changes to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value = React.useMemo(
    () => ({
      isCollapsed,
      setCollapsed: setIsCollapsed,
      toggle: () => setIsCollapsed((v) => !v),
      isMobileOpen,
      setMobileOpen: setIsMobileOpen,
      toggleMobile: () => setIsMobileOpen((v) => !v)
    }),
    [isCollapsed, isMobileOpen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export default SidebarProvider;

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
