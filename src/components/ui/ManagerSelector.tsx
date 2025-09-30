import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Manager {
  _id: string;
  fullName: string;
  email: string;
  status: string;
}

interface ManagerSelectorProps {
  managers: Manager[];
  selectedManagerIds: string[];
  onManagerChange: (managerIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ManagerSelector: React.FC<ManagerSelectorProps> = ({
  managers,
  selectedManagerIds,
  onManagerChange,
  disabled = false,
  placeholder
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter managers based on search term and active status
  const filteredManagers = managers.filter(
    (manager) =>
      manager.status === 'ACTIVE' &&
      (manager.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get selected managers
  const selectedManagers = managers.filter((manager) => selectedManagerIds.includes(manager._id));

  // Handle manager selection
  const handleManagerSelect = (managerId: string) => {
    if (selectedManagerIds.includes(managerId)) {
      // Remove manager
      onManagerChange(selectedManagerIds.filter((id) => id !== managerId));
    } else {
      // Add manager
      onManagerChange([...selectedManagerIds, managerId]);
    }
  };

  // Handle remove manager
  const handleRemoveManager = (managerId: string) => {
    onManagerChange(selectedManagerIds.filter((id) => id !== managerId));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Managers Display */}
      <div className="min-h-[48px] p-3 border border-gray-300 rounded-lg bg-white flex flex-wrap gap-2 items-center">
        {selectedManagers.length > 0 ? (
          selectedManagers.map((manager) => (
            <div
              key={manager._id}
              className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
            >
              <User className="w-4 h-4" />
              <span className="font-medium">{manager.fullName}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveManager(manager._id)}
                  className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        ) : (
          <span className="text-gray-500 text-sm">{placeholder || t('branch_detail.no_managers_available')}</span>
        )}

        {/* Dropdown Toggle Button */}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto flex items-center gap-2"
          >
            <span className="text-sm">{isOpen ? t('common.cancel') : t('branch_detail.manager')}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Manager List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredManagers.length > 0 ? (
              filteredManagers.map((manager) => (
                <div
                  key={manager._id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleManagerSelect(manager._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleManagerSelect(manager._id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className={`w-4 h-4 border-2 rounded ${
                      selectedManagerIds.includes(manager._id) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                    }`}
                  >
                    {selectedManagerIds.includes(manager._id) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{manager.fullName}</div>
                    <div className="text-sm text-gray-500">{manager.email}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? t('common.no_results') : t('branch_detail.no_managers_available')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerSelector;
