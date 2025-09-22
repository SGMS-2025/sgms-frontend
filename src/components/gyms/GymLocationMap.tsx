import React from 'react';
import { MapPin, Navigation, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BranchBasic } from '@/types/api/Branch';

interface GymLocationMapProps {
  branch: BranchBasic;
}

export const GymLocationMap: React.FC<GymLocationMapProps> = ({ branch }) => {
  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 bg-gym-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-gym-orange" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Địa chỉ: {branch.branchName}</h3>
          <p className="text-gray-600">{branch.location}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-gray-100 h-64 rounded-lg overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4609765566655!2d106.69814611533532!3d10.776889092318193!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4a5a3b0c6d%3A0x1234567890123456!2sThe%20New%20Gym!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Gym Location Map"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="bg-gym-orange hover:bg-gym-orange/90 text-white font-semibold"
            onClick={() => {
              const address = encodeURIComponent(branch.location);
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
            }}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Chỉ đường
          </Button>

          <Button
            variant="outline"
            className="font-semibold"
            onClick={() => {
              const phoneNumber = branch.hotline || branch.phoneNumber || '0123456789';
              window.open(`tel:${phoneNumber}`, '_self');
            }}
          >
            <Phone className="w-4 h-4 mr-2" />
            Gọi điện: {branch.hotline || branch.phoneNumber || '0123456789'}
          </Button>
        </div>
      </div>
    </div>
  );
};
