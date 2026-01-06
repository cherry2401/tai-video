import React, { useState } from 'react';
import { Loader2, Download, Instagram, Search, AlertCircle, PlayCircle, Image as ImageIcon, Copy, Check } from 'lucide-react';

interface MediaItem {
    type: 'Photo' | 'Video';
    url: string;
}

interface InstagramResponse {
    success: boolean;
    found: boolean;
    type: string;
    media: string[];
    message?: string;
    attachments?: MediaItem[];
}

const InstagramDownload: React.FC = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<InstagramResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [captionCopied, setCaptionCopied] = useState(false);

    const handleCopyCaption = () => {
        if (result?.message) {
            navigator.clipboard.writeText(result.message);
            setCaptionCopied(true);
            setTimeout(() => setCaptionCopied(false), 2000);
        }
    };

    const handleDownload = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/instagram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url.trim() }),
            });

            const data = await response.json();

            if (data.success && data.found) {
                setResult(data);
            } else {
                setError(data.message || 'Không tìm thấy media. Vui lòng kiểm tra lại link (phải là Public).');
            }
        } catch (err) {
            setError('Lỗi kết nối server. Vui lòng thử lại sau.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleForceDownload = async (mediaUrl: string, type: 'Photo' | 'Video', index: number) => {
        // Detect Mobile (Simple check)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // On Mobile, opening Blob is unreliable or blocked.
        // Direct link is better (let Browser handle saving).
        if (isMobile) {
            window.open(mediaUrl, '_blank');
            return;
        }

        try {
            // For images, use proxy to bypass CORS/Hotlink protection
            const fetchUrl = type === 'Photo'
                ? `https://wsrv.nl/?url=${encodeURIComponent(mediaUrl)}&output=jpg`
                : mediaUrl;

            const response = await fetch(fetchUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `instagram_${type.toLowerCase()}_${index + 1}.${type === 'Photo' ? 'jpg' : 'mp4'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: Open in new window if force download fails
            window.open(mediaUrl, '_blank');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleDownload();
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
            {/* Header */}
            <div className="text-center mb-10 space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-[#334155] dark:text-gray-100 transition-colors flex items-center justify-center gap-3">
                    <Instagram className="text-pink-600" size={40} />
                    Instagram Downloader
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                    Tải Ảnh, Video, Reels, Stories từ Instagram miễn phí - chất lượng gốc.
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-colors">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Instagram size={20} />
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Dán link Instagram (ví dụ: https://www.instagram.com/p/...)"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-pink-500 focus:outline-none transition-colors dark:text-white"
                        />
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={loading || !url.trim()}
                        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        {loading ? 'Đang Xử Lý' : 'Tải Ngay'}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 flex items-center gap-3">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="mt-10 animate-fadeIn">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            Kết quả tìm thấy ({result.attachments?.length || 0})
                        </h3>

                        {/* Caption Section */}
                        {result.message && (
                            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Caption</h4>
                                    <button
                                        onClick={handleCopyCaption}
                                        className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                                    >
                                        {captionCopied ? <Check size={14} /> : <Copy size={14} />}
                                        {captionCopied ? 'Đã sao chép' : 'Sao chép'}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {result.message}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                            {result.attachments?.map((item, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                                    {/* Media Preview */}
                                    <div className="aspect-[4/5] relative flex items-center justify-center bg-black/5 dark:bg-black/20 group">
                                        {item.type === 'Video' ? (
                                            <div className="relative w-full h-full">
                                                <video
                                                    src={item.url}
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                    crossOrigin="anonymous"
                                                    playsInline
                                                    controlsList="nodownload"
                                                />
                                                <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full pointer-events-none">
                                                    <PlayCircle size={14} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={`https://wsrv.nl/?url=${encodeURIComponent(item.url)}&w=400&output=jpg`}
                                                    alt={`Result ${index}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full pointer-events-none">
                                                    <ImageIcon size={14} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Download Button */}
                                    <div className="p-2 md:p-3">
                                        <button
                                            onClick={() => handleForceDownload(item.url, item.type, index)}
                                            className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs md:text-sm font-medium transition-colors shadow-sm"
                                        >
                                            <Download size={14} />
                                            {item.type === 'Video' ? 'Video' : 'Ảnh'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstagramDownload;
