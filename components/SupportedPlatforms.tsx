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
    { 
      name: 'Tiktok', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/tiktok.png?t=20241122' 
    },
    { name: 'Facebook', color: 'text-blue-600', icon: Facebook },
    { name: 'Instagram', color: 'text-pink-500', icon: Instagram },
    { name: 'Threads', color: 'text-black dark:text-white', icon: AtSign },
    { name: 'X (Twitter)', color: 'text-black dark:text-white', icon: Twitter },
    { 
      name: 'Douyin (TikTok China)', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/douyin.png?t=20241122' 
    },
    { 
      name: 'Kuaishou', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/kuaishou.png?t=20241122' 
    },
    { 
      name: 'Xiaohongshu', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/xiaohongshu.png?t=20241122' 
    },
    { 
      name: 'Bilibili', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/bilibili.png?t=20241122' 
    },
    { 
      name: 'Ixigua', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/ixigua.png?t=20241122' 
    },
    { 
      name: 'Toutiao', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/toutiao.png?t=20241122' 
    },
    { 
      name: 'Weibo', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/weibo.png?t=20241122' 
    },
    { 
      name: 'Pipix', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/pipix.png?t=20241122' 
    },
    { 
      name: 'Izuiyou', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/izuiyou.png?t=20241122' 
    },
    { 
      name: 'PearVideo', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/pearvideo.png?t=20241122' 
    },
    { 
      name: 'Xinpianchang', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/xinpianchang.png?t=20241122' 
    },
    { 
      name: 'Haokan', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/haokan.png?t=20241122' 
    },
    { 
      name: 'Huya', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/huya.png?t=20241122' 
    },
    { 
      name: 'AcFun', 
      customIconUrl: 'https://sg-social-media.oss-ap-southeast-1.aliyuncs.com/snapvideotools/assets/img/brand/acfun.png?t=20241122' 
    }
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