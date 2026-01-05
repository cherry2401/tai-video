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

  // ... (lines 32-78 skipped)

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

      // Note: Logic tải n8n sẽ được gọi trong callback handleAffiliateTrackingComplete
      // để đảm bảo cookie được set xong mới cho user tải file.

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

  // ... (lines 123-191 skipped)

  {/* NEW: Shopee Affiliate Iframe (Updated with hidden support) */ }
  {
    currentShopeeUrl && !affiliateTracked && (
      <div className={isAffiliateHidden ? "sr-only" : "w-full max-w-4xl mx-auto mt-8 animate-fadeIn"}>
        <ShopeeAffiliate
          url={currentShopeeUrl}
          onTrackingComplete={handleAffiliateTrackingComplete}
          forceHidden={isAffiliateHidden}
        />
      </div>
    )
  }

  {/* Processing indicator */ }
  {
    isProcessingDownload && (
      <div className="w-full max-w-4xl mx-auto mt-8 text-center animate-fadeIn">
        <div className="flex items-center justify-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Đang lấy link download từ server...
          </p>
        </div>
      </div>
    )
  }

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
