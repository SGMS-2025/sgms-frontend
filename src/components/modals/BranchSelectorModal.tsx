import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  anchorEl?: Element | null;
  anchorRect?: DOMRect | null;
}

export const BranchSelectorModal: React.FC<BranchSelectorModalProps> = ({
  isOpen,
  onClose,
  currentBranch,
  branches,
  onBranchSelect,
  onAddBranch,
  anchorEl,
  anchorRect
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

  const panelRef = useRef<HTMLDialogElement>(null);
  const handleDialogCancel = (event: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    event.preventDefault();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, anchorEl]);

  const anchored = Boolean(anchorRect);

  const style: React.CSSProperties | undefined = useMemo(() => {
    if (!anchored) return undefined;
    const top = Math.min(Math.max(8, anchorRect?.top ?? 0), window.innerHeight - 24 - 400);
    const left = Math.max(8, anchorRect ? anchorRect.right + 8 : 0);
    return { position: 'fixed', top, left };
  }, [anchored, anchorRect]);

  if (!isOpen) return null;

  const panel = (
    <dialog
      ref={panelRef}
      open
      aria-modal="true"
      className="w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[1001] max-h-[80vh] overflow-y-auto p-0"
      style={style}
      onCancel={handleDialogCancel}
    >
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
                    <button
                      type="button"
                      key={branch._id}
                      className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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
                    </button>
                  ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>{t('branch_selector.no_other_branches')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Add New Branch Button */}
          <button
            type="button"
            className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            onClick={handleAddBranch}
          >
            <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">{t('branch_selector.add_branch')}</p>
            </div>
          </button>
        </div>
      </div>
    </dialog>
  );

  return createPortal(
    anchored ? (
      panel
    ) : (
      <div className="fixed inset-0 z-[1000]">
        {/* Backdrop button for closing */}
        <button
          type="button"
          className="absolute inset-0 w-full h-full bg-black/20 border-0 cursor-default"
          aria-label={t('branch_selector.close_modal')}
          onClick={onClose}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
        />
        {/* Modal content */}
        <div className="relative z-10 flex items-start justify-center p-4 pointer-events-none min-h-full">
          <div className="mt-16 pointer-events-auto">{panel}</div>
        </div>
      </div>
    ),
    document.body
  );
};
