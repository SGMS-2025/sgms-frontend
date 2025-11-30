import { Toaster } from '@/components/ui/sonner';
import type { ToasterProps } from 'sonner';

const Toast = ({ ...props }: ToasterProps) => {
  return <Toaster {...props} />;
};

export { Toast };
