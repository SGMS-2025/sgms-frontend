import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Building, Plus } from 'lucide-react';
import type { BranchDisplay } from '@/types/api/Branch';

interface BranchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranch: BranchDisplay | null;
  branches: BranchDisplay[];
  onBranchSelect: (branch: BranchDisplay) => void;
  onAddBranch: () => void;
}

export const BranchSelectorModal: React.FC<BranchSelectorModalProps> = ({
  isOpen,
  onClose,
  currentBranch,
  branches,
  onBranchSelect,
  onAddBranch
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBranchSelect = (branch: BranchDisplay) => {
    onBranchSelect(branch);
    onClose();
  };

  const handleViewDetails = (branch: BranchDisplay) => {
    navigate(`/manage/branch/${branch._id}`);
    onClose();
  };

  const handleAddBranch = () => {
    onAddBranch();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-5">
        <div className="flex items-center justify-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t('branch_selector.current_branch')}</h3>
        </div>

        <div className="space-y-5">
          {/* Current Branch Details */}
          {currentBranch && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Profile Image */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-500">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={currentBranch.coverImage} alt={currentBranch.branchName} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 text-xl font-bold">
                      {currentBranch.branchName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-lg font-bold text-orange-500">{currentBranch.branchName}</h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-black flex-shrink-0" />
                  <span className="text-sm text-gray-700">{currentBranch.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
                    <span className="text-sm font-medium text-orange-500">{t('branch_selector.active_status')}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-black flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {currentBranch.managerId?.fullName || t('branch_selector.no_manager')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 text-sm font-semibold rounded-md"
                onClick={() => currentBranch && handleViewDetails(currentBranch)}
              >
                {t('branch_selector.view_details')}
              </Button>
            </div>
          )}

          {/* Other Branches */}
          <div className="space-y-3">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {branches && branches.length > 0 ? (
                branches
                  .filter((branch) => branch._id !== currentBranch?._id)
                  .map((branch) => (
                    <div
                      key={branch._id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => handleBranchSelect(branch)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={branch.coverImage} alt={branch.branchName} />
                        <AvatarFallback className="bg-orange-100 text-orange-600 text-sm font-semibold">
                          {branch.branchName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{branch.branchName}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <p className="text-xs text-gray-500 truncate">{branch.location}</p>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>{t('branch_selector.no_other_branches')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Add New Branch Button */}
          <div
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={handleAddBranch}
          >
            <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{t('branch_selector.add_branch')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
