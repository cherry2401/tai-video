import React, { useMemo, useRef, useState, useEffect } from 'react';
import { AlertCircle, Check, FileText, Info, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { Language } from '../utils/translations';
import { activateSessionV2, pollActivationV2, verifyCdkV2, V2VerifyData } from '../services/cdkV2Api';

type V2Stage = 'verify' | 'session' | 'confirm' | 'polling' | 'success';

interface SessionAccountInfo {
  email: string;
  currentPlan: string;
  targetPackage: string;
  duration: string;
  hasPaidPlan: boolean;
}

interface ChatGptCdkV2UtilityProps {
  language: Language;
}

const parseDurationFromTerm = (term: string): string => {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return '1m';
  if (normalized.includes('7d')) return '7d';
  if (normalized.includes('30d')) return '1m';
  if (normalized.includes('90d')) return '3m';
  if (normalized.includes('180d')) return '6m';
  if (normalized.includes('365d')) return '12m';
  return normalized;
};

const normalizePlanLabel = (value?: string): string => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'Free';
  if (normalized === 'free') return 'Free';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const hasPaidPlan = (plan?: string): boolean => normalizePlanLabel(plan).toLowerCase() !== 'free';

const normalizeCdkInput = (value: string): string => value.trim().toUpperCase();

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

const stepLabelMap: Record<Exclude<V2Stage, 'success'>, number> = {
  verify: 1,
  session: 2,
  confirm: 3,
  polling: 4,
};

const ChatGptCdkV2Utility: React.FC<ChatGptCdkV2UtilityProps> = ({ language }) => {
  const isVi = language === 'vi';
  const pollingStoppedRef = useRef(false);

  const [stage, setStage] = useState<V2Stage>('verify');
  const [cdkKey, setCdkKey] = useState('');
  const [sessionInput, setSessionInput] = useState('');

  const [verifiedKey, setVerifiedKey] = useState<V2VerifyData | null>(null);
  const [accountInfo, setAccountInfo] = useState<SessionAccountInfo | null>(null);

  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingActivate, setLoadingActivate] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const activeStep = useMemo(() => (stage === 'success' ? 4 : stepLabelMap[stage]), [stage]);

  useEffect(() => {
    pollingStoppedRef.current = false;
    return () => {
      pollingStoppedRef.current = true;
    };
  }, []);

  const resetState = () => {
    setStage('verify');
    setCdkKey('');
    setSessionInput('');
    setVerifiedKey(null);
    setAccountInfo(null);
    setConfirmOverwrite(false);
    setPollAttempt(0);
    setStatusMessage(null);
    setErrorMessage(null);
    setLoadingVerify(false);
    setLoadingSession(false);
    setLoadingActivate(false);
    setIsPolling(false);
  };

  const handleVerify = async () => {
    const normalized = normalizeCdkInput(cdkKey);
    if (!normalized || normalized.length < 16) {
      setErrorMessage(isVi ? 'Mã CDK không hợp lệ. Vui lòng kiểm tra lại.' : 'Invalid CDK key. Please check again.');
      return;
    }

    setLoadingVerify(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const payload = await verifyCdkV2(normalized, language);
      if (!payload.ok || !payload.data) {
        throw new Error(payload.message || (isVi ? 'Không thể xác minh CDK.' : 'Unable to verify CDK.'));
      }

      setCdkKey(payload.data.code || normalized);
      setVerifiedKey(payload.data);
      setStage('session');
    } catch (error) {
      setErrorMessage((error as Error).message || (isVi ? 'Không thể xác minh CDK.' : 'Unable to verify CDK.'));
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleParseSession = async () => {
    const raw = sessionInput.trim();
    if (!raw) {
      setErrorMessage(isVi ? 'Vui lòng dán Access Token (JSON đầy đủ).' : 'Please paste the full Access Token JSON.');
      return;
    }

    if (!verifiedKey) {
      setErrorMessage(isVi ? 'Vui lòng xác minh CDK trước.' : 'Please verify CDK first.');
      return;
    }

    setLoadingSession(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const parsed = JSON.parse(raw) as {
        user?: { email?: string };
        account?: { planType?: string; structure?: string };
        accessToken?: string;
      };

      if (!parsed.accessToken) {
        throw new Error(isVi ? 'Session JSON thiếu accessToken.' : 'Session JSON is missing accessToken.');
      }

      if (parsed.account?.structure === 'workspace') {
        throw new Error(isVi ? 'Session Workspace chưa được hỗ trợ cho kích hoạt.' : 'Workspace session is not supported for activation.');
      }

      const extractedEmail = parsed.user?.email || parseEmailFromTokenPayload(parsed) || 'unknown-session@local';
      const currentPlan = normalizePlanLabel(parsed.account?.planType || 'free');

      setAccountInfo({
        email: extractedEmail,
        currentPlan,
        targetPackage: `${normalizePlanLabel(verifiedKey.plan)} ${verifiedKey.term}`,
        duration: parseDurationFromTerm(verifiedKey.term),
        hasPaidPlan: hasPaidPlan(currentPlan),
      });

      setConfirmOverwrite(false);
      setStage('confirm');
    } catch (error) {
      setErrorMessage((error as Error).message || (isVi ? 'Không thể đọc Session JSON.' : 'Unable to parse Session JSON.'));
    } finally {
      setLoadingSession(false);
    }
  };

  const runPolling = async (cdk: string) => {
    const maxAttempts = 48;
    setIsPolling(true);
    setPollAttempt(0);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (pollingStoppedRef.current) return;
      setPollAttempt(attempt);

      try {
        const poll = await pollActivationV2(cdk, language);

        if (poll.state === 'success') {
          setStatusMessage(poll.message || (isVi ? 'Kích hoạt thành công.' : 'Activation succeeded.'));
          setStage('success');
          setIsPolling(false);
          return;
        }

        if (poll.state === 'error') {
          setStatusMessage(null);
          setErrorMessage(poll.message || (isVi ? 'Kích hoạt thất bại.' : 'Activation failed.'));
          setIsPolling(false);
          setStage('confirm');
          return;
        }

        setStatusMessage(poll.message || (isVi ? `Đang xử lý... Lần kiểm tra ${attempt}/${maxAttempts}` : `Processing... Poll ${attempt}/${maxAttempts}`));
      } catch (error) {
        setStatusMessage(null);
        setErrorMessage((error as Error).message || (isVi ? 'Không thể kiểm tra trạng thái kích hoạt.' : 'Unable to poll activation status.'));
        setIsPolling(false);
        setStage('confirm');
        return;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    setStatusMessage(null);
    setErrorMessage(isVi ? 'Hết thời gian chờ kích hoạt. Vui lòng thử lại.' : 'Activation timed out. Please try again.');
    setIsPolling(false);
    setStage('confirm');
  };

  const handleActivate = async () => {
    if (!verifiedKey || !accountInfo) {
      setErrorMessage(isVi ? 'Thiếu dữ liệu để kích hoạt.' : 'Missing activation data.');
      return;
    }

    if (accountInfo.hasPaidPlan && !confirmOverwrite) {
      setErrorMessage(isVi ? 'Vui lòng xác nhận ghi đè gói hiện tại trước khi kích hoạt.' : 'Please confirm overwriting current plan before activation.');
      return;
    }

    const raw = sessionInput.trim();
    if (!raw) {
      setErrorMessage(isVi ? 'Thiếu Session JSON để kích hoạt.' : 'Missing Session JSON for activation.');
      return;
    }

    setLoadingActivate(true);
    setErrorMessage(null);
    setStatusMessage(isVi ? 'Yêu cầu kích hoạt đã được chấp nhận. Đang chờ kết quả...' : 'Activation request accepted. Waiting for result...');

    try {
      const activated = await activateSessionV2(verifiedKey.code, raw, accountInfo.hasPaidPlan ? confirmOverwrite : true, language);
      if (!activated.ok) {
        throw new Error(activated.message || (isVi ? 'Không thể bắt đầu kích hoạt.' : 'Unable to start activation.'));
      }

      setStage('polling');
      await runPolling(verifiedKey.code);
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
          <span>ChatGPT CDK V2</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
          {isVi ? 'Luồng kích hoạt nâng cấp theo API mới' : 'Upgraded activation flow with new API'}
        </p>
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
                      <p className="text-base md:text-lg leading-[1.2] font-bold text-gray-900 dark:text-gray-100">{isVi ? 'Xác minh CDK' : 'Verify CDK'}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm leading-relaxed">
                        {isVi ? 'Kiểm tra mã kích hoạt còn khả dụng trước khi tiếp tục.' : 'Validate activation code availability before continuing.'}
                      </p>
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
                      <p className="text-base md:text-lg leading-[1.2] font-bold text-gray-900 dark:text-gray-100">{isVi ? 'Dán AuthSession' : 'Paste AuthSession'}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm leading-relaxed">
                        {isVi ? 'Dán JSON từ chatgpt.com/api/auth/session để xác định tài khoản mục tiêu.' : 'Paste JSON from chatgpt.com/api/auth/session to identify target account.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-900/10 p-3 md:p-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-amber-500/60 flex items-center justify-center text-amber-500 shrink-0">
                      <Zap size={15} />
                    </div>
                    <div>
                      <p className="text-emerald-500 text-sm font-semibold">{isVi ? 'Bước 3-4' : 'Step 3-4'}</p>
                      <p className="text-base md:text-lg leading-[1.2] font-bold text-gray-900 dark:text-gray-100">{isVi ? 'Xác nhận & theo dõi kết quả' : 'Confirm & track activation'}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm leading-relaxed">
                        {isVi ? 'Xác nhận ghi đè nếu có gói trả phí, sau đó hệ thống polling tự động đến khi hoàn tất.' : 'Confirm overwrite when needed, then automatic polling until completion.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 rounded-3xl border border-gray-200 dark:border-indigo-900/60 bg-white dark:bg-[#1f2747]/95 p-3 md:p-4">
              <h2 className="text-xl md:text-2xl leading-tight font-bold text-gray-900 dark:text-gray-100 mb-3">{isVi ? 'Khu vực kích hoạt V2' : 'V2 activation area'}</h2>

              <div className="hidden md:grid grid-cols-4 items-center gap-3 text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${activeStep >= 1 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}>{activeStep > 1 ? <Check size={14} /> : 1}</div>
                  <span className="leading-tight">{isVi ? 'CDK' : 'CDK'}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${activeStep >= 2 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}>{activeStep > 2 ? <Check size={14} /> : 2}</div>
                  <span className="leading-tight">{isVi ? 'Session' : 'Session'}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${activeStep >= 3 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}>{activeStep > 3 ? <Check size={14} /> : 3}</div>
                  <span className="leading-tight">{isVi ? 'Xác nhận' : 'Confirm'}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0 justify-end">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${activeStep >= 4 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-gray-300 text-gray-500'}`}>4</div>
                  <span className="leading-tight">{isVi ? 'Hoàn tất' : 'Finish'}</span>
                </div>
              </div>

              {stage === 'verify' && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="block text-gray-700 dark:text-gray-300 text-xs md:text-sm font-semibold mb-1.5">CDK Key</span>
                    <input
                      value={cdkKey}
                      onChange={(event) => setCdkKey(event.target.value)}
                      placeholder="703A8827451840EBA99222816B2137A0"
                      className="w-full rounded-2xl border border-emerald-200 dark:border-emerald-700 px-4 py-2.5 text-xs md:text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#2b3458] outline-none"
                    />
                  </label>

                  <button
                    onClick={handleVerify}
                    disabled={loadingVerify}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs md:text-sm hover:brightness-110 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loadingVerify ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isVi ? 'Bắt đầu xác minh' : 'Start verification'}
                  </button>
                </div>
              )}

              {stage === 'session' && (
                <div className="space-y-3">
                  {verifiedKey && (
                    <div className="rounded-2xl border border-emerald-100 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-900/10 px-4 py-3 flex items-center justify-between gap-4">
                      <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{isVi ? 'Gói' : 'Package'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs md:text-sm text-right">{normalizePlanLabel(verifiedKey.plan)} {verifiedKey.term}</span>
                    </div>
                  )}

                  <label className="block">
                    <span className="block text-gray-700 dark:text-gray-300 text-xs md:text-sm font-semibold mb-1.5">{isVi ? 'Access Token (JSON đầy đủ)' : 'Access Token (full JSON)'}</span>
                    <textarea
                      rows={7}
                      value={sessionInput}
                      onChange={(event) => setSessionInput(event.target.value)}
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
                      onClick={handleParseSession}
                      disabled={loadingSession}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs md:text-sm font-bold hover:brightness-110 disabled:opacity-70 flex items-center gap-2"
                    >
                      {loadingSession ? <Loader2 size={16} className="animate-spin" /> : null}
                      {isVi ? 'Xác nhận session' : 'Confirm session'}
                    </button>
                  </div>
                </div>
              )}

              {stage === 'confirm' && accountInfo && (
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

                  {accountInfo.hasPaidPlan ? (
                    <>
                      <div className="rounded-2xl border border-amber-200 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/20 p-3 flex items-start gap-2 text-xs md:text-sm text-amber-900 dark:text-amber-100">
                        <Info size={16} className="text-amber-500 shrink-0" />
                        {isVi
                          ? `Session này đang là tài khoản ${accountInfo.currentPlan}. Kích hoạt sẽ ghi đè gói hiện tại.`
                          : `This session is currently on ${accountInfo.currentPlan}. Activation will overwrite the current plan.`}
                      </div>

                      <label className="rounded-2xl border border-amber-200 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/20 p-3 flex items-start gap-2 text-xs md:text-sm text-amber-900 dark:text-amber-100 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={confirmOverwrite}
                          onChange={(event) => setConfirmOverwrite(event.target.checked)}
                        />
                        <span>
                          {isVi
                            ? 'Tôi hiểu rằng kích hoạt lại có thể đặt lại chu kỳ thanh toán của gói hiện tại.'
                            : 'I understand reactivation may reset billing cycle of the current paid plan.'}
                        </span>
                      </label>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-blue-100 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10 p-3 flex items-center gap-2 text-xs md:text-sm text-gray-800 dark:text-gray-100">
                      <Info size={16} className="text-blue-500 shrink-0" />
                      {isVi ? 'Session này đang là tài khoản Free và sẵn sàng kích hoạt.' : 'This session is currently a Free account and ready for activation.'}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => setStage('session')}
                      disabled={loadingActivate}
                      className="px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-indigo-900/70 text-xs md:text-sm text-gray-700 dark:text-gray-200 font-bold disabled:opacity-60"
                    >
                      {isVi ? 'Quay lại' : 'Back'}
                    </button>
                    <button
                      onClick={handleActivate}
                      disabled={loadingActivate || (accountInfo.hasPaidPlan && !confirmOverwrite)}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs md:text-sm font-bold hover:brightness-110 disabled:opacity-70 flex items-center gap-2"
                    >
                      {loadingActivate ? <Loader2 size={16} className="animate-spin" /> : null}
                      {isVi ? 'Xác nhận nạp' : 'Confirm activation'}
                    </button>
                  </div>
                </div>
              )}

              {stage === 'polling' && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-blue-100 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10 p-3 flex items-center gap-2 text-xs md:text-sm text-gray-800 dark:text-gray-100">
                    {isPolling ? <Loader2 size={16} className="animate-spin text-blue-500 shrink-0" /> : <Info size={16} className="text-blue-500 shrink-0" />}
                    {statusMessage || (isVi ? 'Đang theo dõi tiến trình kích hoạt...' : 'Polling activation progress...')}
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-indigo-900/60 bg-gray-50/30 dark:bg-[#2b3458]/55 p-3 text-xs md:text-sm text-gray-700 dark:text-gray-200">
                    {isVi ? `Lần kiểm tra: ${pollAttempt}` : `Poll attempt: ${pollAttempt}`}
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 flex items-center gap-2 text-xs md:text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {statusMessage && stage !== 'polling' && (
                <div className="mt-4 rounded-2xl border border-blue-100 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10 p-3 flex items-center gap-2 text-xs md:text-sm text-gray-800 dark:text-gray-100">
                  <Info size={16} className="text-blue-500 shrink-0" />
                  {statusMessage}
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
            <p className="text-base text-emerald-500 font-semibold mb-5">{isVi ? 'Kích hoạt V2 thành công' : 'V2 activation successful'}</p>

            <div className="rounded-2xl border border-gray-200 dark:border-indigo-900/60 bg-gray-50/30 dark:bg-[#2b3458]/55 p-4 text-left space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">{isVi ? 'Gói' : 'Package'}</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base">{accountInfo?.targetPackage || '-'}</span>
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

            <button
              onClick={resetState}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm md:text-base hover:brightness-110"
            >
              {isVi ? 'Kích hoạt mã khác' : 'Activate another code'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatGptCdkV2Utility;
