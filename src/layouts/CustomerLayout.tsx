import React from 'react';
import { CustomerSidebar } from '@/components/layout/CustomerSidebar';
import { CustomerHeader } from '@/components/dashboard/CustomerHeader';
import { BaseLayout } from './BaseLayout';

const CustomerLayout: React.FC = () => {
  return <BaseLayout SidebarComponent={CustomerSidebar} HeaderComponent={CustomerHeader} />;
};

export { CustomerLayout };
