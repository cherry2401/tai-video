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
import AiWriter from './components/AiWriter';
import ContactForm from './components/ContactForm';
import AboutUs from './components/AboutUs';
import ShopeeAffiliate from './components/ShopeeAffiliate';
import InstagramDownload from './components/InstagramDownload';
import ZingMp3Download from './components/ZingMp3Download';
import XvideosDownload from './components/XvideosDownload';
import XnxxDownload from './components/XnxxDownload';
import SoundCloudDownload from './components/SoundCloudDownload';
import TempMailUtility from './components/TempMailUtility';
import TwoFaUtility from './components/TwoFaUtility';
import OutlookMailboxUtility from './components/OutlookMailboxUtility';
import ChatGptCdkUtility from './components/ChatGptCdkUtility';
import ChatGptCdkV2Utility from './components/ChatGptCdkV2Utility';
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
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.HOME);
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms' | 'contact' | 'about'>('home');

  // State for Redirect Logic
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Tool Sub-state
  const [activeTool, setActiveTool] = useState<'instagram' | 'zing' | 'xvideos' | 'xnxx' | 'soundcloud'>('instagram');
  const [activeUtility, setActiveUtility] = useState<'tempmail' | 'twofa' | 'outlook' | 'cdk' | 'cdkV2'>('tempmail');

  // Translation Helper
  const t = translations[language];
  const appBackgroundStyle =
    theme === 'dark'
      ? {
          backgroundColor: '#0b1230',
          backgroundImage:
            'radial-gradient(1200px 700px at 10% 0%, rgba(99, 102, 241, 0.26), transparent 60%), radial-gradient(1000px 600px at 90% 10%, rgba(56, 189, 248, 0.18), transparent 58%), linear-gradient(135deg, #0b1230 0%, #1c1b47 45%, #2c2a63 100%)',
        }
      : {
          backgroundColor: '#fcfeff',
          backgroundImage:
            'radial-gradient(760px 240px at 50% -110px, rgba(110, 231, 183, 0.07), transparent 74%), radial-gradient(940px 300px at 8% -140px, rgba(186, 230, 253, 0.08), transparent 76%), radial-gradient(820px 280px at 92% -150px, rgba(165, 243, 252, 0.07), transparent 77%), radial-gradient(1200px 520px at 50% 0%, rgba(255, 255, 255, 0.5), transparent 66%), linear-gradient(180deg, #f9fffd 0%, #fbfdff 30%, #fcfdff 60%, #fdfdff 100%)',
        };

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
      alert(language === 'vi' ? 'Có lỗi xảy ra khi xử lý links. Vui lòng thử lại.' : 'An error occurred while processing links. Please try again.');
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

  // NEW: Enrich results với download links từ n8n (streaming - từng result cập nhật ngay khi API respond)
  const enrichResultsWithDownloadLinks = async (resultsToEnrich: DownloadResult[]) => {
    setIsProcessingDownload(true);

    try {
      console.log('📥 Step 4: Fetching download links from n8n...');

      // Gọi n8n webhook cho từng result - cập nhật UI ngay khi mỗi result resolve
      const promises = resultsToEnrich.map(async (result, index) => {
        const enriched = await enrichResultWithDownload(result);
        // Cập nhật UI ngay lập tức khi result này resolve (không đợi tất cả)
        setResults(prev => prev.map((r, i) => i === index ? enriched : r));
        return enriched;
      });

      await Promise.all(promises);
      console.log('✅ All download links fetched');

    } catch (error) {
      console.error('Error enriching results:', error);
      alert(language === 'vi' ? 'Không thể lấy link download. Vui lòng thử lại.' : 'Cannot fetch download links. Please try again.');
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
      return <ShortenForm t={t} language={language} />;
    }

    if (activeTab === NavItem.AI_WRITER) {
      return <AiWriter t={t} language={language} />;
    }

    if (activeTab === NavItem.TOOL) {
      return (
        <div className="w-full max-w-4xl mx-auto">
          {/* Tool Switcher Tabs - Hidden on Mobile, Visible on Desktop */}
          <div className="hidden md:block overflow-x-auto pb-4 mb-4 md:mb-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex md:justify-center gap-3 w-max md:w-auto">
              <button
                onClick={() => setActiveTool('instagram')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTool === 'instagram'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform scale-105'
                  : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                  }`}
              >
                Instagram
              </button>
              <button
                onClick={() => setActiveTool('zing')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTool === 'zing'
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md transform scale-105'
                  : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                  }`}
              >
                Zing MP3
              </button>
              <button
                onClick={() => setActiveTool('soundcloud')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTool === 'soundcloud'
                  ? 'bg-orange-600 text-white shadow-md transform scale-105'
                  : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                  }`}
              >
                SoundCloud
              </button>
              <button
                onClick={() => setActiveTool('xvideos')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTool === 'xvideos'
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md transform scale-105'
                  : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                  }`}
              >
                Xvideos
              </button>
              <button
                onClick={() => setActiveTool('xnxx')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTool === 'xnxx'
                  ? 'bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-md transform scale-105'
                  : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                  }`}
              >
                XNXX
              </button>
            </div>
          </div>

          {/* Tool Content */}
          {activeTool === 'instagram' && <InstagramDownload language={language} />}
          {activeTool === 'zing' && <ZingMp3Download language={language} />}
          {activeTool === 'soundcloud' && <SoundCloudDownload language={language} />}
          {activeTool === 'xvideos' && <XvideosDownload language={language} />}
          {activeTool === 'xnxx' && <XnxxDownload language={language} />}
        </div>
      );
    }

    if (activeTab === NavItem.VIDEO) {
      return (
        <div className={`w-full mx-auto ${(activeUtility === 'cdk' || activeUtility === 'cdkV2') ? 'max-w-[1760px]' : 'max-w-4xl'}`}>
          <div className="hidden md:block overflow-x-auto pb-4 mb-4 md:mb-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex md:justify-center gap-3 w-max md:w-auto">
              <button
                onClick={() => setActiveUtility('tempmail')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                  activeUtility === 'tempmail'
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md transform scale-105'
                    : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                }`}
              >
                Tempmail
              </button>
              <button
                onClick={() => setActiveUtility('twofa')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                  activeUtility === 'twofa'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md transform scale-105'
                    : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                }`}
              >
                2FA
              </button>
              <button
                onClick={() => setActiveUtility('outlook')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                  activeUtility === 'outlook'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md transform scale-105'
                    : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                }`}
              >
                Outlook
              </button>
              <button
                onClick={() => setActiveUtility('cdk')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                  activeUtility === 'cdk'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md transform scale-105'
                    : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                }`}
              >
                ChatGPT CDK
              </button>
              <button
                onClick={() => setActiveUtility('cdkV2')}
                className={`flex-shrink-0 px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                  activeUtility === 'cdkV2'
                    ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-md transform scale-105'
                    : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2b3458] border border-gray-100 dark:border-indigo-900/60'
                }`}
              >
                ChatGPT CDK V2
              </button>
            </div>
          </div>

          {activeUtility === 'tempmail' && <TempMailUtility language={language} />}
          {activeUtility === 'twofa' && <TwoFaUtility language={language} />}
          {activeUtility === 'outlook' && <OutlookMailboxUtility language={language} />}
          {activeUtility === 'cdk' && <ChatGptCdkUtility language={language} />}
          {activeUtility === 'cdkV2' && <ChatGptCdkV2Utility language={language} />}
        </div>
      );
    }

    // Default view: Home
    return (
      <>
        <div className="text-center mb-10 space-y-2 animate-fadeIn">
          <h1 className="text-2xl md:text-4xl font-bold text-[#334155] dark:text-gray-100 transition-colors">
            {t.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base transition-colors">
            {t.subtitle}
          </p>
        </div>

        <DownloadForm onDownload={handleDownload} isLoading={isLoading || isProcessingDownload} t={t} theme={theme} />

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
                {language === 'vi' ? 'Đang lấy link download từ server...' : 'Fetching download links from server...'}
              </p>
            </div>
          </div>
        )}

        <ResultList results={results} t={t} />

        <FeatureSection t={t} />

        <TutorialSection t={t} />

        <SupportedPlatforms t={t} theme={theme} />

        <FAQSection t={t} />
      </>
    );
  };

  // If redirecting, show a simple loading screen instead of the main app
  if (isRedirecting) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] text-gray-600 dark:text-gray-300 transition-colors duration-300"
        style={appBackgroundStyle}
      >
        <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
        <h2 className="text-xl font-semibold">{language === 'vi' ? 'Đang chuyển hướng...' : 'Redirecting...'}</h2>
        <p className="text-sm mt-2">{language === 'vi' ? 'Vui lòng đợi trong giây lát' : 'Please wait a moment'}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-[#f8fafc] transition-colors duration-300"
      style={appBackgroundStyle}
    >
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
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeUtility={activeUtility}
        setActiveUtility={setActiveUtility}
      />

      <main className="flex-1 w-full container mx-auto px-4 py-10 flex flex-col items-center">
        {renderContent()}
      </main>

      <Footer
        theme={theme}
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
