import React, { useState } from 'react';
import { Loader2, Download, Music, Play, AlertCircle, Headphones } from 'lucide-react';
import { Language } from '../utils/translations';

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

interface SoundCloudDownloadProps {
    language: Language;
}

const SoundCloudDownload: React.FC<SoundCloudDownloadProps> = ({ language }) => {
    const isVi = language === 'vi';
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<SoundCloudResponse | null>(null);

    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const handleGetLink = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setError(null);
        setData(null);
        setIsPlaying(false); // Reset player

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
                setError(result.message || (isVi ? 'Không thể lấy thông tin bài hát.' : 'Unable to fetch song information.'));
            }
        } catch (err) {
            setError(isVi ? 'Lỗi kết nối server.' : 'Server connection error.');
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
        return data.download_links.filter(l => l.quality === 'High Quality' || l.format.includes('progressive') || l.format === 'mp3');
    };

    const filteredLinks = getDownloadableLinks();
    const displayLinks = filteredLinks.length > 0 ? filteredLinks : data?.download_links || [];

    // Get playable stream (prefer progressive mp3)
    const getStreamUrl = () => {
        if (!displayLinks.length) return null;
        const progressive = displayLinks.find(l => l.format === 'progressive');
        return progressive ? progressive.url : displayLinks[0].url;
    };

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
            {/* Header */}
            <div className="text-center mb-8 space-y-2">
                <h1 className="text-xl md:text-4xl font-bold text-[#334155] dark:text-gray-100 flex items-center justify-center gap-2 whitespace-nowrap">
                    <img src="/icon/soundcloud.png" alt="SoundCloud" className="h-6 md:h-9 w-auto object-contain" />
                    <span>SoundCloud Downloader</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {isVi ? 'Tải nhạc SoundCloud chất lượng cao miễn phí.' : 'Download high-quality SoundCloud music for free.'}
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white dark:bg-[#1f2747]/95 rounded-xl shadow-[0_8px_22px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_26px_rgba(2,6,23,0.30)] border border-gray-200 dark:border-indigo-900/60 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={isVi ? 'Dán link bài hát SoundCloud tại đây...' : 'Paste SoundCloud song URL here...'}
                        className="flex-1 w-full px-4 py-3 bg-gray-50 dark:bg-[#2b3458] border border-gray-300 dark:border-indigo-900/70 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleGetLink()}
                    />
                    <button
                        onClick={handleGetLink}
                        disabled={loading || !url.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Download />}
                        {isVi ? 'Lấy link' : 'Get link'}
                    </button>
                </div>

                {/* Result Section */}
                {data && data.track_info && (
                    <div className="animate-fadeIn mt-8 p-4 bg-gray-50 dark:bg-[#2b3458]/55 rounded-lg border border-gray-200 dark:border-indigo-900/60">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Artwork & Player Trigger */}
                            <div
                                className="w-full md:w-1/3 aspect-square rounded-lg overflow-hidden shadow-md relative group cursor-pointer"
                                onClick={togglePlay}
                            >
                                <img
                                    src={data.track_info.artwork_url || data.track_info.artist.avatar_url}
                                    alt={data.track_info.title}
                                    className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : 'group-hover:scale-105'}`}
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                    <div className={`bg-orange-600 text-white p-4 rounded-full transform transition-all duration-300 shadow-lg ${isPlaying ? 'scale-100 opacity-100' : 'scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'}`}>
                                        {isPlaying ? (
                                            <div className="flex gap-1 h-6 items-center justify-center px-1">
                                                <div className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: '0s' }}></div>
                                                <div className="w-1 h-6 bg-white animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                        ) : (
                                            <Play size={32} className="ml-1" />
                                        )}
                                    </div>
                                </div>

                                {/* Hidden Audio Element */}
                                <audio
                                    ref={audioRef}
                                    src={getStreamUrl() || ''}
                                    onEnded={() => setIsPlaying(false)}
                                    onError={() => setIsPlaying(false)}
                                />
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
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{isVi ? 'Link tải xuống:' : 'Download links:'}</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {displayLinks.map((link, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => triggerDownload(link.url)}
                                                className="w-full py-2 px-4 bg-orange-100 hover:bg-orange-200 dark:bg-[#2b3458] dark:hover:bg-[#33416b] text-orange-700 dark:text-white rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-orange-200 dark:border-indigo-900/70"
                                            >
                                                <Download size={16} />
                                                {link.format === 'progressive' ? (isVi ? 'Tải MP3' : 'Download MP3') : link.quality || (isVi ? 'Tải xuống' : 'Download')}
                                            </button>
                                        ))}
                                        {displayLinks.length === 0 && (
                                            <p className="text-sm text-red-500">{isVi ? 'Video này không cho phép tải xuống hoặc bị giới hạn bản quyền.' : 'This content is not downloadable or is copyright-restricted.'}</p>
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

