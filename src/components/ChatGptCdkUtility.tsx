import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, FileText, Info, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { Language } from '../utils/translations';

type CdkStage = 'verify' | 'token' | 'activate' | 'success';

interface VerifyResponse {
  cdk: string;
  used: boolean;
  usedBy?: string | null;
  message?: string | null;
  appName: string;
  packageName: string;
  valid: boolean;
}

interface ParsedAccountInfo {
  email: string;
  currentPlan: string;
  targetPackage: string;
  duration: string;
}

interface ParseResponse {
  verified: boolean;
  email: string;
  currentPlan: string;
  hasSubscription: boolean;
}

interface ActivateResponse {
  success: boolean;
  taskId: string;
  cdk: string;
  status: string;
  message: string;
  progress: number;
}

const parseDurationFromPackage = (packageName: string): string => {
  const normalized = packageName.toLowerCase();
  if (normalized.includes('1m')) return '1m';
  if (normalized.includes('3m')) return '3m';
  if (normalized.includes('6m')) return '6m';
  if (normalized.includes('12m')) return '12m';
  return '1m';
};

const getApiCandidates = (path: string): string[] => {
  const base = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const candidates: string[] = [];

  if (base) {
    candidates.push(`${base}${normalizedPath}`);
    if (normalizedPath.startsWith('/api/')) {
      candidates.push(`${base}/functions${normalizedPath}`);
    }
  }

  candidates.push(normalizedPath);
  if (normalizedPath.startsWith('/api/')) {
    candidates.push(`/functions${normalizedPath}`);
  }

  return [...new Set(candidates)];
};

const fetchJson = async <T,>(url: string, body: Record<string, string>, language: Language): Promise<T> => {
  const candidates = getApiCandidates(url);
  let lastError = language === 'vi' ? 'Yêu cầu thất bại. Vui lòng thử lại.' : 'Request failed. Please try again.';

  for (let i = 0; i < candidates.length; i += 1) {
    const target = candidates[i];
    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let payload: (T & { message?: string; error?: string }) | null = null;

    if (rawText) {
      try {
        payload = JSON.parse(rawText) as T & { message?: string; error?: string };
      } catch {
        payload = null;
      }
    }

    if (response.ok && payload) {
      return payload;
    }

    const detail = payload?.message || payload?.error || rawText?.trim();
    lastError = detail || (language === 'vi'
      ? `Yêu cầu thất bại (HTTP ${response.status}). Vui lòng thử lại.`
      : `Request failed (HTTP ${response.status}). Please try again.`);

    const isLastCandidate = i === candidates.length - 1;
    if (response.status !== 404 || isLastCandidate) {
      break;
    }
  }

  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (isLocalhost && lastError.includes('HTTP 404')) {
    throw new Error(language === 'vi'
      ? 'Local dev chưa có route backend CDK. Hãy chạy backend functions hoặc cấu hình VITE_API_BASE_URL.'
      : 'CDK backend route is missing in local dev. Run backend functions or configure VITE_API_BASE_URL.');
  }

  throw new Error(lastError);
};

const normalizePlanLabel = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'Free';
  if (normalized === 'free') return 'Free';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const stepLabelMap: Record<Exclude<CdkStage, 'success'>, number> = {
  verify: 1,
  token: 2,
  activate: 3,
};

const parseEmailFromTokenPayload = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match ? match[0] : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = parseEmailFromTokenPayload(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === 'object') {
    const entries = Object.values(value as Record<string, unknown>);
    for (const entry of entries) {
      const found = parseEmailFromTokenPayload(entry);
      if (found) return found;
    }
  }

  return null;
};

const normalizeCdkInput = (value: string): string => value.trim().toUpperCase();

interface ChatGptCdkUtilityProps {
  language: Language;
}

const ChatGptCdkUtility: React.FC<ChatGptCdkUtilityProps> = ({ language }) => {
  const isVi = language === 'vi';
  const [stage, setStage] = useState<CdkStage>('verify');
  const [cdkKey, setCdkKey] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [verifiedPackage, setVerifiedPackage] = useState('Plus 1 Month');
  const [verifiedCdk, setVerifiedCdk] = useState('');
  const [accountInfo, setAccountInfo] = useState<ParsedAccountInfo | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingParse, setLoadingParse] = useState(false);
  const [loadingActivate, setLoadingActivate] = useState(false);

  const activeStep = useMemo(() => (stage === 'success' ? 3 : stepLabelMap[stage]), [stage]);

  const resetState = () => {
    setStage('verify');
    setCdkKey('');
    setTokenInput('');
    setVerifiedPackage('Plus 1 Month');
    setVerifiedCdk('');
    setAccountInfo(null);
    setStatusMessage(null);
    setErrorMessage(null);
    setLoadingVerify(false);
    setLoadingParse(false);
    setLoadingActivate(false);
  };

  const verifyCdk = async () => {
    const normalized = normalizeCdkInput(cdkKey);
    if (!normalized || normalized.length < 16) {
      setErrorMessage(isVi ? 'Mã CDK không hợp lệ. Vui lòng kiểm tra lại.' : 'Invalid CDK key. Please check again.');
      return;
    }

    setLoadingVerify(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const payload = await fetchJson<VerifyResponse>('/api/cdk-verify', { cdk: normalized }, language);
      if (payload.used) {
        const usedBy = payload.usedBy?.trim();
        setErrorMessage(usedBy ? (isVi ? `CDK này đã được sử dụng bởi: ${usedBy}` : `This CDK has already been used by: ${usedBy}`) : (isVi ? 'CDK này đã được sử dụng. Vui lòng thử mã khác.' : 'This CDK has already been used. Please try another key.'));
        return;
      }

      setCdkKey(payload.cdk);
      setVerifiedCdk(payload.cdk);
      setVerifiedPackage(payload.packageName);
      setStage('token');
    } catch (error) {
      setErrorMessage((error as Error).message || (isVi ? 'Không thể xác minh CDK.' : 'Unable to verify CDK.'));
    } finally {
      setLoadingVerify(false);
    }
  };

  const parseToken = async () => {
    const raw = tokenInput.trim();
    if (!raw) {
      setErrorMessage(isVi ? 'Vui lòng dán Access Token (JSON đầy đủ).' : 'Please paste the full Access Token JSON.');
      return;
    }

    setLoadingParse(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      let parsedEmail: string | null = null;
      try {
        const parsedJson = JSON.parse(raw) as unknown;
        parsedEmail = parseEmailFromTokenPayload(parsedJson);
      } catch {
        parsedEmail = parseEmailFromTokenPayload(raw);
      }

      const payload = await fetchJson<ParseResponse>('/api/cdk-parse', {
        cdk: verifiedCdk || normalizeCdkInput(cdkKey),
        sessionJson: raw,
      }, language);

      setAccountInfo({
        email: payload.email || parsedEmail || 'unknown-session@local',
        currentPlan: normalizePlanLabel(payload.currentPlan),
        targetPackage: verifiedPackage,
        duration: parseDurationFromPackage(verifiedPackage),
      });

      setStage('activate');
    } catch (error) {
      setErrorMessage((error as Error).message || (isVi ? 'Không thể phân tích Access Token. Vui lòng kiểm tra dữ liệu đầu vào.' : 'Unable to parse Access Token. Please verify input data.'));
    } finally {
      setLoadingParse(false);
    }
  };

  const activateCdk = async () => {
    if (!accountInfo) {
      setErrorMessage(isVi ? 'Chưa có dữ liệu tài khoản để kích hoạt.' : 'No account data to activate.');
      return;
    }

    const raw = tokenInput.trim();
    if (!raw) {
      setErrorMessage(isVi ? 'Thiếu Session JSON để kích hoạt.' : 'Missing Session JSON for activation.');
      return;
    }

    setLoadingActivate(true);
    setErrorMessage(null);
    setStatusMessage(isVi ? 'Yêu cầu kích hoạt đã được chấp nhận. Đang chờ kết quả cuối cùng...' : 'Activation request accepted. Waiting for final result...');

    try {
      const payload = await fetchJson<ActivateResponse>('/api/cdk-activate', {
        cdk: verifiedCdk || normalizeCdkInput(cdkKey),
        sessionJson: raw,
      }, language);

      setStatusMessage(payload.message || null);
      setStage('success');
    } catch (error) {
      setStatusMessage(null);
      setErrorMessage((error as Error).message || (isVi ? 'Kích hoạt thất bại.' : 'Activation failed.'));
    } finally {
      setLoadingActivate(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fadeIn pb-16 px-1 md:px-2">
      <div className="text-center mb-5 space-y-1.5">
        <h1 className="text-2xl md:text-3xl leading-tight font-extrabold tracking-tight text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
          <img src="/chatgot.png" alt="ChatGPT logo" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
          <span>ChatGPT CDK</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{isVi ? 'Kích hoạt tài khoản nhanh chóng và an toàn' : 'Activate your account quickly and securely'}</p>
      </div>

      <div className="bg-white dark:bg-[#1f2747]/95 rounded-3xl shadow-[0_8px_22px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_26px_rgba(2,6,23,0.30)] border border-gray-200 dark:border-indigo-900/60 p-4 md:p-5">
        {stage !== 'success' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start">
            <div className="order-2 lg:order-1 rounded-3xl border border-gray-200 dark:border-indigo-900/60 bg-white dark:bg-[#1f2747]/95 p-3 md:p-4">
              <h2 className="text-xl md:text-2xl leading-tight font-bold text-gray-900 dark:text-gray-100 mb-3">{isVi ? 'Trước khi bắt đầu' : 'Before you start'}</h2>

              <div className="space-y-3">
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-900/10 p-3 md:p-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-emerald-500/60 flex items-center justify-center text-emerald-500 shrink-0">
                      <ShieldCheck size={15} />
                    </div>
                    <div>
                      <p className="text-emerald-500 text-sm font-semibold">{isVi ? 'Bước 1' : 'Step 1'}</p>
                      <p className="text-base md:text-lg leading-[1.2] font-bold text-gray-900 dark:text-gray-100">{isVi ? 'Nhập và xác minh CDK' : 'Enter and verify CDK'}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm leading-relaxed">{isVi ? 'Đảm bảo CDK hợp lệ và đúng gói sản phẩm.' : 'Make sure your CDK is valid and matches the correct package.'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/20 dark:bg-blue-900/10 p-3 md:p-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-blue-500/60 flex items-center justify-center text-blue-500 shrink-0">
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="text-emerald-500 text-sm font-semibold">{isVi ? 'Bước 2' : 'Step 2'}</p>
                      <p className="text-base md:text-lg leading-[1.2] font-bold text-gray-900 dark:text-gray-100">{isVi ? 'Đăng nhập và lấy AuthSession' : 'Sign in and get AuthSession'}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm leading-relaxed">{isVi ? 'Mở ChatGPT, đăng nhập, sau đó mở trang AuthSession và sao chép toàn bộ JSON.' : 'Open ChatGPT, sign in, then open the AuthSession page and copy the full JSON.'}</p>
                      <div className="flex flex-wrap gap-2.5 mt-3">
                        <button
                          type="button"
                          onClick={() => window.open('https://chatgpt.com', '_blank', 'noopener,noreferrer')}
                          className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700 text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                          {isVi ? 'Mở ChatGPT' : 'Open ChatGPT'}
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open('https://chatgpt.com/api/auth/session', '_blank', 'noopener,noreferrer')}
                          className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700 text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                          {isVi ? 'Mở trang AuthSession' : 'Open AuthSession page'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-900/10 p-3 md:p-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-amber-500/60 flex items-center justify-center text-amber-500 shrink-0">
                      <Zap size={15} />
                    </div>
                    <div>
                      <p className="text-emerald-500 text-sm font-semibold">{isVi ? 'Bước 3' : 'Step 3'}</p>
                      <p className="text-base md:text-lg leading-[1.2] font-bold text-gray-900 dark:text-gray-100">{isVi ? 'Sau khi xác thực, bấm Kích hoạt để hoàn tất' : 'After verification, click Activate to finish'}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm leading-relaxed">{isVi ? 'Quá trình kích hoạt có thể mất một lúc, vui lòng chờ.' : 'Activation may take a moment, please wait.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 rounded-3xl border border-gray-200 dark:border-indigo-900/60 bg-white dark:bg-[#1f2747]/95 p-3 md:p-4">
              <h2 className="text-xl md:text-2xl leading-tight font-bold text-gray-900 dark:text-gray-100 mb-3">{isVi ? 'Khu vực kích hoạt' : 'Activation area'}</h2>

              <div className="md:hidden mb-4">
                <div className="space-y-3 text-base font-bold text-gray-900 dark:text-gray-100">
                  <div className="relative flex items-center gap-3 pb-3">
                    <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${activeStep >= 1 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}
                    >
                      {activeStep > 1 ? <Check size={16} /> : 1}
                    </div>
                    <span className="leading-tight">{isVi ? 'Xác minh CDK' : 'Verify CDK'}</span>
                    <div className="absolute left-[19px] top-[40px] h-3 w-px bg-gray-200 dark:bg-indigo-900/60" />
                  </div>
                  <div className="relative flex items-center gap-3 pb-3">
                    <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${activeStep >= 2 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}
                    >
                      {activeStep > 2 ? <Check size={16} /> : 2}
                    </div>
                    <span className="leading-tight">{isVi ? 'Dán Token' : 'Paste token'}</span>
                    <div className="absolute left-[19px] top-[40px] h-3 w-px bg-gray-200 dark:bg-indigo-900/60" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${activeStep >= 3 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}
                    >
                      3
                    </div>
                    <span className="leading-tight">{isVi ? 'Kích hoạt' : 'Activate'}</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:grid grid-cols-3 items-center gap-3 text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${activeStep >= 1 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}
                  >
                    {activeStep > 1 ? <Check size={16} /> : 1}
                  </div>
                  <span className="leading-tight">{isVi ? 'Xác minh CDK' : 'Verify CDK'}</span>
                </div>
                <div className="flex items-center gap-3 min-w-0 justify-center">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${activeStep >= 2 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}
                  >
                    {activeStep > 2 ? <Check size={16} /> : 2}
                  </div>
                  <span className="leading-tight">{isVi ? 'Dán Token' : 'Paste token'}</span>
                </div>
                <div className="flex items-center gap-3 min-w-0 justify-end">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${activeStep >= 3 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}
                  >
                    3
                  </div>
                  <span className="leading-tight">{isVi ? 'Kích hoạt' : 'Activate'}</span>
                </div>
              </div>

              {stage === 'verify' && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="block text-gray-700 dark:text-gray-300 text-xs md:text-sm font-semibold mb-1.5">CDK Key</span>
                    <input
                      value={cdkKey}
                      onChange={(event) => setCdkKey(event.target.value)}
                      placeholder="B90D0E6E-64E7-4992-BA93-060B83B7CC78"
                      className="w-full rounded-2xl border border-emerald-200 dark:border-emerald-700 px-4 py-2.5 text-xs md:text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#2b3458] outline-none"
                    />
                  </label>

                  <button
                    onClick={verifyCdk}
                    disabled={loadingVerify}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs md:text-sm hover:brightness-110 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loadingVerify ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isVi ? 'Xác minh CDK' : 'Verify CDK'}
                  </button>
                </div>
              )}

              {stage === 'token' && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-emerald-100 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-900/10 px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{isVi ? 'Gói' : 'Package'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs md:text-sm text-right">{verifiedPackage}</span>
                  </div>

                  <label className="block">
                    <span className="block text-gray-700 dark:text-gray-300 text-xs md:text-sm font-semibold mb-1.5">{isVi ? 'Access Token (JSON đầy đủ)' : 'Access Token (full JSON)'}</span>
                    <textarea
                      rows={7}
                      value={tokenInput}
                      onChange={(event) => setTokenInput(event.target.value)}
                      placeholder={isVi ? 'Dán toàn bộ JSON AuthSession vào đây...' : 'Paste full AuthSession JSON here...'}
                      className="w-full rounded-2xl border border-gray-300 dark:border-indigo-900/70 p-3.5 text-xs md:text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#2b3458] outline-none resize-y"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => setStage('verify')}
                      className="px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-indigo-900/70 text-xs md:text-sm text-gray-700 dark:text-gray-200 font-bold"
                    >
                      {isVi ? 'Quay lại' : 'Back'}
                    </button>
                    <button
                      onClick={parseToken}
                      disabled={loadingParse}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs md:text-sm font-bold hover:brightness-110 disabled:opacity-70 flex items-center gap-2"
                    >
                      {loadingParse ? <Loader2 size={16} className="animate-spin" /> : null}
                      {isVi ? 'Phân tích tài khoản' : 'Parse account'}
                    </button>
                  </div>
                </div>
              )}

              {stage === 'activate' && accountInfo && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-gray-200 dark:border-indigo-900/60 bg-gray-50/30 dark:bg-[#2b3458]/55 p-4 space-y-3">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{isVi ? 'Mã CDK' : 'CDK key'}</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-xs md:text-sm text-right break-all">{cdkKey}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{isVi ? 'Email tài khoản' : 'Account email'}</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-xs md:text-sm text-right break-all">{accountInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{isVi ? 'Gói hiện tại' : 'Current plan'}</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-xs md:text-sm text-right">{accountInfo.currentPlan}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{isVi ? 'Sản phẩm' : 'Product'}</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-xs md:text-sm text-right">{accountInfo.targetPackage}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10 p-3 flex items-center gap-2 text-xs md:text-sm text-gray-800 dark:text-gray-100">
                    <Info size={16} className="text-blue-500 shrink-0" />
                    {isVi ? 'Session này đang là tài khoản Free và sẵn sàng kích hoạt.' : 'This session is currently a Free account and ready for activation.'}
                  </div>

                  {statusMessage && (
                    <div className="rounded-2xl border border-blue-100 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10 p-3 flex items-center gap-2 text-xs md:text-sm text-gray-800 dark:text-gray-100">
                      <Info size={16} className="text-blue-500 shrink-0" />
                      {statusMessage}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => setStage('token')}
                      disabled={loadingActivate}
                      className="px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-indigo-900/70 text-xs md:text-sm text-gray-700 dark:text-gray-200 font-bold disabled:opacity-60"
                    >
                      {isVi ? 'Quay lại' : 'Back'}
                    </button>
                    <button
                      onClick={activateCdk}
                      disabled={loadingActivate}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs md:text-sm font-bold hover:brightness-110 disabled:opacity-70 flex items-center gap-2"
                    >
                      {loadingActivate ? <Loader2 size={16} className="animate-spin" /> : null}
                      {loadingActivate ? (isVi ? 'Đang kích hoạt...' : 'Activating...') : (isVi ? 'Kích hoạt CDK' : 'Activate CDK')}
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 flex items-center gap-2 text-xs md:text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto rounded-3xl border border-gray-200 dark:border-indigo-900/60 bg-white dark:bg-[#1f2747]/95 p-6 md:p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Check size={38} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-emerald-600 mb-2">{isVi ? 'Thành công' : 'Success'}</h2>
            <p className="text-base text-emerald-500 font-semibold mb-5">{isVi ? 'Kích hoạt thành công' : 'Activation successful'}</p>

            <div className="rounded-2xl border border-gray-200 dark:border-indigo-900/60 bg-gray-50/30 dark:bg-[#2b3458]/55 p-4 text-left space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">{isVi ? 'Gói' : 'Package'}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base">{accountInfo?.targetPackage || 'Plus 1 Month'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">{isVi ? 'Email tài khoản' : 'Account email'}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base">{accountInfo?.email || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">{isVi ? 'Thời hạn' : 'Duration'}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base">{accountInfo?.duration || '1m'}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10 p-3 flex items-center gap-2 text-xs md:text-sm text-gray-800 dark:text-gray-100 text-left mb-4">
              <Info size={16} className="text-blue-500 shrink-0" />
              {isVi
                ? 'Nếu đã kích hoạt thành công nhưng trong ChatGPT vẫn hiện gói Free, hãy bấm Làm mới trạng thái gói hoặc đăng xuất và đăng nhập lại.'
                : 'If activation succeeded but ChatGPT still shows Free, refresh plan status or sign out and sign in again.'}
            </div>

            <button
              onClick={resetState}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm md:text-base hover:brightness-110"
            >
              {isVi ? 'Kích hoạt mã khác' : 'Activate another key'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatGptCdkUtility;

