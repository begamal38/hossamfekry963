/**
 * Extract YouTube video ID from various URL formats
 * Supports: watch links, short links, embed links, iframe codes
 */
export const extractYouTubeVideoId = (input: string): string | null => {
  if (!input) return null;
  
  const patterns = [
    /youtube\.com\/embed\/([^\"&?\s\/]+)/,      // Embed URL (handles iframe src)
    /youtube\.com\/watch\?v=([^&?\s]+)/,        // Standard watch URL
    /youtu\.be\/([^&?\s\/]+)/,                   // Short URL
    /youtube\.com\/shorts\/([^&?\s\/]+)/,        // Shorts URL
    /youtube\.com\/v\/([^&?\s\/]+)/,             // Old embed format
    /youtube\.com\/live\/([^&?\s\/]+)/,          // Live streams
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1].split('?')[0]; // Remove any query params
    }
  }
  
  return null;
};

/**
 * Generate a clean YouTube embed URL from any YouTube input
 */
export const generateYouTubeEmbedUrl = (input: string): string | null => {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Check if input contains a valid YouTube video
 */
export const isValidYouTubeInput = (input: string): boolean => {
  return extractYouTubeVideoId(input) !== null;
};
