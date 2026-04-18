import React, { useState } from 'react';
import { Loader2, Download, Search, AlertCircle, Video, Eye, Clock, Play } from 'lucide-react';
import { Language } from '../utils/translations';

// Type definitions (based on API response)
interface XVideoSearchResult {
    title: string;
    url: string;
    thumbnail: string;
    duration: string;
    views: string;
}

interface XVideoDownloadData {
    title: string;
    thumbnail:
        | string
        | {
              default?: string;
              widescreen?: string;
              slide?: string;
              slideBig?: string;
              ldJson?: string;
          };
    videoUrls: {
        low: string;
        high: string;
    };
}

interface XVideoResponse {
    success?: boolean;
    data?: XVideoDownloadData;       // For download action
    results?: XVideoSearchResult[];  // For search action
    error?: string;
}

interface XvideosDownloadProps {
    language: Language;
}

const XvideosDownload: React.FC<XvideosDownloadProps> = ({ language }) => {
    const isVi = language === 'vi';
    const [mode, setMode] = useState<'search' | 'download'>('search');
    const [query, setQuery] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [searchResults, setSearchResults] = useState<XVideoSearchResult[]>([]);
    const [downloadData, setDownloadData] = useState<XVideoDownloadData | null>(null);

    const getThumbnailUrl = (thumbnail: XVideoDownloadData['thumbnail']): string => {
        if (!thumbnail) return '';
        if (typeof thumbnail === 'string') return thumbnail;
        return thumbnail.default || thumbnail.widescreen || thumbnail.slideBig || thumbnail.slide || thumbnail.ldJson || '';
    };

    // ACTION: Search
    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setSearchResults([]);

        try {
            const response = await fetch('/api/xvideos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'search', query: query.trim() }),
            });

            const data = (await response.json()) as XVideoResponse;

            if (data.results && data.results.length > 0) {
                setSearchResults(data.results);
            } else {
                setError(isVi ? 'Không tìm thấy kết quả nào.' : 'No results found.');
            }
        } catch (err) {
            setError(isVi ? 'Lỗi kết nối server.' : 'Server connection error.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ACTION: Fetch Download Link
    const handleGetLink = async (targetUrl: string) => {
        if (!targetUrl.trim()) return;
        setLoading(true);
        setError(null);
        setDownloadData(null);
        // If coming from search, ensure we switch to download view context visually if needed, 
        // but here we might just show the download UI in place or switch tabs.
        // Let's switch tab to 'download' and fill the URL input for clarity.
        setMode('download');
        setUrl(targetUrl);

        try {
            const response = await fetch('/api/xvideos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'download', url: targetUrl.trim() }),
            });

            const res = (await response.json()) as XVideoResponse;

            if (res.success && res.data) {
                const normalized: XVideoDownloadData = {
                    ...res.data,
                    thumbnail: getThumbnailUrl(res.data.thumbnail),
                };
                setDownloadData(normalized);
            } else {
                setError(isVi ? 'Không thể lấy link tải. Video có thể đã bị xóa hoặc lỗi server.' : 'Cannot fetch download link. Video may be removed or server failed.');
            }
        } catch (err) {
            setError(isVi ? 'Lỗi lấy link download.' : 'Failed to fetch download link.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Trigger Download
    const triggerDownload = (videoUrl: string, label: string) => {
        // Mobile Safe: Open in new tab
        window.open(videoUrl, '_blank');
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
            {/* Header / Logo */}
            <div className="text-center mb-8 space-y-2">
                <h1 className="text-2xl md:text-4xl font-bold text-[#334155] dark:text-gray-100 flex flex-col items-center justify-center gap-2">
                    <img src="/icon/xvideos.png" alt="Xvideos" className="h-10 md:h-14 object-contain" />
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {isVi ? 'Tìm kiếm & Tải video Full HD miễn phí.' : 'Search and download Full HD videos for free.'}
                </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={() => setMode('search')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'search'
                        ? 'bg-red-600 text-white shadow-md transform scale-105'
                        : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2b3458]'
                        }`}
                >
                    <Search className="inline-block w-4 h-4 mr-2" />
                    {isVi ? 'Tìm kiếm' : 'Search'}
                </button>
                <button
                    onClick={() => setMode('download')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'download'
                        ? 'bg-red-600 text-white shadow-md transform scale-105'
                        : 'bg-white dark:bg-[#1f2747]/95 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2b3458]'
                        }`}
                >
                    <Download className="inline-block w-4 h-4 mr-2" />
                    {isVi ? 'Tải link' : 'Download URL'}
                </button>
            </div>

            {/* SEARCH MODE UI */}
            {mode === 'search' && (
                <div className="space-y-6">
                    {/* Search Input */}
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder={isVi ? 'Nhập từ khóa (vd: nhạc trẻ, vlog...)' : 'Enter keyword (e.g. music, vlog...)'}
                            className="w-full pl-5 pr-14 py-3 bg-white dark:bg-[#1f2747]/95 border border-gray-300 dark:border-indigo-900/70 rounded-full focus:ring-2 focus:ring-red-500 focus:outline-none shadow-[0_7px_18px_rgba(15,23,42,0.07)] dark:shadow-[0_8px_18px_rgba(2,6,23,0.28)] dark:text-white"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="absolute right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Search Results Grid */}
                    {searchResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {searchResults.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleGetLink(item.url)}
                                    className="group bg-white dark:bg-[#1f2747]/95 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-indigo-900/60 hover:shadow-md transition-all cursor-pointer"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-gray-200 dark:bg-[#2b3458]">
                                        <img
                                            src={item.thumbnail}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            {item.duration}
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                            <Play className="text-white opacity-0 group-hover:opacity-100 w-10 h-10 drop-shadow-lg transform scale-50 group-hover:scale-100 transition-all" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 text-sm md:text-base">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1"><Eye size={12} /> {item.views || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* DOWNLOAD MODE UI */}
            {mode === 'download' && (
                <div className="bg-white dark:bg-[#1f2747]/95 rounded-xl shadow-[0_8px_22px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_26px_rgba(2,6,23,0.30)] border border-gray-200 dark:border-indigo-900/60 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-3 mb-6">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={isVi ? 'Dán link video Xvideos tại đây...' : 'Paste Xvideos URL here...'}
                            className="flex-1 w-full px-4 py-3 bg-gray-50 dark:bg-[#2b3458] border border-gray-300 dark:border-indigo-900/70 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none dark:text-white"
                        />
                        <button
                            onClick={() => handleGetLink(url)}
                            disabled={loading || !url.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Download />}
                            {isVi ? 'Lấy link' : 'Get link'}
                        </button>
                    </div>

                    {/* Download Result */}
                    {downloadData && (
                        <div className="animate-fadeIn mt-8 p-4 bg-gray-50 dark:bg-[#2b3458]/55 rounded-lg border border-gray-200 dark:border-indigo-900/60">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Thumb */}
                                <div className="w-full md:w-1/3 aspect-video rounded-lg overflow-hidden bg-black relative">
                                    <img src={downloadData.thumbnail} alt={downloadData.title} className="w-full h-full object-contain" />
                                </div>

                                {/* Info & Buttons */}
                                <div className="flex-1 space-y-4">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{downloadData.title}</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {downloadData.videoUrls.low && (
                                            <button
                                                onClick={() => triggerDownload(downloadData.videoUrls.low, 'Low')}
                                                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2"
                                            >
                                                <Download size={16} /> {isVi ? 'Tải chất lượng thường' : 'Download Standard Quality'}
                                            </button>
                                        )}
                                        {downloadData.videoUrls.high && (
                                            <button
                                                onClick={() => triggerDownload(downloadData.videoUrls.high, 'High')}
                                                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2"
                                            >
                                                <Download size={16} /> {isVi ? 'Tải chất lượng cao (HD)' : 'Download High Quality (HD)'}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 italic mt-2 text-center">
                                        {isVi ? '*Nếu không tự tải, video sẽ mở trong tab mới. Hãy bấm menu 3 chấm ở góc video để lưu.' : '*If auto-download does not start, the video will open in a new tab. Use the 3-dot menu on the player to save it.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default XvideosDownload;

