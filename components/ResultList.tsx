import React from 'react';
import { DownloadResult } from '../types';
import { Download, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { Translation } from '../utils/translations';

interface ResultListProps {
  results: DownloadResult[];
  t: Translation;
}

const ResultList: React.FC<ResultListProps> = ({ results, t }) => {
  if (results.length === 0) return null;

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
          </div>

          {/* Content Section */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 mb-1 transition-colors">{result.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all line-clamp-1 mb-2 transition-colors">{result.originalUrl}</p>
              
              <div className="flex items-center gap-2 text-sm">
                {result.status === 'success' ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 transition-colors">
                    <CheckCircle size={14} /> {t.ready}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 dark:text-red-400 transition-colors">
                    <AlertCircle size={14} /> {t.error}
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
              <button 
                className="flex items-center gap-1 text-xs text-white bg-blue-500 px-3 py-1.5 rounded hover:bg-blue-600 transition-colors"
                onClick={() => alert(`Đang tải xuống video: ${result.title}`)}
              >
                <Download size={12} /> {t.downloadVideo}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultList;