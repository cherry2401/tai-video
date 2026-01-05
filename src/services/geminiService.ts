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

function generateTitle(url: string, platform: string): string {
  // Extract video ID or generate simple title
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Try to extract meaningful part from path
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

  // Filter out empty strings
  const validUrls = urls.filter(u => u.trim().length > 0);

  if (validUrls.length === 0) return [];

  // Simple detection without AI
  return validUrls.map((url, index) => {
    const platform = detectPlatform(url);
    const title = generateTitle(url, platform);

    return {
      id: `res-${Date.now()}-${index}`,
      originalUrl: url,
      platform: platform,
      title: title,
      status: 'success',
      thumbnail: `https://picsum.photos/300/200?random=${index}` // Placeholder thumbnail
    };
  });
};