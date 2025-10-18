import React from 'react';
import TimeOffPage from '@/components/timeoff/TimeOffPage';

const TechnicianTimeOffPage: React.FC = () => {
  return <TimeOffPage userRole="technician" showHighlight={false} />;
};

export default TechnicianTimeOffPage;
