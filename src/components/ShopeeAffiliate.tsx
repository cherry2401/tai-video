import React, { useRef, useEffect, useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { isShopeeUrl, trackShopeeAffiliate } from '../services/affiliateService';

interface ShopeeAffiliateProps {
  url: string;
  onTrackingComplete?: (success: boolean) => void;
  className?: string;
}

const ShopeeAffiliate: React.FC<ShopeeAffiliateProps> = ({
  url,
  onTrackingComplete,
  className = ''
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    const trackAffiliate = async () => {
      if (!isShopeeUrl(url) || !iframeRef.current) {
        onTrackingComplete?.(false);
        return;
      }

      setIsLoading(true);
      setShowIframe(true);

      try {
        const success = await trackShopeeAffiliate(url, iframeRef.current);
        onTrackingComplete?.(success);
      } catch (error) {
        console.error('Tracking error:', error);
        onTrackingComplete?.(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (url) {
      trackAffiliate();
    }
  }, [url, onTrackingComplete]);

  // Không hiển thị nếu không phải Shopee
  if (!isShopeeUrl(url)) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <img
            src="https://cf.shopee.vn/file/vn-50009109-f6c34d719c3e4d33857371458e7a7059"
            alt="Shopee"
            className="w-6 h-6"
          />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Sản phẩm Shopee
          </h3>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải...</span>
          </div>
        )}
      </div>

      {/* Iframe Container */}
      {showIframe && (
        <div className="relative w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
          <iframe
            ref={iframeRef}
            title="Shopee Product"
            className="w-full h-[400px] md:h-[500px] border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#ee4d2d]" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Đang tải sản phẩm Shopee...
                </p>
              </div>
            </div>
          )}

          {/* Open in new tab button */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 bg-white dark:bg-gray-700 p-2 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="Mở trên Shopee"
          >
            <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </a>
        </div>
      )}

      {/* Info Text */}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        💡 Xem sản phẩm trên Shopee để hỗ trợ chúng tôi
      </p>
    </div>
  );
};

export default ShopeeAffiliate;
