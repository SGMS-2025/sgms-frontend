import React from 'react';
import TimeOffPage from '@/components/timeoff/TimeOffPage';

const PTTimeOffPage: React.FC = () => {
  return <TimeOffPage userRole="pt" showHighlight={false} />;
};

export default PTTimeOffPage;
