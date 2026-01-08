import React, { useState, useRef, useEffect } from 'react';
import { NavItem } from '../types';
import { Sun, Moon, Globe, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Language, Translation } from '../utils/translations';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
  activeTab: NavItem;
  setActiveTab: (tab: NavItem) => void;
  activeTool: string;
  setActiveTool: (tool: 'instagram' | 'zing' | 'soundcloud' | 'xvideos') => void;
}

const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  language,
  setLanguage,
  t,
  activeTab,
  setActiveTab,
  activeTool,
  setActiveTool
}) => {
  const navItems = Object.values(NavItem);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isLangMobileOpen, setIsLangMobileOpen] = useState(false);
  const [isLangDesktopOpen, setIsLangDesktopOpen] = useState(false);

  // Desktop dropdown ref
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

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangDesktopOpen(false);
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

  const handleToolClick = (tool: 'instagram' | 'zing' | 'soundcloud' | 'xvideos') => {
    setActiveTool(tool);
    setActiveTab(NavItem.TOOL);
    setIsMenuOpen(false);
  }

  return (
    <header className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white py-4 px-4 md:px-6 shadow-sm dark:shadow-md transition-colors duration-300 border-b border-gray-200 dark:border-gray-800 relative z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div
          className="text-xl md:text-3xl font-extrabold tracking-tight cursor-pointer flex items-center"
          onClick={() => setActiveTab(NavItem.HOME)}
        >
          <span className="text-green-600 dark:text-green-500 mr-1">FSaver</span>
        </div>

        {/* Desktop Navigation (Centered) */}
        <div className="hidden md:flex flex-1 justify-center">
          <nav>
            <ul className="flex gap-8 items-center">
              {navItems.map((itemKey) => {
                // @ts-ignore
                const label = t.nav[itemKey] || itemKey;
                const isActive = activeTab === itemKey || (activeTab === NavItem.HOME && itemKey === NavItem.VIDEO);

                return (
                  <li key={itemKey}>
                    <a
                      href={`#${itemKey.toLowerCase()}`}
                      onClick={(e) => handleNavClick(itemKey, e)}
                      className={`
                                                block px-4 py-1.5 rounded-full text-lg font-bold transition-all duration-200
                                                ${isActive
                          ? 'bg-green-100 dark:bg-gray-800 text-green-700 dark:text-green-400 shadow-sm transform scale-105'
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
        </div>

        {/* Desktop Right Controls (Theme & Lang) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle */}
          <div className="flex items-center gap-2">
            <Sun size={20} className={`${theme === 'light' ? 'text-orange-500' : 'text-gray-400'}`} />
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <Moon size={20} className={`${theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} />
          </div>

          {/* Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLangDesktopOpen(!isLangDesktopOpen)}
              className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none font-semibold"
            >
              <Globe size={20} />
              <span>{currentLangLabel}</span>
            </button>
            {isLangDesktopOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fadeIn overflow-hidden">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangDesktopOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${language === lang.code ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-700/50' : ''}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button - Right Aligned */}
        <button
          className="md:hidden p-2 text-gray-700 dark:text-gray-200 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} className="text-green-600" /> : <Menu size={28} className="text-green-600" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown (Absolute) */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl z-40 animate-slideDown origin-top">
          <ul className="flex flex-col py-2">
            {navItems.map((itemKey) => {
              // @ts-ignore
              const label = t.nav[itemKey] || itemKey;
              const isActive = activeTab === itemKey || (activeTab === NavItem.HOME && itemKey === NavItem.VIDEO);

              // Mobile Tool Dropdown
              if (itemKey === NavItem.TOOL) {
                return (
                  <li key={itemKey} className="border-b border-gray-50 dark:border-gray-800 last:border-none">
                    <button
                      onClick={() => setIsToolsOpen(!isToolsOpen)}
                      className={`flex items-center justify-between w-full px-5 py-3.5 text-left text-[16px] font-medium transition-colors
                                                 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      <span>{label}</span>
                      {isToolsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isToolsOpen && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-2 space-y-1">
                        <button onClick={() => handleToolClick('instagram')} className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${activeTool === 'instagram' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>Tải Instagram</button>
                        <button onClick={() => handleToolClick('zing')} className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${activeTool === 'zing' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>Tải Zing MP3</button>
                        <button onClick={() => handleToolClick('soundcloud')} className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${activeTool === 'soundcloud' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>Tải SoundCloud</button>
                        <button onClick={() => handleToolClick('xvideos')} className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${activeTool === 'xvideos' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>Tải XVideos</button>
                      </div>
                    )}
                  </li>
                )
              }

              return (
                <li key={itemKey} className="border-b border-gray-50 dark:border-gray-800 last:border-none">
                  <a
                    href={`#${itemKey.toLowerCase()}`}
                    onClick={(e) => handleNavClick(itemKey, e)}
                    className={`
                                                block px-5 py-3.5 text-[16px] font-medium transition-colors
                                                ${isActive ? 'text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                                            `}
                  >
                    {label}
                  </a>
                </li>
              );
            })}

            {/* Language Accordion */}
            <li className="border-b border-gray-50 dark:border-gray-800">
              <button
                onClick={() => setIsLangMobileOpen(!isLangMobileOpen)}
                className="flex items-center justify-between w-full px-5 py-3.5 text-left text-[16px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-gray-500" />
                  <span>{currentLangLabel}</span>
                </div>
                {isLangMobileOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {isLangMobileOpen && (
                <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-2 grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsMenuOpen(false); // Optional: close menu on lang change? No, usually keep open.
                      }}
                      className={`text-left py-2 px-2 rounded text-[14px] ${language === lang.code ? 'text-green-600 font-bold bg-green-100/50' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </li>

            {/* Theme Item */}
            <li className="px-5 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Sun size={18} className="text-gray-500" />
                  Giao diện
                </span>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                  <button
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`p-1.5 rounded-full ${theme === 'light' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-400'}`}
                  >
                    <Sun size={16} />
                  </button>
                  <button
                    onClick={() => theme === 'light' && toggleTheme()}
                    className={`p-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700 shadow-sm text-blue-400' : 'text-gray-400'}`}
                  >
                    <Moon size={16} />
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;