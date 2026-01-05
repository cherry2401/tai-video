import React from 'react';
import { 
  CloudDownload, 
  Lightbulb, 
  Video
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
    </div>
  );
};

export default FeatureSection;