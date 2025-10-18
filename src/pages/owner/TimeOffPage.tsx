import React from 'react';
import TimeOffPage from '@/components/timeoff/TimeOffPage';

const OwnerTimeOffPage: React.FC = () => {
  return <TimeOffPage userRole="owner" showHighlight={true} />;
};

export default OwnerTimeOffPage;
