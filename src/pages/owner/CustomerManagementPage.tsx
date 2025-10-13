import React from 'react';
import { CustomerManagement } from '@/components/dashboard/CustomerManagement';

const CustomerManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 rounded-3xl overflow-hidden">
      <div>
        <CustomerManagement />
      </div>
    </div>
  );
};

export default CustomerManagementPage;
