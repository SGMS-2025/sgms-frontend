import React from 'react';
import { useParams } from 'react-router-dom';

const CustomerDetailPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Customer Detail</h1>
      <p>Customer ID: {customerId}</p>
    </div>
  );
};

export default CustomerDetailPage;
