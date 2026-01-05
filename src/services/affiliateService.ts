// Configuration - Sẽ được load từ .env
const AFFILIATE_CONFIG = {
  SHOPEE_SITE_ID: import.meta.env.VITE_SHOPEE_SITE_ID || 'YOUR_SITE_ID',
  SHOPEE_PARTNER_ID: import.meta.env.VITE_SHOPEE_PARTNER_ID || 'YOUR_PARTNER_ID',
  COOKIE_WAIT_TIME: 2000, // 2 seconds
};

/**
 * Kiểm tra xem URL có phải của Shopee không
 */
export const isShopeeUrl = (url: string): boolean => {
  const shopeePatterns = [
    'shopee.vn',
    'shopee.com',
    'shope.ee',
    'shopee.sg',
    'shopee.tw',
    'shopee.th',
    'shopee.ph',
    'shopee.my',
    'shopee.co.id'
  ];

  return shopeePatterns.some(pattern => url.toLowerCase().includes(pattern));
};

/**
 * Convert URL thường sang affiliate URL
 */
export const convertToAffiliateUrl = (url: string): string => {
  if (!isShopeeUrl(url)) {
    return url; // Không phải Shopee, return nguyên
  }

  try {
    const urlObj = new URL(url);

    // Thêm affiliate parameters
    urlObj.searchParams.set('af_siteid', AFFILIATE_CONFIG.SHOPEE_SITE_ID);
    urlObj.searchParams.set('pid', AFFILIATE_CONFIG.SHOPEE_PARTNER_ID);
    urlObj.searchParams.set('af_channel', 'video_downloader');

    // Optional: Add sub-tracking
    urlObj.searchParams.set('af_sub', `${Date.now()}`);

    return urlObj.toString();

  } catch (error) {
    console.error('Invalid URL:', error);
    return url; // Fallback to original URL
  }
};

/**
 * Load Shopee page trong iframe để set affiliate cookie
 * @param productUrl - Shopee product/video URL
 * @param iframeElement - HTML iframe element
 * @returns Promise khi iframe đã load xong
 */
export const loadShopeeAffiliate = (
  productUrl: string,
  iframeElement: HTMLIFrameElement
): Promise<void> => {
  return new Promise((resolve) => {
    if (!isShopeeUrl(productUrl)) {
      // Không phải Shopee, skip
      resolve();
      return;
    }

    const affiliateUrl = convertToAffiliateUrl(productUrl);

    // Set iframe src
    iframeElement.src = affiliateUrl;

    // Đợi iframe load
    const handleLoad = () => {
      console.log('✅ Shopee affiliate iframe loaded:', affiliateUrl);
      iframeElement.removeEventListener('load', handleLoad);
      resolve();
    };

    iframeElement.addEventListener('load', handleLoad);

    // Fallback timeout
    setTimeout(() => {
      iframeElement.removeEventListener('load', handleLoad);
      console.warn('⚠️ Affiliate iframe load timeout');
      resolve();
    }, 5000);
  });
};

/**
 * Đợi để cookie được set (sau khi iframe load)
 */
export const waitForCookieSet = (): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, AFFILIATE_CONFIG.COOKIE_WAIT_TIME);
  });
};

/**
 * Flow hoàn chỉnh: Load affiliate iframe → Đợi cookie → Return success
 */
export const trackShopeeAffiliate = async (
  productUrl: string,
  iframeElement: HTMLIFrameElement
): Promise<boolean> => {
  try {
    if (!isShopeeUrl(productUrl)) {
      return false; // Không phải Shopee, không track
    }

    // Step 1: Load iframe
    await loadShopeeAffiliate(productUrl, iframeElement);

    // Step 2: Wait for cookie to be set
    await waitForCookieSet();

    console.log('✅ Shopee affiliate tracking completed');
    return true;

  } catch (error) {
    console.error('❌ Affiliate tracking error:', error);
    return false;
  }
};

/**
 * Utility: Extract product ID từ Shopee URL (optional)
 */
export const extractShopeeProductId = (url: string): string | null => {
  try {
    // Shopee URL format: https://shopee.vn/product/123/456
    const match = url.match(/\/product\/(\d+)\/(\d+)/);
    if (match) {
      return `${match[1]}_${match[2]}`;
    }

    // Video format: https://shopee.vn/video/abc123
    const videoMatch = url.match(/\/video\/([a-zA-Z0-9_-]+)/);
    if (videoMatch) {
      return videoMatch[1];
    }

    return null;
  } catch {
    return null;
  }
};
