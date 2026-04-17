import React, { useState } from 'react';
import { Loader2, Download, Search, AlertCircle, Eye, Play } from 'lucide-react';

interface XnxxSearchResult {
  title: string;
  url: string;
  thumbnail: string;
  duration: string | null;
  views: string | null;
  quality?: string;
}

interface XnxxDownloadData {
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

interface XnxxResponse {
  success?: boolean;
  data?: XnxxDownloadData & { videos?: XnxxSearchResult[] };
  error?: string;
  message?: string;
}

const XnxxDownload: React.FC = () => {
  const [mode, setMode] = useState<'search' | 'download'>('search');
  const [query, setQuery] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<XnxxSearchResult[]>([]);
  const [downloadData, setDownloadData] = useState<XnxxDownloadData | null>(null);

  const getThumbnailUrl = (thumbnail: XnxxDownloadData['thumbnail']): string => {
    if (!thumbnail) return '';
    if (typeof thumbnail === 'string') return thumbnail;
    return thumbnail.default || thumbnail.widescreen || thumbnail.slideBig || thumbnail.slide || thumbnail.ldJson || '';
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch('/api/xnxx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: query.trim(), page: 0 }),
      });

      const data = (await response.json()) as XnxxResponse;
      const videos = data?.data?.videos || [];

      if (Array.isArray(videos) && videos.length > 0) {
        setSearchResults(videos);
      } else {
        setError(data.message || 'Không tìm thấy kết quả nào.');
      }
    } catch (err) {
      setError('Lỗi kết nối server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLink = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    setError(null);
    setDownloadData(null);
    setMode('download');
    setUrl(targetUrl);

    try {
      const response = await fetch('/api/xnxx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download', url: targetUrl.trim() }),
      });

      const res = (await response.json()) as XnxxResponse;

      if (res.success && res.data) {
        const normalized: XnxxDownloadData = {
          ...res.data,
          thumbnail: getThumbnailUrl(res.data.thumbnail),
        };
        setDownloadData(normalized);
      } else {
        setError(res.message || 'Không thể lấy link tải. Video có thể đã bị xóa hoặc lỗi server.');
      }
    } catch (err) {
      setError('Lỗi lấy link download.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold text-[#334155] dark:text-gray-100 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl md:text-5xl font-black tracking-wide text-gray-900 dark:text-gray-100">XNXX</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Tìm kiếm & Tải video Full HD miễn phí.</p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setMode('search')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            mode === 'search'
              ? 'bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-md transform scale-105'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Search className="inline-block w-4 h-4 mr-2" />
          Tìm Kiếm
        </button>
        <button
          onClick={() => setMode('download')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            mode === 'download'
              ? 'bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-md transform scale-105'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Download className="inline-block w-4 h-4 mr-2" />
          Tải Link
        </button>
      </div>

      {mode === 'search' && (
        <div className="space-y-6">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nhập từ khóa (vd: vietnam...)"
              className="w-full pl-5 pr-14 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-gray-600 focus:outline-none shadow-sm dark:text-white"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="absolute right-2 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleGetLink(item.url)}
                  className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    {item.duration && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{item.duration}</div>
                    )}
                    {item.quality && (
                      <div className="absolute top-2 left-2 bg-gray-900/80 text-white text-xs px-2 py-1 rounded">{item.quality}</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <Play className="text-white opacity-0 group-hover:opacity-100 w-10 h-10 drop-shadow-lg transform scale-50 group-hover:scale-100 transition-all" />
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 text-sm md:text-base">{item.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {item.views || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'download' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Dán link video XNXX tại đây..."
              className="flex-1 w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-600 focus:outline-none dark:text-white"
            />
            <button
              onClick={() => handleGetLink(url)}
              disabled={loading || !url.trim()}
              className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Download />}
              Lấy Link
            </button>
          </div>

          {downloadData && (
            <div className="animate-fadeIn mt-8 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 aspect-video rounded-lg overflow-hidden bg-black relative">
                  <img src={downloadData.thumbnail as string} alt={downloadData.title} className="w-full h-full object-contain" />
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{downloadData.title}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {downloadData.videoUrls.low && (
                      <button
                        onClick={() => triggerDownload(downloadData.videoUrls.low)}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Download size={16} /> Tải Chất Lượng Thường
                      </button>
                    )}
                    {downloadData.videoUrls.high && (
                      <button
                        onClick={() => triggerDownload(downloadData.videoUrls.high)}
                        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Download size={16} /> Tải Chất Lượng Cao (HD)
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 italic mt-2 text-center">
                    *Nếu không tự tải, video sẽ mở trong tab mới. Hãy bấm menu 3 chấm ở góc video để lưu.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default XnxxDownload;

