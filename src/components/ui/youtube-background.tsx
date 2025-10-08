import React, { useEffect, useMemo, useState } from 'react';

interface YouTubeBackgroundProps {
  videoId: string;
  className?: string;
  overlay?: boolean;
  blur?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

// Validate YouTube video ID format (11 characters, alphanumeric + - and _)
const isValidYouTubeVideoId = (videoId: string): boolean => {
  const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;
  return youtubeIdPattern.test(videoId);
};

const YouTubeBackground: React.FC<YouTubeBackgroundProps> = ({
  videoId,
  className = '',
  overlay = false,
  blur = false,
  autoplay = true,
  muted = true,
  loop = true
}) => {
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Validate video ID on mount
  useEffect(() => {
    if (!isValidYouTubeVideoId(videoId)) {
      console.error(`Invalid YouTube video ID: "${videoId}". Expected format: 11 alphanumeric characters.`);
    }
  }, [videoId]);

  const youtubeUrl = useMemo(() => {
    if (!origin) {
      return '';
    }

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: muted ? '1' : '0',
      loop: loop ? '1' : '0',
      playlist: videoId,
      controls: '0',
      showinfo: '0',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      fs: '0',
      disablekb: '1',
      start: '0',
      end: '0',
      cc_load_policy: '0',
      playsinline: '1',
      enablejsapi: '0',
      origin
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [autoplay, loop, muted, origin, videoId]);

  return (
    <div className={`youtube-background absolute inset-0 ${className}`}>
      {/* YouTube Video Background */}
      {youtubeUrl && (
        <iframe
          width="100%"
          height="100%"
          src={youtubeUrl}
          title="Gym Background Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="w-full h-full object-cover"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(255, 255, 255, 0.85) 50%, rgba(251, 191, 36, 0.15) 100%)',
            zIndex: 3
          }}
        />
      )}

      {/* Additional blur layer */}
      {blur && (
        <div
          className="absolute inset-0 bg-black/40"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 2
          }}
        />
      )}
    </div>
  );
};

export default YouTubeBackground;
