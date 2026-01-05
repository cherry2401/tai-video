import React, { useEffect, useRef, useState } from 'react';
import { 
  PlayCircle, 
  Facebook, 
  Instagram, 
  Twitter, 
  ShoppingBag, 
  AtSign
} from 'lucide-react';
import { Translation } from '../utils/translations';

interface SupportedPlatformsProps {
  t: Translation;
}

interface Platform {
  name: string;
  color?: string;
  icon?: React.ComponentType<any>;
  customIconUrl?: string;
}

const SupportedPlatforms: React.FC<SupportedPlatformsProps> = ({ t }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const platforms: Platform[] = [
    { name: 'Shopee Video', color: 'text-orange-500', icon: ShoppingBag },
    { name: 'Tiktok', customIconUrl: '/icon/tiktok.png' },
    { name: 'Facebook', color: 'text-blue-600', icon: Facebook },
    { name: 'Instagram', color: 'text-pink-500', icon: Instagram },
    { name: 'Threads', color: 'text-black dark:text-white', icon: AtSign },
    { name: 'X (Twitter)', color: 'text-black dark:text-white', icon: Twitter },
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
  ];

  return (
    <div className="w-full max-w-6xl mx-auto mt-0 px-4 pb-24">
      <div 
        ref={sectionRef}
        className={`bg-[#e9eff6] dark:bg-gray-800/80 rounded-[2.5rem] p-6 md:p-12 flex flex-col lg:flex-row gap-12 items-center transition-all duration-1000 ease-out transform ${
            isVisible 
            ? 'opacity-100 translate-y-0 blur-0' 
            : 'opacity-0 translate-y-20 blur-sm'
        }`}
      >
        {/* Left Column: Platform Grid */}
        <div className="flex-1 w-full order-2 lg:order-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {platforms.map((platform, index) => {
                  const Icon = platform.icon || PlayCircle;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-3 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-default select-none"
                    >
                      {platform.customIconUrl ? (
                        <img 
                          src={platform.customIconUrl} 
                          alt={platform.name} 
                          className="w-5 h-5 object-contain shrink-0"
                        />
                      ) : (
                        <Icon size={20} className={`shrink-0 ${platform.color}`} />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {platform.name}
                      </span>
                    </div>
                  );
                })}
            </div>
        </div>

        {/* Right Column: Text Description */}
        <div className="flex-1 space-y-6 order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                {t.features.supportedTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {t.features.supportedDesc}
            </p>
        </div>
      </div>
    </div>
  );
};

export default SupportedPlatforms;