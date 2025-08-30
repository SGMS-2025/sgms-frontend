import { Toaster } from '@/components/ui/sonner';
import type { ToasterProps } from 'sonner';

const Toast = ({ ...props }: ToasterProps) => {
  return <Toaster position="top-right" duration={4000} {...props} />;
};

export { Toast };
