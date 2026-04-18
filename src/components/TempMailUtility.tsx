import React, { useEffect, useState } from 'react';
import { AlertCircle, Copy, Inbox, Loader2, MailPlus, RefreshCw, Shuffle, Trash2 } from 'lucide-react';
import { Language } from '../utils/translations';

interface TempMailAccount {
  email: string;
  password: string;
  token: string;
  id?: string;
}

interface TempMailMessage {
  id?: string;
  from?: unknown;
  to?: unknown;
  subject?: string;
  intro?: string;
  text?: string;
  html?: string;
  createdAt?: string;
  date?: string;
}

interface TempMailApiResponse {
  email?: string;
  password?: string;
  token?: string;
  id?: string;
  answer?: TempMailMessage[];
  messages?: TempMailMessage[];
  message?: string;
}

interface TempMailMessageDetailResponse {
  id?: string;
  text?: string;
  html?: string | string[];
  intro?: string;
  subject?: string;
  from?: unknown;
  to?: unknown;
  date?: string;
  createdAt?: string;
  message?: string;
}

const AUTO_REFRESH_SECONDS = 10;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeAddressField = (value: unknown): string => {
  if (!value) return 'N/A';
  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => normalizeAddressField(item))
      .filter((item) => item && item !== 'N/A');
    return parts.length ? parts.join(', ') : 'N/A';
  }

  if (typeof value === 'object') {
    const addressObj = value as { address?: unknown; name?: unknown };
    const address = typeof addressObj.address === 'string' ? addressObj.address.trim() : '';
    const name = typeof addressObj.name === 'string' ? addressObj.name.trim() : '';

    if (name && address) return `${name} <${address}>`;
    if (address) return address;
    if (name) return name;
  }

  return 'N/A';
};

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const urlRegex = /(https?:\/\/[^\s<>"')\]]+)/gi;

const renderTextWithLinks = (text: string) => {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, lineIdx) => {
        const matches = [...line.matchAll(urlRegex)];
        const chunks: React.ReactNode[] = [];
        let lastIndex = 0;

        matches.forEach((match, idx) => {
          const rawUrl = match[0];
          const start = match.index ?? 0;
          const end = start + rawUrl.length;

          if (start > lastIndex) chunks.push(line.slice(lastIndex, start));

          const cleanUrl = rawUrl.replace(/[.,;:!?]+$/g, '');
          const trailing = rawUrl.slice(cleanUrl.length);

          chunks.push(
            <a
              key={`url-${lineIdx}-${idx}-${cleanUrl}`}
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline break-all"
              onClick={(event) => event.stopPropagation()}
            >
              {cleanUrl}
            </a>
          );

          if (trailing) chunks.push(trailing);
          lastIndex = end;
        });

        if (lastIndex < line.length) chunks.push(line.slice(lastIndex));

        return (
          <React.Fragment key={`line-${lineIdx}`}>
            {chunks}
            {lineIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </>
  );
};

interface TempMailUtilityProps {
  language: Language;
}

const TempMailUtility: React.FC<TempMailUtilityProps> = ({ language }) => {
  const isVi = language === 'vi';
  const [account, setAccount] = useState<TempMailAccount | null>(null);
  const [mailboxInput, setMailboxInput] = useState('');
  const [messages, setMessages] = useState<TempMailMessage[]>([]);
  const [expandedMailKey, setExpandedMailKey] = useState<string | null>(null);

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingMessageKey, setLoadingMessageKey] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(AUTO_REFRESH_SECONDS);

  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const getMailKey = (mail: TempMailMessage, index: number): string => mail.id || `${index}-${mail.subject || 'mail'}`;

  const refreshInboxWithToken = async (token: string, silent = false) => {
    if (!silent) {
      setLoadingInbox(true);
      setError(null);
    }

    try {
      const response = await fetch('/api/tempmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'inbox', token }),
      });

      const data = (await response.json()) as TempMailApiResponse;
      if (!response.ok) {
        throw new Error(data.message || (isVi ? 'Không thể đọc hộp thư.' : 'Cannot read inbox.'));
      }

      const inboxItems = Array.isArray(data.answer)
        ? data.answer
        : Array.isArray(data.messages)
          ? data.messages
          : [];

      const normalizedMessages = inboxItems.map((mail) => ({
        ...mail,
        subject: typeof mail.subject === 'string' && mail.subject.trim() ? mail.subject : isVi ? '(Không có tiêu đề)' : '(No subject)',
        intro: typeof mail.intro === 'string' ? mail.intro : '',
        text: typeof mail.text === 'string' ? mail.text : '',
        createdAt: typeof mail.createdAt === 'string' ? mail.createdAt : '',
        date: typeof mail.date === 'string' ? mail.date : '',
        from: normalizeAddressField(mail.from),
        to: normalizeAddressField(mail.to),
      }));

      setMessages(normalizedMessages);
      setExpandedMailKey((prev) => {
        if (!prev) return null;
        return normalizedMessages.some((mail, index) => getMailKey(mail, index) === prev) ? prev : null;
      });
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : isVi ? 'Lỗi đọc hộp thư.' : 'Failed to read inbox.');
    } finally {
      if (!silent) setLoadingInbox(false);
    }
  };

  const refreshInbox = async () => {
    if (!account?.token) return;
    setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
    await refreshInboxWithToken(account.token);
  };

  const restoreMailboxByEmail = async (emailRaw: string) => {
    const email = emailRaw.trim();
    if (!emailRegex.test(email)) return;

    const fallbackPassword = email.includes('@') ? email.split('@')[0] : '';
    if (!fallbackPassword) {
      setError(isVi ? 'Không thể suy ra mật khẩu mặc định từ email này.' : 'Cannot infer default password from this email.');
      return;
    }

    setLoadingRestore(true);
    setError(null);
    try {
      const response = await fetch('/api/tempmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          email,
          password: fallbackPassword,
        }),
      });

      const data = (await response.json()) as TempMailApiResponse;
      if (!response.ok || !data.token) {
        throw new Error(data.message || (isVi ? 'Không thể khôi phục mailbox. Có thể email không thuộc hệ tempmail này.' : 'Cannot restore mailbox. This email may not belong to this tempmail service.'));
      }

      const restoredAccount: TempMailAccount = {
        email,
        token: data.token,
        password: fallbackPassword,
        id: data.id,
      };

      setAccount(restoredAccount);
      setMailboxInput(email);
      setMessages([]);
      setExpandedMailKey(null);
      setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
      await refreshInboxWithToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : isVi ? 'Lỗi khôi phục mailbox.' : 'Failed to restore mailbox.');
    } finally {
      setLoadingRestore(false);
    }
  };

  const createMailbox = async () => {
    setLoadingCreate(true);
    setError(null);
    try {
      const response = await fetch('/api/tempmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });

      const data = (await response.json()) as TempMailApiResponse;
      if (!response.ok || !data.email || !data.token || !data.password) {
        throw new Error(data.message || (isVi ? 'Không thể tạo email tạm.' : 'Cannot create temporary email.'));
      }

      setAccount({
        email: data.email,
        token: data.token,
        password: data.password,
        id: data.id,
      });
      setMailboxInput(data.email);
      setMessages([]);
      setExpandedMailKey(null);
      setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
    } catch (err) {
      setAccount(null);
      setMessages([]);
      setMailboxInput('');
      setError(err instanceof Error ? err.message : isVi ? 'Lỗi tạo mailbox.' : 'Failed to create mailbox.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const copyEmail = async () => {
    if (!account?.email) return;
    await navigator.clipboard.writeText(account.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1200);
  };

  const clearMailbox = () => {
    setAccount(null);
    setMailboxInput('');
    setMessages([]);
    setExpandedMailKey(null);
    setLoadingMessageKey(null);
    setError(null);
    setCopiedEmail(false);
    setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
  };

  const openMessage = async (mail: TempMailMessage, mailKey: string) => {
    if (expandedMailKey === mailKey) {
      setExpandedMailKey(null);
      return;
    }

    setExpandedMailKey(mailKey);
    if (!account?.token || !mail.id) return;

    const hasDetailedBody = Boolean((mail.text && mail.text.trim()) || (mail.html && mail.html.trim()));
    if (hasDetailedBody) return;

    setLoadingMessageKey(mailKey);
    setError(null);
    try {
      const response = await fetch('/api/tempmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          token: account.token,
          messageId: mail.id,
        }),
      });

      const data = (await response.json()) as TempMailMessageDetailResponse;
      if (!response.ok) {
        throw new Error(data.message || (isVi ? 'Không thể đọc nội dung thư chi tiết.' : 'Cannot read detailed email content.'));
      }

      const normalizedHtml = Array.isArray(data.html) ? data.html.join('\n') : data.html;
      const detailedMessage: TempMailMessage = {
        ...mail,
        subject: typeof data.subject === 'string' && data.subject.trim() ? data.subject : mail.subject,
        intro: typeof data.intro === 'string' ? data.intro : mail.intro,
        text: typeof data.text === 'string' ? data.text : mail.text,
        html: typeof normalizedHtml === 'string' ? normalizedHtml : mail.html,
        date: typeof data.date === 'string' ? data.date : mail.date,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : mail.createdAt,
        from: data.from ? normalizeAddressField(data.from) : mail.from,
        to: data.to ? normalizeAddressField(data.to) : mail.to,
      };

      setMessages((prev) => prev.map((item, index) => (getMailKey(item, index) === mailKey ? detailedMessage : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : isVi ? 'Lỗi đọc nội dung thư.' : 'Failed to read email content.');
    } finally {
      setLoadingMessageKey(null);
    }
  };

  const getMailBody = (mail: TempMailMessage): string => {
    if (typeof mail.text === 'string' && mail.text.trim()) return mail.text.trim();
    if (typeof mail.html === 'string' && mail.html.trim()) return stripHtml(mail.html);
    if (typeof mail.intro === 'string' && mail.intro.trim()) return mail.intro.trim();
    return isVi ? 'Không có nội dung thư.' : 'No email content.';
  };

  useEffect(() => {
    if (!autoRefreshEnabled || !account?.token) {
      setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
      return;
    }

    const timer = setInterval(() => {
      setAutoRefreshCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [account?.token, autoRefreshEnabled]);

  useEffect(() => {
    if (!autoRefreshEnabled || !account?.token) return;
    if (autoRefreshCountdown > 0) return;

    setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
    void refreshInboxWithToken(account.token, true);
  }, [account?.token, autoRefreshCountdown, autoRefreshEnabled]);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
      <div className="text-center mb-7 space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-wide text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
          <img src="https://fviainboxes.com/logo.svg" alt="Tempmail logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
          <span>Tempmail</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
          {isVi ? 'Tạo email tạm để nhận mail nhanh, hạn chế spam vào hộp thư chính.' : 'Create a temporary email for quick inbox access and reduce spam in your main mailbox.'}
        </p>
      </div>

      <div className="bg-white dark:bg-[#1f2747]/95 rounded-2xl shadow-[0_8px_22px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_26px_rgba(2,6,23,0.30)] border border-gray-200 dark:border-indigo-900/60 p-5 md:p-6">
        <div className="max-w-xl mx-auto">
          <div className="rounded-xl border border-gray-200 dark:border-indigo-900/60 bg-gray-50 dark:bg-[#2b3458]/55 px-3.5 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <input
                value={mailboxInput}
                onChange={(e) => setMailboxInput(e.target.value)}
                onBlur={() => {
                  if (mailboxInput.trim() && mailboxInput.trim() !== account?.email) {
                    void restoreMailboxByEmail(mailboxInput);
                  }
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text').trim();
                  if (pasted) {
                    e.preventDefault();
                    setMailboxInput(pasted);
                    void restoreMailboxByEmail(pasted);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void restoreMailboxByEmail(mailboxInput);
                  }
                }}
                placeholder={isVi ? 'Bấm "Tạo" hoặc dán email cũ để mở lại mailbox' : 'Click "Create" or paste an old email to reopen mailbox'}
                className="w-full bg-transparent text-[15px] md:text-base font-normal text-gray-700 dark:text-gray-300 outline-none"
              />
            </div>
            <button
              onClick={copyEmail}
              disabled={!account?.email}
              className="shrink-0 px-2 py-1.5 rounded-md border border-gray-300 dark:border-indigo-900/70 text-sm font-normal text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2b3458] disabled:opacity-50 flex items-center gap-1.5"
            >
              <Copy size={13} />
              {copiedEmail ? (isVi ? 'Đã copy' : 'Copied') : 'Copy'}
            </button>
          </div>

          <div className="mt-3.5 flex items-center justify-center gap-1.5 flex-nowrap">
            <button
              onClick={createMailbox}
              disabled={loadingCreate}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-semibold flex items-center gap-1 disabled:opacity-60 whitespace-nowrap"
            >
              {loadingCreate ? <Loader2 className="animate-spin" size={14} /> : <MailPlus size={14} />}
              {isVi ? 'Tạo' : 'Create'}
            </button>
            <button
              onClick={createMailbox}
              disabled={loadingCreate}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1f2747]/95 border border-gray-300 dark:border-indigo-900/70 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2b3458] flex items-center gap-1 disabled:opacity-60 whitespace-nowrap"
            >
              <Shuffle size={14} />
              Random
            </button>
            <button
              onClick={refreshInbox}
              disabled={loadingInbox || !account?.token}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1 disabled:opacity-60 whitespace-nowrap"
            >
              {loadingInbox ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
              Refresh
            </button>
            <button
              onClick={clearMailbox}
              disabled={!account}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1f2747]/95 border border-gray-300 dark:border-indigo-900/70 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2b3458] flex items-center gap-1 disabled:opacity-60 whitespace-nowrap"
            >
              <Trash2 size={14} />
              {isVi ? 'Xóa' : 'Delete'}
            </button>
            {loadingRestore && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                {isVi ? 'Đang mở mailbox cũ...' : 'Restoring old mailbox...'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-7 border border-gray-200 dark:border-indigo-900/60 rounded-2xl overflow-hidden bg-white dark:bg-[#2b3458]/45">
          <div className="px-4 md:px-6 py-3.5 border-b border-gray-200 dark:border-indigo-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
              <Inbox size={16} />
              {isVi ? 'Thư đến' : 'Inbox'}
            </div>
            <button
              onClick={() =>
                setAutoRefreshEnabled((prev) => {
                  const next = !prev;
                  if (next) setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
                  return next;
                })
              }
              disabled={!account?.token}
              className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-indigo-900/70 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2b3458] disabled:opacity-60 flex items-center gap-2"
              title={isVi ? `Tự động làm mới mỗi ${AUTO_REFRESH_SECONDS}s` : `Auto refresh every ${AUTO_REFRESH_SECONDS}s`}
            >
              <RefreshCw size={14} className={autoRefreshEnabled && account?.token ? 'animate-spin' : ''} />
              {autoRefreshEnabled ? (
                <>
                  <span className="md:hidden">{`Auto-refresh (${autoRefreshCountdown}s)`}</span>
                  <span className="hidden md:inline">{isVi ? `Làm mới tự động (${autoRefreshCountdown}s)` : `Auto refresh (${autoRefreshCountdown}s)`}</span>
                </>
              ) : (
                <>
                  <span className="md:hidden">Auto-refresh</span>
                  <span className="hidden md:inline">{isVi ? 'Bật làm mới tự động' : 'Enable auto refresh'}</span>
                </>
              )}
            </button>
          </div>

          <div className="min-h-[300px] max-h-[700px] overflow-y-auto">
            {!account && (
              <div className="h-full min-h-[300px] flex items-center justify-center text-center px-6">
                <div>
                  <p className="text-gray-700 dark:text-gray-200 font-semibold">{isVi ? 'Chưa có hộp thư tạm' : 'No temporary mailbox yet'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{isVi ? 'Bấm Tạo hoặc dán email cũ để bắt đầu nhận thư.' : 'Click Create or paste an old email to start receiving emails.'}</p>
                </div>
              </div>
            )}

            {account && loadingInbox && (
              <div className="h-full min-h-[300px] flex items-center justify-center text-center px-6">
                <div>
                  <Loader2 className="animate-spin text-gray-500 mx-auto" size={30} />
                  <p className="text-gray-700 dark:text-gray-200 font-semibold mt-4">{isVi ? 'Đang tải thư...' : 'Loading emails...'}</p>
                </div>
              </div>
            )}

            {account && !loadingInbox && messages.length === 0 && (
              <div className="h-full min-h-[300px] flex items-center justify-center text-center px-6">
                <div>
                  <Inbox className="mx-auto text-gray-400" size={30} />
                  <p className="text-gray-700 dark:text-gray-200 font-semibold mt-4">{isVi ? 'Chưa có thư' : 'No emails yet'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{isVi ? 'Hệ thống sẽ tự động làm mới. Anh cũng có thể bấm Refresh thủ công.' : 'Inbox will auto-refresh. You can also click Refresh manually.'}</p>
                </div>
              </div>
            )}

            {account && !loadingInbox && messages.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map((mail, index) => {
                  const mailKey = getMailKey(mail, index);
                  const isExpanded = expandedMailKey === mailKey;
                  return (
                    <div key={mailKey} className={isExpanded ? 'bg-blue-50/70 dark:bg-blue-900/20' : ''}>
                      <button
                        type="button"
                        onClick={() => openMessage(mail, mailKey)}
                        className="w-full text-left px-4 md:px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{mail.subject || (isVi ? '(Không có tiêu đề)' : '(No subject)')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {isVi ? 'Từ' : 'From'}: {typeof mail.from === 'string' ? mail.from : 'N/A'} {mail.date || mail.createdAt ? `• ${mail.date || mail.createdAt}` : ''}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 break-words">{mail.intro || (isVi ? 'Không có nội dung preview.' : 'No preview content.')}</p>
                      </button>

                      {isExpanded && (
                        <div className="px-4 md:px-6 pb-4 pt-0 border-t border-gray-200/80 dark:border-indigo-900/60">
                          {loadingMessageKey === mailKey ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 py-3">
                              <Loader2 size={16} className="animate-spin" />
                              {isVi ? 'Đang tải nội dung thư...' : 'Loading email content...'}
                            </div>
                          ) : (
                            <p className="text-sm leading-6 whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 py-3">
                              {renderTextWithLinks(getMailBody(mail))}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

export default TempMailUtility;

