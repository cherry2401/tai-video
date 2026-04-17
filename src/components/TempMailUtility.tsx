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
  from?: string;
  to?: string;
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
  message?: string;
}

const TempMailUtility: React.FC = () => {
  const [account, setAccount] = useState<TempMailAccount | null>(null);
  const [messages, setMessages] = useState<TempMailMessage[]>([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

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
    } catch (err) {
      setAccount(null);
      setMessages([]);
      setError(err instanceof Error ? err.message : 'Lỗi tạo mailbox.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const refreshInbox = async () => {
    if (!account?.token) return;
    setLoadingInbox(true);
    setError(null);
    try {
      const response = await fetch('/api/tempmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'inbox', token: account.token }),
      });
      const data = (await response.json()) as TempMailApiResponse;
      if (!response.ok) {
        throw new Error(data.message || 'Không thể đọc hộp thư.');
      }
      setMessages(Array.isArray(data.answer) ? data.answer : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đọc hộp thư.');
    } finally {
      setLoadingInbox(false);
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
    setMessages([]);
    setError(null);
    setCopiedEmail(false);
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

          <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
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
                {messages.map((mail, index) => (
                  <div key={mail.id || `${index}-${mail.subject || 'mail'}`} className="px-4 md:px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{mail.subject || '(Không có tiêu đề)'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Từ: {mail.from || 'N/A'} {mail.date || mail.createdAt ? `• ${mail.date || mail.createdAt}` : ''}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 break-words">{mail.intro || mail.text || 'Không có nội dung preview.'}</p>
                  </div>
                ))}
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
