import React, { useState } from 'react';
import StaffScheduleCalendar from '@/components/workshift/StaffScheduleCalendar';

const TechnicianCalendarPage: React.FC = () => {
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();

  const handleStaffSelect = (staffId: string | undefined) => {
    setSelectedStaffId(staffId);
  };

  return (
    <div className="h-screen">
      <StaffScheduleCalendar selectedStaffId={selectedStaffId} onStaffSelect={handleStaffSelect} />
    </div>
  );
};

export default TechnicianCalendarPage;
