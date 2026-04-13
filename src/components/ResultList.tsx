import React, { useState } from 'react';
import { DownloadResult, VideoFormat } from '../types';
import { Download, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Translation } from '../utils/translations';
import { handleShopeeRedirect } from '../utils/redirectLogic';
import { fetchDownloadWithFormat } from '../services/n8nService';

interface ResultListProps {
  results: DownloadResult[];
  t: Translation;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getQualityLabel(height: number): string {
  if (height >= 2160) return '4K';
  if (height >= 1440) return '2K';
  if (height >= 1080) return 'FHD';
  if (height >= 720) return 'HD';
  if (height >= 480) return 'SD';
  return height + 'p';
}

function getQualityColor(height: number): string {
  if (height >= 2160) return 'bg-purple-600';
  if (height >= 1440) return 'bg-blue-600';
  if (height >= 1080) return 'bg-green-600';
  if (height >= 720) return 'bg-yellow-600';
  return 'bg-gray-500';
}

const QualitySelector: React.FC<{
  result: DownloadResult;
  formats: VideoFormat[];
  onDownloadStart: (result: DownloadResult) => void;
}> = ({ result, formats, onDownloadStart }) => {
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uniqueFormats = formats.reduce<VideoFormat[]>((acc, f) => {
    const key = `${f.height}-${f.ext}`;
    if (!acc.find(x => `${x.height}-${x.ext}` === key)) acc.push(f);
    return acc;
  }, []);

  const getProxyUrl = (rawUrl: string, title: string) => {
    const safeTitle = (title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `/api/download-proxy?url=${encodeURIComponent(rawUrl)}&filename=${safeTitle}.mp4`;
  };

  const handleSelectAndDownload = async (format: VideoFormat) => {
    setSelectedFormat(format);
    setIsDownloading(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const data = await fetchDownloadWithFormat(
        result.originalUrl,
        format.format_id
      );

      if (data.downloadUrl) {
        const rawUrl = data.downloadUrl;
        setDownloadUrl(rawUrl);
        onDownloadStart({ ...result, downloadUrl: rawUrl, quality: format.height + 'p' });

        // Auto-trigger download via proxy
        const proxyUrl = getProxyUrl(rawUrl, result.title || data.title || 'video');
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          window.open(proxyUrl, '_blank');
        } else {
          // Desktop: try blob download, fallback to proxy
          try {
            const resp = await fetch(rawUrl);
            if (!resp.ok) throw new Error('fetch failed');
            const blob = await resp.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = `${(result.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${format.height}p.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
          } catch {
            window.location.href = proxyUrl;
          }
        }
      } else {
        setError('Không nhận được link tải');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        🎬 Chọn chất lượng:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {uniqueFormats.map((f) => {
          const isSelected = selectedFormat?.format_id === f.format_id;
          const sizeStr = formatFileSize(f.filesize);

          return (
            <button
              key={f.format_id}
              disabled={isDownloading}
              onClick={() => handleSelectAndDownload(f)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all text-sm
                ${isSelected && isDownloading
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : isSelected && downloadUrl
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                }
                ${isDownloading && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${getQualityColor(f.height)}`}>
                {getQualityLabel(f.height)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 dark:text-gray-200 text-xs">
                  {f.height}p
                  <span className="ml-1 text-gray-400 uppercase text-[10px]">{f.ext}</span>
                </div>
                {sizeStr && (
                  <div className="text-[10px] text-gray-400">{sizeStr}</div>
                )}
              </div>
              {isSelected && isDownloading && (
                <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />
              )}
              {isSelected && downloadUrl && (
                <CheckCircle size={14} className="text-green-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {downloadUrl && (
        <div className="mt-3 flex justify-center">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-white bg-green-600 px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Download size={14} /> Tải xuống
          </a>
        </div>
      )}
    </div>
  );
};

const ResultList: React.FC<ResultListProps> = ({ results, t }) => {
  if (results.length === 0) return null;

  const handleDownloadClick = (result: DownloadResult) => {
    handleShopeeRedirect();

    if (!result.downloadUrl) {
      alert('Link download chưa sẵn sàng. Vui lòng đợi...');
      return;
    }

    const btn = document.getElementById(`btn-dl-${result.id}`);
    if (btn) btn.innerHTML = '⏳ Đang tải...';

    const safeTitle = (result.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(result.downloadUrl)}&filename=${safeTitle}.mp4`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.open(proxyUrl, '_blank');
    } else {
      const tryDirectDownload = async () => {
        try {
          if (btn) btn.innerHTML = '⏳ Đang tải về máy...';

          const response = await fetch(result.downloadUrl!);
          if (!response.ok) throw new Error('Fetch failed');

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${safeTitle}.mp4`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          if (btn) btn.innerHTML = '✅ Đã tải xong';
        } catch (e) {
          console.log('Direct download blocked (CORS), falling back to Proxy...');
          window.location.href = proxyUrl;
        }
      };

      tryDirectDownload();
    }

    setTimeout(() => {
      if (btn) btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Tải xuống`;
    }, 5000);
  };

  const hasYouTubeFormats = (result: DownloadResult) =>
    result.platform?.toLowerCase() === 'youtube' && result.formats && result.formats.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 text-center mb-6 transition-colors">
        {t.results}
      </h3>

      {results.map((result) => (
        <div
          key={result.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeIn transition-colors duration-300"
        >
          <div className="flex flex-col md:flex-row">
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
              {result.quality && !hasYouTubeFormats(result) && (
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                  {result.quality}
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 mb-1 transition-colors">{result.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 break-all line-clamp-1 mb-2 transition-colors">{result.originalUrl}</p>

                <div className="flex items-center gap-2 text-sm">
                  {result.status === 'processing' ? (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 transition-colors">
                      <Loader2 size={14} className="animate-spin" /> Đang xử lý...
                    </span>
                  ) : result.status === 'success' && (result.downloadUrl || hasYouTubeFormats(result)) ? (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 transition-colors">
                      <CheckCircle size={14} /> {hasYouTubeFormats(result) ? 'Sẵn sàng — chọn chất lượng bên dưới' : t.ready}
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

              {!hasYouTubeFormats(result) && (
                <div className="flex gap-2 mt-3 md:mt-0 justify-end">
                  <a
                    href={result.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink size={12} /> {t.source}
                  </a>

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
              )}
            </div>
          </div>

          {hasYouTubeFormats(result) && (
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
              <QualitySelector
                result={result}
                formats={result.formats!}
                onDownloadStart={handleDownloadClick}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResultList;
