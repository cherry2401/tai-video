import React, { useEffect, useRef, useState } from 'react';
import { Translation } from '../utils/translations';
import { Share2, Copy, Download, CheckCircle, Play } from 'lucide-react';

interface TutorialSectionProps {
  t: Translation;
}

const TutorialSection: React.FC<TutorialSectionProps> = ({ t }) => {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (entry.isIntersecting) {
            // Add to visible steps to trigger animation IN
            setVisibleSteps((prev) => {
              if (prev.includes(index)) return prev;
              return [...prev, index];
            });
          } else {
            // Remove from visible steps to reset animation (so it plays again when scrolling back)
            setVisibleSteps((prev) => prev.filter((i) => i !== index));
          }
        });
      },
      {
        threshold: 0.2, 
        rootMargin: '0px 0px -50px 0px', 
      }
    );

    stepsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLDivElement | null, index: number) => {
    if (el && !stepsRef.current[index]) {
      stepsRef.current[index] = el;
    }
  };

  const getAnimationClass = (index: number) => {
    const isVisible = visibleSteps.includes(index);
    // Base state: opacity-0, translate-y-16 (shifted down)
    // Visible state: opacity-100, translate-y-0
    return `transition-all duration-1000 ease-out transform ${
      isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-16 blur-sm'
    }`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-24 px-4 overflow-hidden">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-[#334155] dark:text-gray-100 mb-20 transition-colors">
        {t.tutorial.title}
      </h2>

      <div className="flex flex-col gap-32 relative">
        {/* Dashed Line Connection (Hidden on Mobile) */}
        {/* We animate the height/opacity of the line slightly for effect */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300 dark:border-gray-700 hidden lg:block -translate-x-1/2 -z-10 transition-opacity duration-1000" />

        {/* Step 1 */}
        <div 
          ref={(el) => addToRefs(el, 0)} 
          data-index="0"
          className={`flex flex-col lg:flex-row items-center gap-10 relative ${getAnimationClass(0)}`}
        >
          <div className="flex-1 text-center lg:text-right order-2 lg:order-1">
            <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-1 rounded-full text-sm font-bold mb-4">
              {t.tutorial.step} 01
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t.tutorial.step1}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md ml-auto mr-auto lg:mr-0">
              {t.tutorial.step1Desc}
            </p>
          </div>
          
          <div className="flex-1 order-1 lg:order-2 flex justify-center lg:justify-start">
            {/* Visual: Phone Screen Mockup */}
            <div className="w-64 h-96 bg-gray-900 rounded-[2rem] border-4 border-gray-800 shadow-2xl relative overflow-hidden flex flex-col p-4 transform transition-transform hover:scale-105 duration-500">
              {/* Phone Header */}
              <div className="w-20 h-4 bg-gray-800 rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2"></div>
              
              {/* Content Mock */}
              <div className="flex-1 bg-gray-800 rounded-xl mt-4 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10"></div>
                 <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center animate-pulse">
                        <Share2 size={20} className="text-white" />
                    </div>
                 </div>
                 <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <Play className="text-white/20" size={48} />
                 </div>
                 
                 {/* Popover "Copy Link" */}
                 <div className="absolute bottom-20 right-4 bg-white text-gray-900 p-2 rounded-lg shadow-lg text-xs font-bold flex items-center gap-2 animate-bounce">
                    <Copy size={12} /> Copy Link
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div 
          ref={(el) => addToRefs(el, 1)} 
          data-index="1"
          className={`flex flex-col lg:flex-row items-center gap-10 relative ${getAnimationClass(1)}`}
        >
          <div className="flex-1 flex justify-center lg:justify-end order-1">
             {/* Visual: Browser/App Input Mockup */}
             <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 transform transition-transform hover:-translate-y-2 duration-500">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="flex gap-2">
                        <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-900 border border-blue-500 rounded-lg flex items-center px-4 text-sm text-gray-500 overflow-hidden whitespace-nowrap">
                            <span className="animate-typing overflow-hidden whitespace-nowrap border-r-2 border-blue-500 pr-1">
                              https://tiktok.com/@user/video...
                            </span>
                        </div>
                        <div className="w-24 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                            <Download size={20} />
                        </div>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-900 rounded"></div>
                    <div className="h-2 w-2/3 bg-gray-100 dark:bg-gray-900 rounded"></div>
                </div>
             </div>
          </div>
          
          <div className="flex-1 text-center lg:text-left order-2">
            <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-1 rounded-full text-sm font-bold mb-4">
              {t.tutorial.step} 02
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t.tutorial.step2}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md ml-auto mr-auto lg:ml-0">
              {t.tutorial.step2Desc}
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div 
          ref={(el) => addToRefs(el, 2)} 
          data-index="2"
          className={`flex flex-col lg:flex-row items-center gap-10 relative ${getAnimationClass(2)}`}
        >
          <div className="flex-1 text-center lg:text-right order-2 lg:order-1">
            <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-1 rounded-full text-sm font-bold mb-4">
              {t.tutorial.step} 03
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t.tutorial.step3}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md ml-auto mr-auto lg:mr-0">
              {t.tutorial.step3Desc}
            </p>
          </div>
          
          <div className="flex-1 order-1 lg:order-2 flex justify-center lg:justify-start">
             {/* Visual: Download Card Mockup */}
             <div className="w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative group">
                    <Play size={40} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">HD</div>
                </div>
                <div className="p-4 space-y-3">
                    <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-800 rounded"></div>
                    
                    <div className="pt-2">
                        <div className="w-full py-2 bg-blue-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer hover:bg-blue-600 transition-colors">
                            <CheckCircle size={14} /> Download MP4
                        </div>
                        <div className="mt-2 w-full py-2 border border-gray-200 dark:border-gray-700 text-gray-500 rounded text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Download Thumbnail
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialSection;