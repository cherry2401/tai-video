import { DownloadResult } from "../types";

// Configuration - Sẽ được load từ .env
const N8N_CONFIG = {
  // Use relative path to call Cloudflare Function
  WEBHOOK_URL: '/api/video-download',
  TIMEOUT: 30000, // 30 seconds
};

export interface N8nDownloadResponse {
  error: boolean;
  downloadUrl?: string;
  title?: string;
  quality?: string;
  thumbnail?: string;
  platform?: string;
  message?: string;
}

/**
 * Gọi n8n webhook để lấy download link
 */
export const fetchDownloadLink = async (
  videoUrl: string,
  platform: string = 'shopee'
): Promise<N8nDownloadResponse> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), N8N_CONFIG.TIMEOUT);

    const response = await fetch(N8N_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: videoUrl,
        platform: platform.toLowerCase()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: N8nDownloadResponse = await response.json();

    if (data.error) {
      throw new Error(data.message || 'Không thể tải video');
    }

    return data;

  } catch (error) {
    console.error('n8n webhook error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('⏱️ Timeout: Server không phản hồi');
      }
      throw new Error(`❌ Lỗi: ${error.message}`);
    }

    throw new Error('❌ Không thể kết nối đến server');
  }
};

/**
 * Convert DownloadResult sang format có download link từ n8n
 */
export const enrichResultWithDownload = async (
  result: DownloadResult
): Promise<DownloadResult> => {
  try {
    const n8nData = await fetchDownloadLink(result.originalUrl, result.platform);

    return {
      ...result,
      status: 'success',
      title: n8nData.title || result.title,
      thumbnail: n8nData.thumbnail || result.thumbnail,
      downloadUrl: n8nData.downloadUrl,
      quality: n8nData.quality || 'HD'
    };

  } catch (error) {
    console.error('Enrich error:', error);

    return {
      ...result,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
