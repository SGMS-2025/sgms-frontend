import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import type { PhotoUploadSectionProps } from '@/types/components/pt/Progress';

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  maxPhotos,
  existingPhotos,
  newPhotos,
  canAddMore,
  fileInputRef,
  onOpenCamera,
  onFileUpload,
  onRemovePhoto,
  onUploadClick
}) => {
  const hasPhotos = existingPhotos.length > 0 || newPhotos.length > 0;

  return (
    <div className="space-y-3">
      <Label>Training Photos (max {maxPhotos})</Label>

      {/* Camera and Upload Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onOpenCamera}
          disabled={!canAddMore}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Take Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onUploadClick}
          disabled={!canAddMore}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Photo Preview */}
      {hasPhotos && (
        <div className="grid grid-cols-3 gap-3">
          {/* Existing photos */}
          {existingPhotos.map((photo, index) => (
            <div key={`existing-${index}`} className="relative group">
              <img
                src={photo.url}
                alt={`Existing Training ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onRemovePhoto(index)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* New photos */}
          {newPhotos.map((photo, index) => (
            <div key={`new-${index}`} className="relative group">
              <img
                src={photo}
                alt={`New Training ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onRemovePhoto(existingPhotos.length + index)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!hasPhotos && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="py-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No photos added yet</p>
            <p className="text-xs text-gray-400">Capture or upload training photos</p>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFileUpload} className="hidden" />
    </div>
  );
};
