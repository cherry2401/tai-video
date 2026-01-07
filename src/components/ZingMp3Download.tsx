import React, { useState } from 'react';
import { Loader2, Download, Music, Search, AlertCircle, Headphones, Copy, Check } from 'lucide-react';

interface ZingResponse {
    title: string;
    artist: string;
    thumbnail: string;
    download_url: string;
    error?: string; // Standardize error handling if API differs
}

const ZingMp3Download: React.FC = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ZingResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/zingmp3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url.trim() }),
            });

            const data = (await response.json()) as ZingResponse;

            if (data.download_url) {
                setResult(data);
            } else {
                setError('Không tìm thấy bài hát. Vui lòng kiểm tra lại link.');
            }
        } catch (err) {
            setError('Lỗi kết nối server. Vui lòng thử lại sau.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleForceDownload = async () => {
        if (!result) return;

        // Use direct window.open for reliable mobile handling, or programmatic click
        // Since it's Audio, browser usually handles it well. 
        // Let's try standard download attribute first, if fails uses open.

        try {
            // Fetch Blob approach for PC
            const response = await fetch(result.download_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${result.title} - ${result.artist}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            // Fallback
            window.open(result.download_url, '_blank');
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
                    <Headphones className="text-purple-600" size={40} />
                    Zing MP3 Downloader
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                    Tải Nhạc Chất Lượng Cao 320kbps/Lossless từ Zing MP3.
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-colors">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Music size={20} />
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Dán link bài hát Zing MP3..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors dark:text-white"
                        />
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={loading || !url.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
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
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-6 flex flex-col md:flex-row gap-6 items-center">

                            {/* Thumbnail */}
                            <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 relative rounded-lg overflow-hidden shadow-md">
                                <img
                                    src={`https://wsrv.nl/?url=${encodeURIComponent(result.thumbnail)}&w=400&output=jpg`}
                                    alt={result.title}
                                    className="w-full h-full object-cover animate-spin-slow" // Maybe add a spinning vinyl effect? Or just normal image
                                    style={{ animationDuration: '10s' }}
                                />
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm"></div>
                                </div>
                            </div>

                            {/* Info & Player */}
                            <div className="flex-1 w-full space-y-4 text-center md:text-left">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white line-clamp-2">
                                        {result.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                                        {result.artist}
                                    </p>
                                </div>

                                {/* Audio Player */}
                                <audio controls className="w-full h-10 mt-2">
                                    <source src={result.download_url} type="audio/mpeg" />
                                    Trình duyệt của bạn không hỗ trợ phát nhạc.
                                </audio>

                                {/* Download Button */}
                                <button
                                    onClick={handleForceDownload}
                                    className="w-full md:w-auto px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <Download size={18} />
                                    Tải Nhạc (MP3)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ZingMp3Download;
