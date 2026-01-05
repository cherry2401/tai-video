import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import DownloadForm from './components/DownloadForm';
import ResultList from './components/ResultList';
import ShortenForm from './components/ShortenForm';
import FeatureSection from './components/FeatureSection';
import TutorialSection from './components/TutorialSection';
import SupportedPlatforms from './components/SupportedPlatforms';
import FAQSection from './components/FAQSection';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import ContactForm from './components/ContactForm';
import AboutUs from './components/AboutUs';
import { analyzeLinks } from './services/geminiService';
import { DownloadResult, NavItem } from './types';
import { translations, Language } from './utils/translations';
import { Loader2, Construction } from 'lucide-react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DownloadResult[]>([]);
  
  // State for Theme, Language, Active Tab, and Current View
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('vi');
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.VIDEO);
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms' | 'contact' | 'about'>('home');
  
  // State for Redirect Logic
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Translation Helper
  const t = translations[language];

  // Theme Logic
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle URL Redirection (Link Shortener Logic)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shortCode = params.get('s');

    if (shortCode) {
      setIsRedirecting(true);
      // Simulate lookup delay
      setTimeout(() => {
        const originalUrl = localStorage.getItem(`short_${shortCode}`);
        if (originalUrl) {
          window.location.href = originalUrl;
        } else {
          setIsRedirecting(false);
          alert('Link rút gọn không tồn tại hoặc đã hết hạn.');
          // Remove query param to show the app cleanly
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }, 1500);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleDownload = async (links: string[]) => {
    setIsLoading(true);
    setResults([]); // Clear previous results

    try {
      // Simulate API delay for UX if AI is too fast
      const [data] = await Promise.all([
        analyzeLinks(links),
        new Promise(resolve => setTimeout(resolve, 800)) 
      ]);
      setResults(data);
    } catch (error) {
      console.error("Error processing links:", error);
      alert("Có lỗi xảy ra khi xử lý links. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (currentView === 'privacy') {
      return <PrivacyPolicy />;
    }

    if (currentView === 'terms') {
      return <TermsOfService />;
    }

    if (currentView === 'contact') {
      return <ContactForm t={t} />;
    }

    if (currentView === 'about') {
      return <AboutUs t={t} />;
    }

    if (activeTab === NavItem.RUT_GON) {
      return <ShortenForm t={t} />;
    }

    if (activeTab === NavItem.TOOL) {
      return (
        <div className="flex flex-col items-center justify-center py-20 animate-fadeIn space-y-6">
           <Construction size={64} className="text-gray-400 dark:text-gray-600" />
           <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-700 dark:text-gray-300 max-w-2xl px-4 leading-relaxed">
             {t.underConstruction}
           </h2>
        </div>
      );
    }

    // Default view (Video/Home/Flashsale - sharing the same UI for now)
    return (
      <>
        <div className="text-center mb-10 space-y-2 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold text-[#334155] dark:text-gray-100 transition-colors">
            {t.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base transition-colors">
            {t.subtitle}
          </p>
        </div>

        <DownloadForm onDownload={handleDownload} isLoading={isLoading} t={t} />
        
        <ResultList results={results} t={t} />
        
        <FeatureSection t={t} />

        <TutorialSection t={t} />

        <SupportedPlatforms t={t} />

        <FAQSection t={t} />
      </>
    );
  };

  // If redirecting, show a simple loading screen instead of the main app
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-gray-950 text-gray-600 dark:text-gray-300">
        <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
        <h2 className="text-xl font-semibold">Đang chuyển hướng...</h2>
        <p className="text-sm mt-2">Vui lòng đợi trong giây lát</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-300">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        language={language} 
        setLanguage={setLanguage}
        t={t}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setCurrentView('home');
        }}
      />
      
      <main className="flex-1 w-full container mx-auto px-4 py-10 flex flex-col items-center">
        {renderContent()}
      </main>

      <Footer 
        t={t} 
        onPrivacyClick={() => {
          setCurrentView('privacy');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onTermsClick={() => {
          setCurrentView('terms');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onContactClick={() => {
          setCurrentView('contact');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAboutClick={() => {
          setCurrentView('about');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default App;