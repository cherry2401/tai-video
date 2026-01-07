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
import ShopeeAffiliate from './components/ShopeeAffiliate';
import InstagramDownload from './components/InstagramDownload';
import ZingMp3Download from './components/ZingMp3Download';
import XvideosDownload from './components/XvideosDownload';
import { analyzeLinks } from './services/geminiService';
import { enrichResultWithDownload } from './services/n8nService';
import { isShopeeUrl } from './services/affiliateService';
import { DownloadResult, NavItem } from './types';
import { translations, Language } from './utils/translations';
import { Loader2, Construction } from 'lucide-react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DownloadResult[]>([]);

  // NEW: State for affiliate tracking
  const [currentShopeeUrl, setCurrentShopeeUrl] = useState<string>('');
  const [affiliateTracked, setAffiliateTracked] = useState(false);
  const [isAffiliateHidden, setIsAffiliateHidden] = useState(false); // NEW: Hidden mode state
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);

  // State for Theme, Language, Active Tab, and Current View
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('vi');
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.VIDEO);
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms' | 'contact' | 'about'>('home');

  // State for Redirect Logic
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Tool Sub-state
  const [activeTool, setActiveTool] = useState<'instagram' | 'zing' | 'xvideos'>('instagram');

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // NEW: Enhanced download handler với n8n + affiliate tracking
  const handleDownload = async (links: string[]) => {
    setIsLoading(true);
    setResults([]); // Clear previous results
    setAffiliateTracked(false);
    setCurrentShopeeUrl('');
    setIsAffiliateHidden(false); // Reset hidden state

    try {
      // Step 1: Analyze links với Gemini
      console.log('🔍 Step 1: Analyzing links with Gemini...');
      const analyzedResults = await analyzeLinks(links);

      // Set kết quả ban đầu (chưa có download link)
      setResults(analyzedResults);

      // Step 2: Affiliate Logic (Updated for Global Tracking)
      const shopeeResult = analyzedResults.find(r => isShopeeUrl(r.originalUrl));

      if (shopeeResult) {
        // CASE A: User tải video Shopee -> Hiện iframe công khai
        console.log('🛍️ Shopee URL detected, showing affiliate iframe...');
        setCurrentShopeeUrl(shopeeResult.originalUrl);
        setIsAffiliateHidden(false);
      } else {
        // CASE B: User tải nền tảng khác -> Hiện iframe ẩn (Global Tracking)
        console.log('🚀 Non-Shopee URL, triggering background global tracking...');
        setCurrentShopeeUrl('https://shopee.vn'); // Link Shopee gốc để set cookie global
        setIsAffiliateHidden(true);
      }

    } catch (error) {
      console.error("Error processing links:", error);
      alert("Có lỗi xảy ra khi xử lý links. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Callback khi affiliate tracking hoàn thành
  const handleAffiliateTrackingComplete = async (success: boolean) => {
    console.log(`✅ Step 3: Affiliate tracking ${success ? 'completed' : 'failed'}`);
    setAffiliateTracked(true);

    // Tiếp tục lấy download links từ n8n
    await enrichResultsWithDownloadLinks(results);
  };

  // NEW: Enrich results với download links từ n8n
  const enrichResultsWithDownloadLinks = async (resultsToEnrich: DownloadResult[]) => {
    setIsProcessingDownload(true);

    try {
      console.log('📥 Step 4: Fetching download links from n8n...');

      // Gọi n8n webhook cho từng result
      const enrichedResults = await Promise.all(
        resultsToEnrich.map(result => enrichResultWithDownload(result))
      );

      console.log('✅ Download links fetched:', enrichedResults);
      setResults(enrichedResults);

    } catch (error) {
      console.error('Error enriching results:', error);
      alert('Không thể lấy link download. Vui lòng thử lại.');
    } finally {
      setIsProcessingDownload(false);
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
        <div className="w-full max-w-4xl mx-auto">
          {/* Tool Switcher Tabs */}
          <div className="flex justify-center gap-2 mb-8 animate-fadeIn">
            <button
              onClick={() => setActiveTool('instagram')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${activeTool === 'instagram'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              Instagram
            </button>
            <button
              onClick={() => setActiveTool('zing')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${activeTool === 'zing'
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              Zing MP3
            </button>
            <button
              onClick={() => setActiveTool('xvideos')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${activeTool === 'xvideos'
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              Xvideos
            </button>
          </div>

          {/* Tool Content */}
          {activeTool === 'instagram' && <InstagramDownload />}
          {activeTool === 'zing' && <ZingMp3Download />}
          {activeTool === 'xvideos' && <XvideosDownload />}
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

        <DownloadForm onDownload={handleDownload} isLoading={isLoading || isProcessingDownload} t={t} />

        {/* NEW: Shopee Affiliate Iframe (Updated with hidden support) */}
        {currentShopeeUrl && !affiliateTracked && (
          <div className={isAffiliateHidden ? "sr-only" : "w-full max-w-4xl mx-auto mt-8 animate-fadeIn"}>
            <ShopeeAffiliate
              url={currentShopeeUrl}
              onTrackingComplete={handleAffiliateTrackingComplete}
              forceHidden={isAffiliateHidden}
            />
          </div>
        )}

        {/* Processing indicator */}
        {isProcessingDownload && (
          <div className="w-full max-w-4xl mx-auto mt-8 text-center animate-fadeIn">
            <div className="flex items-center justify-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Đang lấy link download từ server...
              </p>
            </div>
          </div>
        )}

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
