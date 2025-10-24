import React, { useState } from 'react';
import StaffScheduleCalendar from '@/components/workshift/StaffScheduleCalendar';

const PTCalendarPage: React.FC = () => {
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();

  const handleStaffSelect = (staffId: string | undefined) => {
    setSelectedStaffId(staffId);
  };

  return (
    <div className="h-full">
      <StaffScheduleCalendar selectedStaffId={selectedStaffId} onStaffSelect={handleStaffSelect} userRole="staff" />
    </div>
  );
};

export default PTCalendarPage;
