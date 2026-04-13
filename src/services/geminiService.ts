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

// Extract thumbnail URL from video URL immediately (no API call needed)
function getInstantThumbnail(url: string, platform: string): string {
  try {
    const urlObj = new URL(url);

    // YouTube: extract video ID → img.youtube.com
    if (platform === 'YouTube') {
      let videoId: string | null = null;
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1).split('?')[0];
      } else if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      }
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
  } catch (e) {
    // Invalid URL
  }
  return '';
}

// Async: try to fetch thumbnail via oEmbed for platforms that support it
async function fetchOEmbedThumbnail(url: string, platform: string): Promise<string> {
  try {
    if (platform === 'TikTok') {
      const resp = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
      if (resp.ok) {
        const data = await resp.json() as { thumbnail_url?: string };
        return data.thumbnail_url || '';
      }
    }
  } catch (e) {
    // oEmbed failed, no big deal
  }
  return '';
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

  // Create results with instant thumbnails first
  const results = validUrls.map((url, index) => {
    const platform = detectPlatform(url);
    const title = generateTitle(url, platform);
    const thumbnail = getInstantThumbnail(url, platform);

    return {
      id: `res-${Date.now()}-${index}`,
      originalUrl: url,
      platform: platform,
      title: title,
      status: 'success' as const,
      thumbnail: thumbnail
    };
  });

  // Fire oEmbed thumbnail fetches in the background (non-blocking)
  // These will update the results array before enrichResultWithDownload runs
  await Promise.all(results.map(async (result) => {
    if (!result.thumbnail) {
      const oembedThumb = await fetchOEmbedThumbnail(result.originalUrl, result.platform);
      if (oembedThumb) {
        result.thumbnail = oembedThumb;
      }
    }
  }));

  return results;
};