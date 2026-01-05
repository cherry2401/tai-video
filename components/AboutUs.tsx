import React from 'react';
import { Translation } from '../utils/translations';

interface AboutUsProps {
  t: Translation;
}

const AboutUs: React.FC<AboutUsProps> = ({ t }) => {
  return (
    <div className="w-full max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="flex flex-col items-start max-w-3xl">
        <div className="flex items-center gap-5 mb-8">
           {/* Logo Placeholder - The user can replace src with their actual logo path */}
           <div className="w-20 h-20 shrink-0">
             <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[#1e4d3b]">
               {/* A rough approximation of a stylized 'R' or just a placeholder logo shape */}
               <path d="M20,20 Q50,5 60,30 T50,60 L70,90 H50 L35,65 H30 V90 H10 V20 H20 Z" fill="currentColor" />
             </svg>
             {/* Alternatively, use an img tag if they have a file */}
             {/* <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" /> */}
           </div>
           
           <h1 className="text-3xl md:text-4xl font-bold text-[#1e4d3b] dark:text-green-400">
             {t.about.brandName}
           </h1>
        </div>
        
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed text-left">
          {t.about.description}
        </p>
      </div>
    </div>
  );
};

export default AboutUs;