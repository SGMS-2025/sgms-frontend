import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Clock, Camera, Upload, Zap } from 'lucide-react';
import { formatFileSize } from '@/utils/imageUtils';

export interface PhotoUploadStatusProps {
  isProcessing: boolean;
  processingProgress: number;
  totalPhotos: number;
  maxPhotos: number;
  totalSize?: number;
  compressionSavings?: number;
  errors?: string[];
  showDetails?: boolean;
}

export const PhotoUploadStatus: React.FC<PhotoUploadStatusProps> = ({
  isProcessing,
  processingProgress,
  totalPhotos,
  maxPhotos,
  totalSize = 0,
  compressionSavings = 0,
  errors = [],
  showDetails = true
}) => {
  const getStatusIcon = () => {
    if (errors.length > 0) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (isProcessing) {
      return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
    if (totalPhotos > 0) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    return <Camera className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (errors.length > 0) {
      return `${errors.length} error(s) occurred`;
    }
    if (isProcessing) {
      return 'Processing photos...';
    }
    if (totalPhotos > 0) {
      return `${totalPhotos}/${maxPhotos} photos ready`;
    }
    return 'No photos uploaded';
  };

  const getStatusColor = () => {
    if (errors.length > 0) return 'destructive';
    if (isProcessing) return 'secondary';
    if (totalPhotos > 0) return 'default';
    return 'outline';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {getStatusIcon()}
          Photo Upload Status
          <Badge variant={getStatusColor()} className="ml-auto">
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Processing...</span>
              <span className="font-medium">{Math.round(processingProgress)}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
          </div>
        )}

        {/* Summary Stats */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">Photos:</span>
              <span className="font-medium">
                {totalPhotos}/{maxPhotos}
              </span>
            </div>

            {totalSize > 0 && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{formatFileSize(totalSize)}</span>
              </div>
            )}
          </div>
        )}

        {/* Compression Savings */}
        {compressionSavings > 0 && (
          <div className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded-md">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="text-green-700">Saved {formatFileSize(compressionSavings)} through compression</span>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Photo Limit Warning */}
        {totalPhotos >= maxPhotos - 1 && !isProcessing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {totalPhotos >= maxPhotos
                ? 'Maximum photos reached. Remove a photo to add more.'
                : 'Almost at maximum photo limit.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
