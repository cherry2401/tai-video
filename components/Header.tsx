import React, { useState, useRef, useEffect } from 'react';
import { NavItem } from '../types';
import { Sun, Moon, Globe } from 'lucide-react';
import { Language, Translation } from '../utils/translations';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
  activeTab: NavItem;
  setActiveTab: (tab: NavItem) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  theme, 
  toggleTheme, 
  language, 
  setLanguage, 
  t,
  activeTab,
  setActiveTab
}) => {
  const navItems = Object.values(NavItem);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string }[] = [
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
    { code: 'id', label: 'Indonesia' },
    { code: 'th', label: 'ไทย' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' }
  ];

  const currentLangLabel = languages.find(l => l.code === language)?.label;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(item);
  };

  return (
    <header className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white py-6 px-6 shadow-sm dark:shadow-md transition-colors duration-300 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Logo */}
        <div 
          className="text-3xl font-extrabold tracking-tight flex-shrink-0 cursor-pointer flex items-center"
          onClick={() => setActiveTab(NavItem.HOME)}
        >
          <span className="text-blue-700 dark:text-blue-500 mr-2">AIO</span> Video Downloader
        </div>

        {/* Navigation - Added scrollbar hiding classes */}
        <nav className="flex-1 overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <ul className="flex justify-center items-center gap-4 md:gap-8 min-w-max">
            {navItems.map((itemKey) => {
              // Map the enum value to the translation key
              // @ts-ignore
              const label = t.nav[itemKey] || itemKey;
              const isActive = activeTab === itemKey || (activeTab === NavItem.HOME && itemKey === NavItem.VIDEO);
              
              return (
                <li key={itemKey}>
                  <a 
                    href={`#${itemKey.toLowerCase()}`} 
                    onClick={(e) => handleNavClick(itemKey, e)}
                    className={`hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-200 whitespace-nowrap px-6 py-3 rounded-full text-lg font-bold ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow-sm transform scale-105' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Controls: Theme & Language */}
        <div className="flex items-center gap-6 flex-shrink-0">
          
          {/* Theme Toggle */}
          <div className="flex items-center gap-2">
            <Sun size={20} className={`${theme === 'light' ? 'text-orange-500' : 'text-gray-400'}`} />
            <button 
              onClick={toggleTheme}
              className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
              aria-label="Toggle Theme"
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <Moon size={20} className={`${theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} />
          </div>

          {/* Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none text-gray-700 dark:text-gray-200 font-semibold text-base"
            >
              <Globe size={20} />
              <span>{currentLangLabel}</span>
            </button>

            {isLangOpen && (
              <div className="absolute top-full right-0 mt-3 w-40 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fadeIn overflow-hidden">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${language === lang.code ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-700/50' : ''}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;