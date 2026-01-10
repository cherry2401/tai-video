import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Translation } from '../utils/translations';

interface DownloadFormProps {
  onDownload: (links: string[]) => void;
  isLoading: boolean;
  t: Translation;
}

const DownloadForm: React.FC<DownloadFormProps> = ({ onDownload, isLoading, t }) => {
  const [link, setLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.trim()) return;

    onDownload([link]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 animate-fadeIn">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center w-full bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-transparent focus-within:border-green-500 transition-all p-1.5 md:p-2">
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 px-4 md:px-6 py-2 text-gray-700 dark:text-gray-200 placeholder-gray-400 text-base md:text-lg min-w-0"
          />
          <button
            type="submit"
            disabled={isLoading || !link.trim()}
            className="bg-[#004d40] hover:bg-[#003d33] text-white font-bold py-2 md:py-3 px-6 md:px-8 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center gap-2 whitespace-nowrap shadow-md"
          >
            {isLoading && <Loader2 className="animate-spin w-5 h-5" />}
            <span>{t.download}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DownloadForm;