import React, { useState } from 'react';
import { AlertCircle, Copy, Inbox, Loader2, MailPlus, RefreshCw, Shuffle, Trash2 } from 'lucide-react';

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
  id?: string;
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

const normalizeAddressField = (value: unknown): string => {
  if (!value) return 'N/A';
  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    const parts = value.map((item) => normalizeAddressField(item)).filter((item) => item && item !== 'N/A');
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

const TempMailUtility: React.FC = () => {
  const [account, setAccount] = useState<TempMailAccount | null>(null);
  const [messages, setMessages] = useState<TempMailMessage[]>([]);
  const [expandedMailKey, setExpandedMailKey] = useState<string | null>(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingMessageKey, setLoadingMessageKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState('');
  const [restorePassword, setRestorePassword] = useState('');

  const getMailKey = (mail: TempMailMessage, index: number): string => mail.id || `${index}-${mail.subject || 'mail'}`;

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
        throw new Error(data.message || 'Không thể tạo email tạm.');
      }

      setAccount({
        email: data.email,
        token: data.token,
        password: data.password,
        id: data.id,
      });
      setMessages([]);
      setExpandedMailKey(null);
    } catch (err) {
      setAccount(null);
      setMessages([]);
      setError(err instanceof Error ? err.message : 'Lỗi tạo mailbox.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const restoreMailbox = async () => {
    const email = restoreEmail.trim();
    if (!email) {
      setError('Vui lòng nhập email cũ để khôi phục.');
      return;
    }

    const fallbackPassword = email.includes('@') ? email.split('@')[0] : '';
    const password = restorePassword.trim() || fallbackPassword;
    if (!password) {
      setError('Thiếu mật khẩu để khôi phục mailbox.');
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
          password,
        }),
      });

      const data = (await response.json()) as TempMailApiResponse;
      const token = data.token;
      if (!response.ok || !token) {
        throw new Error(data.message || 'Không thể khôi phục mailbox. Kiểm tra lại email/mật khẩu.');
      }

      setAccount({
        email,
        token,
        password,
        id: data.id,
      });
      setMessages([]);
      setExpandedMailKey(null);
      await refreshInboxWithToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khôi phục mailbox.');
    } finally {
      setLoadingRestore(false);
    }
  };

  const refreshInboxWithToken = async (token: string) => {
    setLoadingInbox(true);
    setError(null);
    try {
      const response = await fetch('/api/tempmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'inbox', token }),
      });

      const data = (await response.json()) as TempMailApiResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Không thể đọc hộp thư.');
      }

      const inboxItems = Array.isArray(data.answer) ? data.answer : Array.isArray(data.messages) ? data.messages : [];

      const normalizedMessages = inboxItems.map((mail) => ({
        ...mail,
        subject: typeof mail.subject === 'string' && mail.subject.trim() ? mail.subject : '(Không có tiêu đề)',
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
      setError(err instanceof Error ? err.message : 'Lỗi đọc hộp thư.');
    } finally {
      setLoadingInbox(false);
    }
  };

  const refreshInbox = async () => {
    if (!account?.token) return;
    await refreshInboxWithToken(account.token);
  };

  const copyEmail = async () => {
    if (!account?.email) return;
    await navigator.clipboard.writeText(account.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1200);
  };

  const clearMailbox = () => {
    setAccount(null);
    setMessages([]);
    setExpandedMailKey(null);
    setLoadingMessageKey(null);
    setError(null);
    setCopiedEmail(false);
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
        throw new Error(data.message || 'Không thể đọc nội dung thư chi tiết.');
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
      setError(err instanceof Error ? err.message : 'Lỗi đọc nội dung thư.');
    } finally {
      setLoadingMessageKey(null);
    }
  };

  const getMailBody = (mail: TempMailMessage): string => {
    if (typeof mail.text === 'string' && mail.text.trim()) return mail.text.trim();
    if (typeof mail.html === 'string' && mail.html.trim()) return stripHtml(mail.html);
    if (typeof mail.intro === 'string' && mail.intro.trim()) return mail.intro.trim();
    return 'Không có nội dung thư.';
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
      <div className="text-center mb-7 space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-wide text-gray-900 dark:text-gray-100">Tempmail</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
          Tạo email tạm để nhận mail nhanh, hạn chế spam vào hộp thư chính.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 md:p-6">
        <div className="max-w-xl mx-auto">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-3.5 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p
                className={`truncate ${
                  account?.email
                    ? 'text-[15px] md:text-base font-normal text-gray-700 dark:text-gray-300'
                    : 'text-[14px] md:text-[15px] font-normal text-gray-500 dark:text-gray-400'
                }`}
              >
                {account?.email || 'Bấm "Tạo" để tạo email tạm và bắt đầu nhận thư.'}
              </p>
            </div>
            <button
              onClick={copyEmail}
              disabled={!account?.email}
              className="shrink-0 px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-normal text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Copy size={13} />
              {copiedEmail ? 'Đã copy' : 'Copy'}
            </button>
          </div>

          <div className="mt-3.5 flex items-center justify-center gap-1.5 flex-nowrap">
            <button
              onClick={createMailbox}
              disabled={loadingCreate}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-semibold flex items-center gap-1 disabled:opacity-60 whitespace-nowrap"
            >
              {loadingCreate ? <Loader2 className="animate-spin" size={14} /> : <MailPlus size={14} />}
              Tạo
            </button>
            <button
              onClick={createMailbox}
              disabled={loadingCreate}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1 disabled:opacity-60 whitespace-nowrap"
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
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1 disabled:opacity-60 whitespace-nowrap"
            >
              <Trash2 size={14} />
              Xóa
            </button>
          </div>

          <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 font-medium">Khôi phục mailbox cũ</p>
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_auto] gap-2">
              <input
                value={restoreEmail}
                onChange={(e) => setRestoreEmail(e.target.value)}
                placeholder="Nhập email cũ (ví dụ: abc@domain.com)"
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100"
              />
              <input
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                placeholder="Mật khẩu (để trống sẽ thử auto)"
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100"
              />
              <button
                onClick={restoreMailbox}
                disabled={loadingRestore}
                className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loadingRestore ? <Loader2 size={14} className="animate-spin" /> : null}
                Khôi phục
              </button>
            </div>
          </div>
        </div>

        <div className="mt-7 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900/20">
          <div className="px-4 md:px-6 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
              <Inbox size={16} />
              Thư đến
            </div>
            <button
              onClick={refreshInbox}
              disabled={loadingInbox || !account?.token}
              className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 flex items-center gap-2"
            >
              <RefreshCw size={14} className={loadingInbox ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>

          <div className="min-h-[300px] max-h-[700px] overflow-y-auto">
            {!account && (
              <div className="h-full min-h-[300px] flex items-center justify-center text-center px-6">
                <div>
                  <p className="text-gray-700 dark:text-gray-200 font-semibold">Chưa có hộp thư tạm</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Bấm Tạo để tạo email tạm và bắt đầu nhận thư.</p>
                </div>
              </div>
            )}

            {account && loadingInbox && (
              <div className="h-full min-h-[300px] flex items-center justify-center text-center px-6">
                <div>
                  <Loader2 className="animate-spin text-gray-500 mx-auto" size={30} />
                  <p className="text-gray-700 dark:text-gray-200 font-semibold mt-4">Đang tải thư...</p>
                </div>
              </div>
            )}

            {account && !loadingInbox && messages.length === 0 && (
              <div className="h-full min-h-[300px] flex items-center justify-center text-center px-6">
                <div>
                  <Inbox className="mx-auto text-gray-400" size={30} />
                  <p className="text-gray-700 dark:text-gray-200 font-semibold mt-4">Chưa có thư</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang chờ thư đến. Bấm Làm mới để kiểm tra lại.</p>
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
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{mail.subject || '(Không có tiêu đề)'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Từ: {typeof mail.from === 'string' ? mail.from : 'N/A'}{' '}
                          {mail.date || mail.createdAt ? `• ${mail.date || mail.createdAt}` : ''}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 break-words">{mail.intro || 'Không có nội dung preview.'}</p>
                      </button>

                      {isExpanded && (
                        <div className="px-4 md:px-6 pb-4 pt-0 border-t border-gray-200/80 dark:border-gray-700/80">
                          {loadingMessageKey === mailKey ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 py-3">
                              <Loader2 size={16} className="animate-spin" />
                              Đang tải nội dung thư...
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
