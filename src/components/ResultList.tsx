import React from 'react';
import { DownloadResult } from '../types';
import { Download, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Translation } from '../utils/translations';

interface ResultListProps {
  results: DownloadResult[];
  t: Translation;
}

const ResultList: React.FC<ResultListProps> = ({ results, t }) => {
  if (results.length === 0) return null;

  const handleDownloadClick = (result: DownloadResult) => {
    if (!result.downloadUrl) {
      alert('Link download chưa sẵn sàng. Vui lòng đợi...');
      return;
    }

    const btn = document.getElementById(`btn-dl-${result.id}`);
    if (btn) btn.innerHTML = '⏳ Đang tải...';

    // Construct Proxy URL (Force Download) - Dành riêng cho Mobile hoặc khi cần thiết
    const safeTitle = (result.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(result.downloadUrl)}&filename=${safeTitle}.mp4`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // MECHANISM SPLIT:
    if (isMobile) {
      // MOBILE: Dùng Proxy để ép trình duyệt hiện nút "Tải về" (tránh việc nó tự play video)
      window.open(proxyUrl, '_blank');
    } else {
      // PC: Dùng Link Gốc (Direct) để tốt tối ưu cho IDM và tốc độ
      // Nếu trình duyệt tự play, người dùng PC có thể chuột phải "Lưu video" hoặc để IDM bắt link
      window.open(result.downloadUrl, '_blank');
    }

    // Reset button after delay
    setTimeout(() => {
      if (btn) btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Tải xuống`;
    }, 5000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 text-center mb-6 transition-colors">
        {t.results}
      </h3>

      {results.map((result) => (
        <div
          key={result.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row animate-fadeIn transition-colors duration-300"
        >
          {/* Thumbnail Section */}
          <div className="w-full md:w-48 h-32 bg-gray-200 dark:bg-gray-700 relative shrink-0">
            {result.thumbnail ? (
              <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Preview
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {result.platform}
            </div>
            {result.quality && (
              <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                {result.quality}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 mb-1 transition-colors">{result.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all line-clamp-1 mb-2 transition-colors">{result.originalUrl}</p>

              <div className="flex items-center gap-2 text-sm">
                {result.status === 'processing' ? (
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 transition-colors">
                    <Loader2 size={14} className="animate-spin" /> Đang xử lý...
                  </span>
                ) : result.status === 'success' && result.downloadUrl ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 transition-colors">
                    <CheckCircle size={14} /> {t.ready}
                  </span>
                ) : result.status === 'error' ? (
                  <span className="flex items-center gap-1 text-red-500 dark:text-red-400 transition-colors">
                    <AlertCircle size={14} /> {result.errorMessage || t.error}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 transition-colors">
                    <Loader2 size={14} className="animate-spin" /> Chờ download link...
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3 md:mt-0 justify-end">
              <a
                href={result.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink size={12} /> {t.source}
              </a>

              {/* Download Button */}
              {result.status === 'success' && result.downloadUrl ? (
                <button
                  id={`btn-dl-${result.id}`}
                  className="flex items-center gap-1 text-xs text-white bg-green-600 px-3 py-1.5 rounded hover:bg-green-700 transition-colors shadow-md"
                  onClick={() => handleDownloadClick(result)}
                >
                  <Download size={12} /> Tải xuống
                </button>
              ) : result.status === 'error' ? (
                <button
                  className="flex items-center gap-1 text-xs text-white bg-gray-400 px-3 py-1.5 rounded cursor-not-allowed"
                  disabled
                >
                  <AlertCircle size={12} /> Lỗi
                </button>
              ) : (
                <button
                  className="flex items-center gap-1 text-xs text-white bg-blue-500 px-3 py-1.5 rounded opacity-50 cursor-wait"
                  disabled
                >
                  <Loader2 size={12} className="animate-spin" /> Đang tải...
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultList;
