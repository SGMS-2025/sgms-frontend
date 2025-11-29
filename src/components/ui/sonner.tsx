import { useTheme } from '@/contexts/ThemeContext';
import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-right"
      duration={4500}
      closeButton={false}
      expand
      offset={14}
      gap={12}
      visibleToasts={5}
      className="toaster"
      toastOptions={{
        classNames: {
          toast: 'modern-toast',
          title: 'modern-toast__title',
          description: 'modern-toast__description',
          actionButton: 'modern-toast__action',
          cancelButton: 'modern-toast__cancel',
          closeButton: 'modern-toast__close'
        }
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)'
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
