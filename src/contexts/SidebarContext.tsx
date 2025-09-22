import React from 'react';

type SidebarContextType = {
  isCollapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
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

  React.useEffect(() => {
    try {
      localStorage.setItem('ownerSidebarCollapsed', isCollapsed ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [isCollapsed]);

  const value = React.useMemo(
    () => ({
      isCollapsed,
      setCollapsed: setIsCollapsed,
      toggle: () => setIsCollapsed((v) => !v)
    }),
    [isCollapsed]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export default SidebarProvider;

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
