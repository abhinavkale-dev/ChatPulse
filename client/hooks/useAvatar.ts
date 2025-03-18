"use client";

import { useState, useEffect } from 'react';

/**
 * A custom hook to handle avatar URLs consistently across browsers
 * Addresses Safari-specific issues with avatar loading
 */
export function useAvatar(avatarUrl?: string, fallbackUrl: string = "/avatar.png") {
  // Start with the provided avatar URL or fallback
  const [safeAvatarUrl, setSafeAvatarUrl] = useState<string>(avatarUrl || fallbackUrl);
  
  useEffect(() => {
    // If no avatar URL is provided, use fallback
    if (!avatarUrl) {
      setSafeAvatarUrl(fallbackUrl);
      return;
    }
    
    // Use the provided avatar URL directly
    // This is simpler and more reliable across browsers
    setSafeAvatarUrl(avatarUrl);
    
    // We don't need to pre-load or check the image here
    // Let the browser handle it naturally
  }, [avatarUrl, fallbackUrl]);

  return { 
    avatarUrl: safeAvatarUrl
  };
}
