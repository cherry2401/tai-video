import React, { useState } from 'react';
import { Loader2, Sparkles, Copy, Check, AlertCircle, Unlock, Lock } from 'lucide-react';
import { Translation } from '../utils/translations';
import Markdown from 'react-markdown';

interface AiWriterProps {
    t: Translation;
    language: string;
}

interface AiResponse {
    success: boolean;
    content?: string;
    message?: string;
    bypassed?: boolean;
}

const AiWriter: React.FC<AiWriterProps> = ({ t, language }) => {
    const [prompt, setPrompt] = useState('');
    const [adminKey, setAdminKey] = useState('');
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isBypassed, setIsBypassed] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setIsBypassed(false);

        try {
            const response = await fetch('/api/ai-writer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    admin_key: adminKey.trim(),
                    lang: language // Pass current UI language preference to AI context
                }),
            });

            const data = (await response.json()) as AiResponse;

            if (data.success && data.content) {
                setResult(data.content);
                if (data.bypassed) {
                    setIsBypassed(true);
                }
            } else {
                setError(data.message || t.aiWriter.error);
            }
        } catch (err) {
            setError(t.aiWriter.error);
            console.error(err);
            // Simulating a successful response for UI testing if API is not yet ready (remove in prod)
            // setResult("This is a simulated response because the backend API might not be effectively connected yet. \n\n**Markdown Example:**\n* List item 1\n* List item 2");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
            {/* Header */}
            <div className="text-center mb-10 space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-[#334155] dark:text-gray-100 transition-colors flex items-center justify-center gap-3">
                    <Sparkles className="text-yellow-500" size={32} />
                    {t.aiWriter.title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
                    {t.aiWriter.subtitle}
                </p>
            </div>

            {/* Main Input Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-colors">

                {/* Prompt Input */}
                <div className="mb-6">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t.aiWriter.promptPlaceholder}
                        className="w-full h-32 md:h-40 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none transition-colors dark:text-white resize-none text-base md:text-lg"
                    />
                </div>

                {/* Admin Key Toggle */}
                <div className="mb-6">
                    <button
                        onClick={() => setIsAdminOpen(!isAdminOpen)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                    >
                        {isAdminOpen ? <Unlock size={12} /> : <Lock size={12} />}
                        {isAdminOpen ? 'Close Admin' : 'Admin Access'}
                    </button>

                    {isAdminOpen && (
                        <div className="mt-2 animate-fadeIn">
                            <input
                                type="password"
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                                placeholder={t.aiWriter.adminKeyPlaceholder}
                                className="w-full md:w-1/2 p-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-yellow-500 focus:outline-none dark:text-white"
                            />
                        </div>
                    )}
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {loading ? t.aiWriter.generating : t.aiWriter.generateButton}
                </button>

                {/* Error Message */}
                {error && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-3 animate-fadeIn">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Result Section */}
            {result && (
                <div className="mt-8 animate-slideUp">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Sparkles size={20} className="text-yellow-500" />
                            {t.aiWriter.resultTitle}
                        </h3>
                        <div className="flex gap-2">
                            {isBypassed && (
                                <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Unlock size={10} /> Admin Mode
                                </span>
                            )}
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? t.aiWriter.copied : t.aiWriter.copy}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 min-h-[200px]">
                        <div className="prose dark:prose-invert max-w-none">
                            <Markdown>{result}</Markdown>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiWriter;
