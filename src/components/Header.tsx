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
  setActiveTool: (tool: 'instagram' | 'zing' | 'soundcloud' | 'xvideos' | 'xnxx') => void;
  activeUtility: 'tempmail' | 'twofa' | 'outlook' | 'cdk' | 'cdkV2';
  setActiveUtility: (utility: 'tempmail' | 'twofa' | 'outlook' | 'cdk' | 'cdkV2') => void;
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
  setActiveTool,
  activeUtility,
  setActiveUtility,
}) => {
  const navItems = Object.values(NavItem);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false);
  const [isLangMobileOpen, setIsLangMobileOpen] = useState(false);
  const [isLangDesktopOpen, setIsLangDesktopOpen] = useState(false);
  const [logoCacheBust] = useState(() => Date.now().toString());

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
    { code: 'fr', label: 'Français' },
  ];

  const currentLangLabel = languages.find((l) => l.code === language)?.label;
  const darkHeaderGradientStyle = {
    backgroundColor: '#18163f',
    backgroundImage: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 45%, #161e48 100%)',
  };
  const mobileMenuStyle = theme === 'dark' ? darkHeaderGradientStyle : undefined;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangDesktopOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuVisible(true);
      return undefined;
    }

    const closeTimer = window.setTimeout(() => {
      setIsMenuVisible(false);
    }, 220);

    return () => window.clearTimeout(closeTimer);
  }, [isMenuOpen]);

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(item);
    setIsMenuOpen(false);
  };

  const handleToolClick = (tool: 'instagram' | 'zing' | 'soundcloud' | 'xvideos' | 'xnxx') => {
    setActiveTool(tool);
    setActiveTab(NavItem.TOOL);
    setIsMenuOpen(false);
  };

  const handleUtilityClick = (utility: 'tempmail' | 'twofa' | 'outlook' | 'cdk' | 'cdkV2') => {
    setActiveUtility(utility);
    setActiveTab(NavItem.VIDEO);
    setIsMenuOpen(false);
  };

  return (
    <header
      className={`bg-white text-gray-800 dark:text-white py-4 px-4 md:px-6 transition-colors duration-300 sticky top-0 z-50 w-full ${
        isMenuOpen
          ? '!border-b-0 shadow-none dark:shadow-none'
          : 'border-b border-gray-200 dark:border-indigo-900/60 shadow-sm dark:shadow-md'
      }`}
      style={theme === 'dark' ? darkHeaderGradientStyle : undefined}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div
          className="cursor-pointer inline-flex items-center h-10 leading-none"
          onClick={() => setActiveTab(NavItem.HOME)}
        >
          <img
            src={theme === 'dark' ? `/logo_taivideo3.svg?v=${logoCacheBust}` : `/logo_taivideo2.svg?v=${logoCacheBust}`}
            alt="TaiVideo logo"
            className="h-6 md:h-7 w-auto object-contain shrink-0"
          />
        </div>

        <div className="hidden md:flex flex-1 justify-center">
          <nav className="font-geomanist">
            <ul className="flex gap-8 items-center">
              {navItems.map((itemKey) => {
                // @ts-ignore
                const label = t.nav[itemKey] || itemKey;
                const isActive = activeTab === itemKey;

                return (
                  <li key={itemKey}>
                    <a
                      href={`#${itemKey.toLowerCase()}`}
                      onClick={(e) => handleNavClick(itemKey, e)}
                      className={`block px-3 py-1.5 rounded-md text-[15px] font-medium transition-colors duration-200 ${
                        isActive
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sun size={20} className={`${theme === 'light' ? 'text-orange-500' : 'text-gray-400'}`} />
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <Moon size={20} className={`${theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} />
          </div>

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
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      language === lang.code ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-700/50' : ''
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          className="md:hidden p-2 text-gray-700 dark:text-gray-200 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} className="text-green-600" /> : <Menu size={28} className="text-green-600" />}
        </button>
      </div>

      {isMenuVisible && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setIsMenuOpen(false)}
            className={`md:hidden absolute inset-x-0 top-full h-screen z-30 bg-black/20 transition-opacity duration-200 ${
              isMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`md:hidden absolute top-[calc(100%-1px)] left-0 w-full bg-white border-b border-gray-200/70 dark:border-indigo-900/35 shadow-none dark:shadow-[0_12px_28px_rgba(2,6,23,0.45)] z-40 origin-top font-geomanist transition-all duration-200 ease-out ${
              isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
            style={mobileMenuStyle}
          >
            <ul className="flex flex-col m-0 p-0 list-none">
            {navItems.map((itemKey) => {
              // @ts-ignore
              const label = t.nav[itemKey] || itemKey;
              const isActive = activeTab === itemKey;

              if (itemKey === NavItem.TOOL) {
                return (
                  <li key={itemKey} className="border-b border-gray-50 dark:border-indigo-900/40 last:border-none">
                    <button
                      onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className={`flex items-center justify-between w-full px-5 py-3.5 text-left text-[16px] font-medium transition-colors ${
                        isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{label}</span>
                      {isToolsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isToolsOpen && (
                      <div className="bg-gray-50 dark:bg-transparent px-5 py-2 space-y-1">
                        <button
                          onClick={() => handleToolClick('instagram')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeTool === 'instagram' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {language === 'vi' ? 'Tải Instagram' : 'Instagram Downloader'}
                        </button>
                        <button
                          onClick={() => handleToolClick('zing')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeTool === 'zing' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {language === 'vi' ? 'Tải Zing MP3' : 'Zing MP3 Downloader'}
                        </button>
                        <button
                          onClick={() => handleToolClick('soundcloud')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeTool === 'soundcloud' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {language === 'vi' ? 'Tải SoundCloud' : 'SoundCloud Downloader'}
                        </button>
                        <button
                          onClick={() => handleToolClick('xvideos')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeTool === 'xvideos' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {language === 'vi' ? 'Tải XVideos' : 'XVideos Downloader'}
                        </button>
                        <button
                          onClick={() => handleToolClick('xnxx')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeTool === 'xnxx' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {language === 'vi' ? 'Tải XNXX' : 'XNXX Downloader'}
                        </button>
                      </div>
                    )}
                  </li>
                );
              }

              if (itemKey === NavItem.VIDEO) {
                return (
                  <li key={itemKey} className="border-b border-gray-50 dark:border-indigo-900/40 last:border-none">
                    <button
                      onClick={() => setIsUtilitiesOpen(!isUtilitiesOpen)}
                    className={`flex items-center justify-between w-full px-5 py-3.5 text-left text-[16px] font-medium transition-colors ${
                        isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{label}</span>
                      {isUtilitiesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isUtilitiesOpen && (
                      <div className="bg-gray-50 dark:bg-transparent px-5 py-2 space-y-1">
                        <button
                          onClick={() => handleUtilityClick('tempmail')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeUtility === 'tempmail' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          Tempmail
                        </button>
                        <button
                          onClick={() => handleUtilityClick('twofa')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeUtility === 'twofa' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          2FA
                        </button>
                        <button
                          onClick={() => handleUtilityClick('outlook')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeUtility === 'outlook' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {language === 'vi' ? 'Outlook Mail' : 'Outlook Mail'}
                        </button>
                        <button
                          onClick={() => handleUtilityClick('cdk')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeUtility === 'cdk' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          ChatGPT CDK
                        </button>
                        <button
                          onClick={() => handleUtilityClick('cdkV2')}
                          className={`block w-full text-left py-2.5 px-2 rounded text-[15px] ${
                            activeUtility === 'cdkV2' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          ChatGPT CDK V2
                        </button>
                      </div>
                    )}
                  </li>
                );
              }

              return (
                <li key={itemKey} className="border-b border-gray-50 dark:border-indigo-900/40 last:border-none">
                  <a
                    href={`#${itemKey.toLowerCase()}`}
                    onClick={(e) => handleNavClick(itemKey, e)}
                    className={`block px-5 py-3.5 text-[16px] font-medium transition-colors ${
                      isActive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </a>
                </li>
              );
            })}

            <li className="border-b border-gray-50 dark:border-indigo-900/40">
              <button
                onClick={() => setIsLangMobileOpen(!isLangMobileOpen)}
                className="flex items-center justify-between w-full px-5 py-3.5 text-left text-[16px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-gray-500" />
                  <span>{currentLangLabel}</span>
                </div>
                {isLangMobileOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {isLangMobileOpen && (
                <div className="bg-gray-50 dark:bg-transparent px-5 py-2 grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                      }}
                      className={`text-left py-2 px-2 rounded text-[14px] ${
                        language === lang.code
                          ? 'text-green-600 font-bold bg-green-100/50 dark:bg-green-500/10'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </li>

            <li className="px-5 py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Sun size={18} className="text-gray-500" />
                  {language === 'vi' ? 'Giao diện' : 'Theme'}
                </span>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 rounded-full p-1">
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
        </>
      )}
    </header>
  );
};

export default Header;
