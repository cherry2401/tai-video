import React from 'react';
import {
  CloudDownload,
  Lightbulb,
  Video,
  ShoppingBag,
  Facebook,
  Instagram,
  Twitter,
  AtSign
} from 'lucide-react';
import { Translation } from '../utils/translations';

interface FeatureSectionProps {
  t: Translation;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ t }) => {
  return (
    <div className="w-full max-w-6xl mx-auto mt-16 px-4">
      {/* Top 3 Features Grid (Simple Fade In) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center animate-fadeIn">
        {/* Feature 1 */}
        <div className="flex flex-col items-center group">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400 transform transition-transform group-hover:scale-110 duration-300">
            <CloudDownload size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t.features.free}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm px-4">
            {t.features.freeDesc}
          </p>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col items-center group">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400 transform transition-transform group-hover:scale-110 duration-300">
            <Lightbulb size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t.features.noWatermark}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm px-4">
            {t.features.noWatermarkDesc}
          </p>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col items-center group">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400 transform transition-transform group-hover:scale-110 duration-300">
            <Video size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t.features.thumbnail}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm px-4">
            {t.features.thumbnailDesc}
          </p>
        </div>
      </div>

      {/* Supported Platforms Badges */}
      <div className="mt-16 text-center">
        <div className="flex flex-wrap justify-center gap-3 animate-fadeIn delay-200">
          {[
            { name: 'Shopee Video', iconClass: 'text-orange-500', icon: ShoppingBag },
            { name: 'Tiktok', customIconUrl: '/icon/tiktok.png' },
            { name: 'Facebook', iconClass: 'text-blue-600', icon: Facebook },
            { name: 'Instagram', iconClass: 'text-pink-500', icon: Instagram },
            { name: 'Threads', iconClass: 'text-black dark:text-white', icon: AtSign },
            { name: 'X (Twitter)', iconClass: 'text-black dark:text-white', icon: Twitter },
            { name: 'Douyin (Tiktok Trung Quốc)', customIconUrl: '/icon/douyin.png' },
            { name: 'Kuaishou', customIconUrl: '/icon/kuaishou.png' },
            { name: 'Xiaohongshu', customIconUrl: '/icon/xiaohongshu.png' },
            { name: 'Bilibili', customIconUrl: '/icon/bilibili.png' },
            { name: 'Ixigua', customIconUrl: '/icon/ixigua.png' },
            { name: 'Toutiao', customIconUrl: '/icon/toutiao.png' },
            { name: 'Weibo', customIconUrl: '/icon/weibo.png' },
            { name: 'Pipix', customIconUrl: '/icon/pipix.png' },
            { name: 'Izuiyou', customIconUrl: '/icon/izuiyou.png' },
            { name: 'PearVideo', customIconUrl: '/icon/pearvideo.png' },
            { name: 'Xinpianchang', customIconUrl: '/icon/xinpianchang.png' },
            { name: 'Haokan', customIconUrl: '/icon/haokan.png' },
            { name: 'Huya', customIconUrl: '/icon/huya.png' },
            { name: 'AcFun', customIconUrl: '/icon/acfun.png' }
          ].map((platform, index) => {
            const Icon = platform.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#0f5156] rounded-full hover:shadow-md transition-all cursor-default select-none"
              >
                {platform.customIconUrl ? (
                  <img
                    src={platform.customIconUrl}
                    alt={platform.name}
                    className="w-5 h-5 object-contain shrink-0"
                  />
                ) : (
                  Icon && <Icon size={20} className={`shrink-0 ${platform.iconClass || ''}`} />
                )}
                <span className="text-xs md:text-sm font-medium text-[#0f5156] dark:text-gray-300 whitespace-nowrap">
                  {platform.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;