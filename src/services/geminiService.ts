import { DownloadResult } from "../types";

// Simple platform detection without AI
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('shopee.vn') || urlLower.includes('shopee.co')) return 'Shopee';
  if (urlLower.includes('tiktok.com')) return 'TikTok';
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) return 'Facebook';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'YouTube';
  if (urlLower.includes('instagram.com')) return 'Instagram';
  if (urlLower.includes('douyin.com')) return 'Douyin';

  return 'Unknown';
}

// Extract YouTube video ID from URL to generate thumbnail immediately
function getYouTubeThumbnail(url: string): string | null {
  try {
    const urlObj = new URL(url);
    let videoId: string | null = null;

    if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    }

    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  } catch (e) {
    // Invalid URL
  }
  return null;
}

function generateTitle(url: string, platform: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/').filter(p => p.length > 0);
    const lastPart = parts[parts.length - 1];

    if (lastPart && lastPart.length > 5) {
      return `${platform} Video - ${lastPart.substring(0, 30)}`;
    }
  } catch (e) {
    // Invalid URL, ignore
  }

  return `${platform} Video`;
}

export const analyzeLinks = async (urls: string[]): Promise<DownloadResult[]> => {
  if (urls.length === 0) return [];

  const validUrls = urls.filter(u => u.trim().length > 0);
  if (validUrls.length === 0) return [];

  return validUrls.map((url, index) => {
    const platform = detectPlatform(url);
    const title = generateTitle(url, platform);

    // Use real thumbnail for YouTube, placeholder for others
    const thumbnail = getYouTubeThumbnail(url) || `https://picsum.photos/300/200?random=${index}`;

    return {
      id: `res-${Date.now()}-${index}`,
      originalUrl: url,
      platform: platform,
      title: title,
      status: 'success',
      thumbnail: thumbnail
    };
  });
};