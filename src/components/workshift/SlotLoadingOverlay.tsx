import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface SlotLoadingOverlayProps {
  isLoading: boolean;
}

export const SlotLoadingOverlay: React.FC<SlotLoadingOverlayProps> = ({ isLoading }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isLoading || !mounted) return null;

  // Use portal to render at document.body for immediate rendering
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      style={{
        animation: 'fadeIn 0.15s ease-out',
        willChange: 'opacity',
        pointerEvents: 'auto'
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4"
        style={{
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity'
        }}
      >
        <div className="relative flex items-center justify-center">
          <Loader2
            className="h-12 w-12 text-orange-600"
            style={{
              animation: 'spin 0.8s linear infinite',
              strokeWidth: 2.5
            }}
          />
          <div
            className="absolute inset-0 h-12 w-12 rounded-full bg-orange-200"
            style={{
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
              opacity: 0.4
            }}
          ></div>
        </div>
        <p className="text-base font-semibold text-gray-800">Đang tải chi tiết ca làm...</p>
        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"
            style={{
              animation: 'shimmer 1.5s ease-in-out infinite',
              backgroundSize: '200% 100%'
            }}
          ></div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.85) translateY(10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};
