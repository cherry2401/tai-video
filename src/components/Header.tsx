import React, { useState, useRef, useEffect } from 'react';
import { NavItem } from '../types';
import { Sun, Moon, Globe, Menu, X } from 'lucide-react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile Menu State
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
    setIsMenuOpen(false); // Close menu on click
  };

  return (
    <header className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white py-4 px-6 md:py-6 shadow-sm dark:shadow-md transition-colors duration-300 border-b border-gray-200 dark:border-gray-800 relative z-50">
      <div className="container mx-auto flex justify-between items-center gap-4">
        {/* Logo */}
        <div
          className="text-2xl md:text-3xl font-extrabold tracking-tight cursor-pointer flex items-center z-50"
          onClick={() => setActiveTab(NavItem.HOME)}
        >
          <span className="text-green-700 dark:text-green-500 mr-2">AIO</span> Video Downloader
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-700 dark:text-gray-200 focus:outline-none z-50"
          onClick={() => setIsMenuOpen(!isMenuOpen)}

        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Navigation & Controls Wrapper */}
        <div className={`
          flex-1 fixed inset-0 bg-white dark:bg-gray-900 md:bg-transparent md:static flex flex-col md:flex-row items-center justify-between md:gap-6 p-8 md:p-0 transition-transform duration-300 ease-in-out z-40
          ${isMenuOpen ? 'translate-x-0 top-0' : 'translate-x-full top-0 md:translate-x-0'}
        `}>
          {/* Navigation */}
          <nav className="w-full md:w-auto mt-16 md:mt-0">
            <ul className="flex flex-col md:flex-row gap-4 md:gap-8 items-center w-full">
              {navItems.map((itemKey) => {
                // @ts-ignore
                const label = t.nav[itemKey] || itemKey;
                const isActive = activeTab === itemKey || (activeTab === NavItem.HOME && itemKey === NavItem.VIDEO);

                return (
                  <li key={itemKey} className="w-full md:w-auto">
                    <a
                      href={`#${itemKey.toLowerCase()}`}
                      onClick={(e) => handleNavClick(itemKey, e)}
                      className={`
                        block w-full md:w-auto text-center px-4 py-3 md:py-1.5 rounded-full text-lg md:text-lg font-bold transition-all duration-200
                        ${isActive
                          ? 'bg-green-100 dark:bg-gray-800 text-green-700 dark:text-green-400 shadow-sm md:transform md:scale-105'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right Controls: Theme & Language */}
          <div className="flex flex-col md:flex-row items-center gap-6 mt-8 md:mt-0 w-full md:w-auto">

            {/* Theme Toggle */}
            <div className="flex items-center gap-4 md:gap-2 justify-center w-full md:w-auto">
              <Sun size={24} className={`md:w-5 md:h-5 ${theme === 'light' ? 'text-orange-500' : 'text-gray-400'}`} />
              <button
                onClick={toggleTheme}
                className={`w-16 h-8 md:w-14 md:h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
                aria-label="Toggle Theme"
              >
                <div className={`w-6 h-6 md:w-5 md:h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-8 md:translate-x-7' : 'translate-x-0'}`} />
              </button>
              <Moon size={24} className={`md:w-5 md:h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>

            {/* Language Selector */}
            <div className="relative w-full md:w-auto flex justify-center" ref={dropdownRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center justify-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none text-gray-700 dark:text-gray-200 font-semibold text-lg md:text-base px-4 py-2 border md:border-none rounded-lg border-gray-200 dark:border-gray-700 w-full md:w-auto"
              >
                <Globe size={24} className="md:w-5 md:h-5" />
                <span>{currentLangLabel}</span>
              </button>

              {isLangOpen && (
                <div className={`
                  absolute md:top-full md:right-0 bottom-full md:bottom-auto mb-2 md:mb-0 md:mt-3 
                  w-full md:w-40 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 
                  rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fadeIn overflow-hidden
                `}>
                  <div className="max-h-60 overflow-y-auto">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-center md:text-left px-5 py-3 text-base md:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${language === lang.code ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-700/50' : ''}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;