import React from 'react';
import { CustomerManagement } from '@/components/dashboard/CustomerManagement';

const CustomerManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <CustomerManagement />
      </div>
    </div>
  );
};

export default CustomerManagementPage;
