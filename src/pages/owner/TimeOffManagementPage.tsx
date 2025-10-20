import React from 'react';
import TimeOffManagementLayout from '@/components/timeoff/TimeOffManagementLayout';

const TimeOffManagementPage: React.FC = () => {
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export time off data');
  };

  return (
    <div className="h-full">
      <TimeOffManagementLayout showStats={true} onExport={handleExport} />
    </div>
  );
};

export default TimeOffManagementPage;
