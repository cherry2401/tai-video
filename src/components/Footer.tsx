import React from 'react';
import { Translation } from '../utils/translations';

interface FooterProps {
  theme: 'light' | 'dark';
  t: Translation;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
  onContactClick: () => void;
  onAboutClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ theme, t, onPrivacyClick, onTermsClick, onContactClick, onAboutClick }) => {
  return (
    <footer
      className="bg-white border-t border-gray-200 dark:border-indigo-900/60 py-12 mt-auto transition-colors duration-300"
      style={
        theme === 'dark'
          ? {
              backgroundColor: '#18163f',
              backgroundImage:
                'linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.88) 45%, rgba(22, 30, 72, 0.9) 100%)',
            }
          : undefined
      }
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-gray-600 dark:text-slate-300 text-base md:text-lg font-medium">
          <button 
            onClick={(e) => {
              e.preventDefault();
              onAboutClick();
            }}
            className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors bg-transparent border-none p-0 font-medium cursor-pointer"
          >
            {t.footer.about}
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              onTermsClick();
            }}
            className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors bg-transparent border-none p-0 font-medium cursor-pointer"
          >
            {t.footer.terms}
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              onPrivacyClick();
            }}
            className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors bg-transparent border-none p-0 font-medium cursor-pointer"
          >
            {t.footer.privacy}
          </button>
           <button 
            onClick={(e) => {
              e.preventDefault();
              onContactClick();
            }}
            className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors bg-transparent border-none p-0 font-medium cursor-pointer"
          >
            {t.footer.contact}
          </button>
        </div>
        <div className="text-center text-gray-400 dark:text-slate-500 text-sm mt-8">
          &copy; {new Date().getFullYear()} TaiVideo. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
