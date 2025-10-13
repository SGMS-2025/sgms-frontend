import React, { useRef, useEffect } from 'react';

interface VideoBackgroundProps {
  videoSrc?: string;
  gifSrc?: string;
  fallbackImage?: string;
  className?: string;
  overlay?: boolean;
  blur?: boolean;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoSrc,
  gifSrc,
  fallbackImage,
  className = '',
  overlay = true,
  blur = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && videoSrc) {
      video.play().catch(() => {
        // Autoplay failed, fallback to image
        console.log('Video autoplay failed, using fallback');
      });
    }
  }, [videoSrc]);

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Video Background */}
      {videoSrc && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={fallbackImage}
          style={{
            imageRendering: '-webkit-optimize-contrast'
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc} type="video/webm" />
        </video>
      )}

      {/* GIF Background */}
      {gifSrc && !videoSrc && (
        <img
          src={gifSrc}
          alt="Gym background"
          className="w-full h-full object-cover"
          style={{
            imageRendering: '-webkit-optimize-contrast'
          }}
        />
      )}

      {/* Fallback Image */}
      {!videoSrc && !gifSrc && fallbackImage && (
        <img
          src={fallbackImage}
          alt="Gym background"
          className={`w-full h-full object-cover ${blur ? 'blur-sm' : ''}`}
        />
      )}

      {/* Default Gym Background */}
      {!videoSrc && !gifSrc && !fallbackImage && (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 flex items-center justify-center">
          <div className="text-center text-white/60">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm font-medium">Gym Background</p>
            <p className="text-xs opacity-75">Add video/gif for better effect</p>
          </div>
        </div>
      )}

      {/* Overlay */}
      {overlay && <div className="absolute inset-0 bg-gradient-to-br from-orange-50/90 via-white/80 to-amber-50/90" />}

      {/* Additional blur layer */}
      {blur && <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />}
    </div>
  );
};

export default VideoBackground;
