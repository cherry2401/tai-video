import React, { useState } from 'react';
import { Link2, Copy, Check, ArrowRight, Download, QrCode } from 'lucide-react';
import { Translation } from '../utils/translations';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

interface ShortenFormProps {
  t: Translation;
}

const ShortenForm: React.FC<ShortenFormProps> = ({ t }) => {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShorten = async () => {
    if (!longUrl.trim()) return;
    setLoading(true);

    try {
      // Call Cloudflare Proxy -> n8n
      const response = await fetch('/api/shortener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: longUrl })
      });

      const data = await response.json();

      if (data.shortCode) {
        // 3. Create the working link pointing to new Fast Redirect function
        const currentDomain = window.location.origin;
        // Clean URL: domain.com/code
        const generatedUrl = `${currentDomain}/${data.shortCode}`;
        setShortUrl(generatedUrl);
      } else {
        alert('Không thể rút gọn link. Vui lòng thử lại.');
      }

    } catch (e) {
      console.error("Shorten error", e);
      alert("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadQR = (type: 'png' | 'svg') => {
    if (type === 'png') {
      const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
      if (canvas) {
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = "qr-code.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } else {
      const svg = document.getElementById('qr-code-svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = "qr-code.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-[#334155] dark:text-gray-100 transition-colors">
          {t.shorten.title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base transition-colors">
          {t.shorten.note} (Dữ liệu lưu trên trình duyệt này)
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Link2 size={20} />
            </div>
            <input
              type="text"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder={t.shorten.placeholder}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors dark:text-white"
            />
          </div>
          <button
            onClick={handleShorten}
            disabled={loading || !longUrl.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
          >
            {loading ? 'Processing...' : (
              <>
                {t.shorten.button} <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {shortUrl && (
          <div className="mt-6 animate-fadeIn space-y-6">
            {/* Link Result */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.shorten.resultLabel}
              </label>
              <div className="flex items-center gap-3">
                <input
                  readOnly
                  value={shortUrl}
                  className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-green-700 dark:text-green-400 font-mono text-sm"
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-all ${isCopied
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  {isCopied ? t.shorten.copied : t.shorten.copy}
                </button>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col md:flex-row items-center gap-8">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <div className="hidden">
                  <QRCodeCanvas id="qr-code-canvas" value={shortUrl} size={200} level={"H"} includeMargin={true} />
                </div>
                <QRCodeSVG id="qr-code-svg" value={shortUrl} size={160} level={"H"} includeMargin={true} />
              </div>

              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center justify-center md:justify-start gap-2">
                    <QrCode size={20} className="text-blue-500" />
                    QR Code
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Quét mã để truy cập nhanh link rút gọn trên điện thoại.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <button
                    onClick={() => downloadQR('png')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <Download size={16} /> Download PNG
                  </button>
                  <button
                    onClick={() => downloadQR('svg')}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-sm font-medium transition-colors"
                  >
                    <Download size={16} /> Download SVG
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortenForm;