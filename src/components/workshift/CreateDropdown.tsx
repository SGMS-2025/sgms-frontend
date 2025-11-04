import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown, Clock, Settings } from 'lucide-react';
import { cn } from '@/utils/utils';
import { useWorkshiftPermissions } from '@/hooks/useWorkshiftPermissions';

interface CreateDropdownProps {
  onCreateWorkShift: () => void;
  onBranchConfig: () => void;
  className?: string;
}

const CreateDropdown: React.FC<CreateDropdownProps> = ({ onCreateWorkShift, onBranchConfig, className }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { canCreateWorkshift } = useWorkshiftPermissions();

  const handleCreateWorkShift = () => {
    setIsOpen(false);
    onCreateWorkShift();
  };

  const handleBranchConfig = () => {
    setIsOpen(false);
    onBranchConfig();
  };

  // If user cannot create workshifts, don't render the dropdown
  if (!canCreateWorkshift()) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            'w-full bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 hover:border-orange-300 transition-all duration-200 shadow-sm hover:shadow-md',
            className
          )}
        >
          <Plus className="h-4 w-4 mr-2 text-orange-600" />
          {t('workshift.create')}
          <ChevronDown className="h-4 w-4 ml-2 text-orange-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={handleCreateWorkShift} className="cursor-pointer">
          <Clock className="mr-2 h-4 w-4" />
          <span>{t('workshift.create_workshift')}</span>
        </DropdownMenuItem>
        {/* Create Schedule option hidden - feature not needed */}
        {/* <DropdownMenuItem onClick={handleCreateSchedule} className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{t('workshift.create_schedule')}</span>
        </DropdownMenuItem> */}
        <DropdownMenuItem onClick={handleBranchConfig} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Branch Working Config</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateDropdown;
