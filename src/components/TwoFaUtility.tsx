import React, { useEffect, useState } from 'react';
import { AlertCircle, Copy, ShieldCheck } from 'lucide-react';

const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

const normalizeSecret = (value: string): string => {
  return value.toUpperCase().replace(/[\s-]/g, '');
};

const base32ToBytes = (base32: string): Uint8Array => {
  const cleaned = base32.replace(/=+$/g, '');
  if (!cleaned || !/^[A-Z2-7]+$/.test(cleaned)) {
    throw new Error('Secret khong hop le. Chi cho phep A-Z, 2-7.');
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const charCode = char.charCodeAt(0);
    let idx = -1;

    if (charCode >= 65 && charCode <= 90) idx = charCode - 65;
    if (charCode >= 50 && charCode <= 55) idx = charCode - 24;

    if (idx < 0 || idx > 31) {
      throw new Error('Secret Base32 khong hop le.');
    }

    value = (value << 5) | idx;
    bits += 5;

    while (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
};

const generateTotp = async (secret: string, unixSeconds: number): Promise<string> => {
  const keyBytes = base32ToBytes(secret);
  const counter = Math.floor(unixSeconds / TOTP_PERIOD_SECONDS);
  const counterBytes = new Uint8Array(8);

  let temp = counter;
  for (let i = 7; i >= 0; i -= 1) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const hmac = await crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
  const hash = new Uint8Array(hmac);
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
};

const TwoFaUtility: React.FC = () => {
  const [secretInput, setSecretInput] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const secret = normalizeSecret(secretInput);

    if (!secret) {
      setOtp('');
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    const run = async () => {
      try {
        const currentOtp = await generateTotp(secret, Math.floor(nowMs / 1000));
        if (cancelled) return;
        setOtp(currentOtp);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setOtp('');
        setError(err instanceof Error ? err.message : 'Secret khong hop le.');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [secretInput, nowMs]);

  const secondsPassed = Math.floor(nowMs / 1000) % TOTP_PERIOD_SECONDS;
  const secondsLeft = TOTP_PERIOD_SECONDS - secondsPassed;
  const progressPercent = (secondsPassed / TOTP_PERIOD_SECONDS) * 100;

  const copyOtp = async () => {
    if (!otp) return;
    await navigator.clipboard.writeText(otp);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
      <div className="text-center mb-7 space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-wide text-gray-900 dark:text-gray-100">2FA</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Nhap secret va lay ma OTP 6 so tu dong cap nhat moi 30 giay.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 md:p-6 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secret Key</label>
          <input
            type="text"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="VD: JBSWY3DPEHPK3PXP"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/30 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">OTP Code</p>
              <p className="mt-1 font-mono text-3xl md:text-4xl tracking-[0.18em] text-gray-900 dark:text-gray-100">{otp || '------'}</p>
            </div>
            <button
              onClick={copyOtp}
              disabled={!otp}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Copy size={14} />
              {copied ? 'copied' : 'copy'}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} />
                TOTP (SHA1/6 digits)
              </span>
              <span>{secondsLeft}s</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-1000 ease-linear" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default TwoFaUtility;
