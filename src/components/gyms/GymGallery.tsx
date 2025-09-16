import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GymGalleryProps } from '@/types/gym';

export const GymGallery: React.FC<GymGalleryProps> = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(1);

  // Load image at index 1 on component mount
  React.useEffect(() => {
    if (images && images.length > 1) {
      setCurrentImageIndex(1);
    } else if (images && images.length === 1) {
      setCurrentImageIndex(0);
    }
  }, [images]);

  const nextImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gym-orange mb-6">MỘT SỐ HÌNH ẢNH PHÒNG TẬP</h2>
      <div className="space-y-4">
        <div className="relative">
          <img
            src={images[currentImageIndex] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'}
            alt="Gym Interior"
            className="w-full h-96 object-cover rounded-lg"
          />
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={prevImage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={nextImage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-6 gap-2">
            {images.map((image, index) => (
              <button
                key={`gym-image-${image}-${index}`}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative overflow-hidden rounded-lg ${
                  index === currentImageIndex ? 'ring-2 ring-gym-orange' : ''
                }`}
              >
                <img
                  src={image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200'}
                  alt={`Gym view ${index + 1}`}
                  className="w-full h-20 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
