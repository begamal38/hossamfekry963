import { useCallback, useEffect, useRef, useState } from 'react';

const NOTIFICATION_SOUND_KEY = 'notification_sound_enabled';

// Simple notification sound - base64 encoded short beep
const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVlLgNLq4bCEcGVojMzh3sCWhXZ0fqnL1s6+nohxYV5pl77Sz8S0m4dxX1lee6K2wL2vnIp3ZGBlfJm0u7msl4Z2aGZqfpittrSoi4J1amhtfJWqsrCkiH51bW1xfpKnra2jh392cXF1gI+iqqmfhX52dHR4gYydpqWcgn13d3h7goibop+XfHt4eXt/hIqXnJmSe3p6e32BhYiTmJWPe3t8fH+DhYaQk5CLeHt9foGFhoeOkI2Gd3t+gIOHiIiLjYqCd3uAgoWIioqJi4iBd3yBg4aJi4uJioZ/dnyChIeKjIyJiYR9dX2ChoeKjIyJh4J8dH2Dh4mLjYuIhX90d4CHiouNjImFgHl2fYSIi42NiYWAeXR8g4iLjo2JhH94dH2EiYyOjYiDfXZzfYWKjY+NiIF7dHJ+h4uOj4yGf3hzcn+IjI+PjIV9dXFyf4mNkJCLhHtzcHKAio6QkIqDenFvcoGLj5CQiYF4b25ygoySk5GIf3ZtbnKDjpSUkYd9dGtscYSQlZaThn1yam1yh5KWl5ODemtqa3KIk5iYkoJ4amhqc4mVmZmRgHZoZmpzipaamlB/dGZmanSLmJuai35yZGVqdI2anZqIfG9iY2p1j5ydnIh6bmBianuSn5+diXhsX2FqfZWgoJ2Hd2teYGt/mKKhn4R1aVxfa4Kao6OegXNoW15sgZyjpaCCcWZaXW2DnaanooByY1hbbYeiqamjfW5hVlluhqSrq6R7al9TWW+Jqq6spnhmWlVXcouvsbCjdGRWU1d1jrO0sqFwX1NRVnmRtri1nmxaT01Ue5W6u7idZlVMSld+mbq/u5ddUklHVYGdvsG6klVPQ0RWhqHBxLuNT0g+QVeLp8PIvIZJQTo+WI+sxsrAf0M6NTxblrHIzMF5Pzcw';

export const useNotificationSound = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY);
    return stored !== 'false'; // Default: ON
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    }
  }, [soundEnabled]);

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem(NOTIFICATION_SOUND_KEY, enabled.toString());
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playSound,
  };
};
