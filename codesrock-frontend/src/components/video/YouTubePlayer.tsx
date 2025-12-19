import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  onProgressUpdate?: (watchedSeconds: number, totalSeconds: number) => void;
  onComplete?: () => void;
  autoplay?: boolean;
  showControls?: boolean;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title,
  onProgressUpdate,
  onComplete,
  autoplay = false,
}) => {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if YouTube API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      // Load YouTube IFrame API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Initialize player when API is ready
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const initPlayer = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new (window as any).YT.Player(`player-${videoId}`, {
      videoId: videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 1, // Always show YouTube's native controls for seeking
        modestbranding: 1,
        rel: 0,
        fs: 1, // Enable fullscreen button
      },
      events: {
        onReady: (event: any) => {
          // Start progress tracking
          startProgressTracking(event.target);
        },
        onStateChange: (event: any) => {
          if (event.data === (window as any).YT.PlayerState.ENDED) {
            if (onComplete) {
              onComplete();
            }
          }
        },
      },
    });
  };

  const startProgressTracking = (ytPlayer: any) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
        try {
          const currentTime = ytPlayer.getCurrentTime();
          const totalTime = ytPlayer.getDuration();

          if (onProgressUpdate && totalTime > 0) {
            onProgressUpdate(currentTime, totalTime);
          }
        } catch (e) {
          // Player might be destroyed
        }
      }
    }, 5000); // Update every 5 seconds instead of every second
  };

  return (
    <Card className="w-full overflow-hidden">
      <div className="aspect-video bg-black" ref={containerRef}>
        <div id={`player-${videoId}`} className="w-full h-full" />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
    </Card>
  );
};
