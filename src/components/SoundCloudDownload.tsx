import React, { useState } from 'react';
import { Loader2, Download, Music, Play, AlertCircle, Headphones } from 'lucide-react';

// Interfaces based on provided API response
interface SoundCloudTrackInfo {
    title: string;
    description: string;
    duration: string;
    artwork_url: string;
    stats: {
        plays: string;
        likes: string;
        reposts: string;
        comments: string;
    };
    artist: {
        username: string;
        full_name: string;
        avatar_url: string;
    };
}

interface SoundCloudDownloadLink {
    quality: string;
    format: string;
    url: string;
    description?: string;
}

interface SoundCloudResponse {
    success: boolean;
    track_info?: SoundCloudTrackInfo;
    download_links?: SoundCloudDownloadLink[];
    message?: string;
}

const SoundCloudDownload: React.FC = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<SoundCloudResponse | null>(null);

    const handleGetLink = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch('/api/soundcloud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() }),
            });

            const result = (await response.json()) as SoundCloudResponse;

            if (result.success && result.track_info) {
                setData(result);
            } else {
                setError(result.message || 'Không thể lấy thông tin bài hát.');
            }
        } catch (err) {
            setError('Lỗi kết nối server.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const triggerDownload = (link: string) => {
        window.open(link, '_blank');
    };

    // Filter for progressive MP3s or best available
    const getDownloadableLinks = () => {
        if (!data?.download_links) return [];
        // Prioritize 'progressive' format usually associated with MP3 download
        return data.download_links.filter(l => l.quality === 'High Quality' || l.format.includes('progressive') || l.format === 'mp3');
    };

    const filteredLinks = getDownloadableLinks();
    // Use all links if filter is too aggressive
    const displayLinks = filteredLinks.length > 0 ? filteredLinks : data?.download_links || [];


    return (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
            {/* Header */}
            <div className="text-center mb-8 space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-[#334155] dark:text-gray-100 flex items-center justify-center gap-2">
                    <img src="/icon/soundcloud.png" alt="SoundCloud" className="h-11 md:h-12 w-auto object-contain" />
                    <span>SoundCloud Downloader</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Tải nhạc SoundCloud chất lượng cao miễn phí.
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Dán link bài hát SoundCloud tại đây..."
                        className="flex-1 w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleGetLink()}
                    />
                    <button
                        onClick={handleGetLink}
                        disabled={loading || !url.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Download />}
                        Lấy Link
                    </button>
                </div>

                {/* Result Section */}
                {data && data.track_info && (
                    <div className="animate-fadeIn mt-8 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Artwork */}
                            <div className="w-full md:w-1/3 aspect-square rounded-lg overflow-hidden shadow-md relative group">
                                <img
                                    src={data.track_info.artwork_url || data.track_info.artist.avatar_url}
                                    alt={data.track_info.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                    <div className="bg-orange-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all">
                                        <Headphones size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Info & Download */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                                        {data.track_info.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <img
                                            src={data.track_info.artist.avatar_url}
                                            alt={data.track_info.artist.username}
                                            className="w-6 h-6 rounded-full"
                                        />
                                        {data.track_info.artist.username}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1"><Play size={14} /> {data.track_info.stats.plays} Plays</span>
                                    <span className="flex items-center gap-1">❤️ {data.track_info.stats.likes} Likes</span>
                                    <span className="flex items-center gap-1">🔄 {data.track_info.stats.reposts} Reposts</span>
                                </div>

                                <div className="pt-4 space-y-2">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Link Tải Xuống:</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {displayLinks.map((link, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => triggerDownload(link.url)}
                                                className="w-full py-2 px-4 bg-orange-100 hover:bg-orange-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-orange-700 dark:text-white rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-orange-200 dark:border-gray-500"
                                            >
                                                <Download size={16} />
                                                {link.format === 'progressive' ? 'Download MP3' : link.quality || 'Download'}
                                            </button>
                                        ))}
                                        {displayLinks.length === 0 && (
                                            <p className="text-sm text-red-500">Video này không cho phép tải xuống hoặc bản quyền.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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

export default SoundCloudDownload;
