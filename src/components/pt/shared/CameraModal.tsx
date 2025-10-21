import React from 'react';
import { Button } from '@/components/ui/button';
import type { CameraModalProps } from '@/types/components/pt/Progress';

export const CameraModal: React.FC<CameraModalProps> = ({ videoRef, onCapture, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
        <div className="mb-4">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
        </div>
        <div className="flex gap-3 justify-center">
          <Button type="button" onClick={onCapture} className="bg-[#F05A29] hover:bg-[#E04A1F]">
            Capture
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
