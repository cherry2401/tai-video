import React, { useEffect, useRef, useState } from 'react';
import { Translation } from '../utils/translations';

interface FAQSectionProps {
  t: Translation;
}

const FAQSection: React.FC<FAQSectionProps> = ({ t }) => {
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
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const questions = [1, 2, 3, 4, 5, 6];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-24">
      <div 
        ref={sectionRef}
        className={`transition-all duration-1000 ease-out transform ${
            isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {t.faq.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {t.faq.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((num) => {
            const qKey = `q${num}` as keyof typeof t.faq;
            const aKey = `a${num}` as keyof typeof t.faq;
            
            return (
              <div 
                key={num}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {t.faq[qKey]}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                  {t.faq[aKey]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;