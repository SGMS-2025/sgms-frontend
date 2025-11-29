import React from 'react';
import { CustomerClassCalendar } from '@/components/class/CustomerClassCalendar';

export const ClassCalendarPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CustomerClassCalendar />
    </div>
  );
};

export default ClassCalendarPage;
