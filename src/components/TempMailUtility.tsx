import React, { useState } from 'react';
import { AlertCircle, Copy, Inbox, Loader2, MailPlus, RefreshCw } from 'lucide-react';

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
  [key: string]: unknown;
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
  const [copiedField, setCopiedField] = useState<'email' | 'token' | null>(null);

  const copyText = async (value: string, field: 'email' | 'token') => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1200);
  };

  const createMailbox = async () => {
    setLoadingCreate(true);
    setError(null);
    setMessages([]);

    try {
      const response = await fetch('/api/tempmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });

      const data = (await response.json()) as TempMailApiResponse;
      if (!response.ok || !data.email || !data.token || !data.password) {
        throw new Error(data.message || 'Không thể tạo mail tạm.');
      }

      setAccount({
        email: data.email,
        password: data.password,
        token: data.token,
        id: data.id,
      });
    } catch (err) {
      setAccount(null);
      setError(err instanceof Error ? err.message : 'Lỗi tạo mailbox.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const fetchInbox = async () => {
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
      setError(err instanceof Error ? err.message : 'Lỗi đọc mailbox.');
    } finally {
      setLoadingInbox(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl md:text-5xl font-black tracking-wide text-gray-900 dark:text-gray-100">Tempmail</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Tạo email tạm và kiểm tra thư đến theo thời gian thực.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={createMailbox}
            disabled={loadingCreate}
            className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loadingCreate ? <Loader2 className="animate-spin" size={18} /> : <MailPlus size={18} />}
            Tạo Mail Tạm
          </button>

          <button
            onClick={fetchInbox}
            disabled={loadingInbox || !account?.token}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loadingInbox ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Làm Mới Hộp Thư
          </button>
        </div>

        {account && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/30 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Email tạm</p>
                <p className="font-semibold text-gray-900 dark:text-white truncate">{account.email}</p>
              </div>
              <button
                onClick={() => copyText(account.email, 'email')}
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy size={14} />
                {copiedField === 'email' ? 'Đã copy' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Token</p>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate">{account.token}</p>
              </div>
              <button
                onClick={() => copyText(account.token, 'token')}
                className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy size={14} />
                {copiedField === 'token' ? 'Đã copy' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Inbox size={18} />
              Thư đến ({messages.length})
            </h3>

            {messages.map((mail, index) => (
              <div key={mail.id || `${index}-${mail.subject || 'mail'}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">{mail.subject || '(Không có tiêu đề)'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Từ: {mail.from || 'N/A'} {mail.date || mail.createdAt ? `• ${mail.date || mail.createdAt}` : ''}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 break-words">{mail.intro || mail.text || 'Không có nội dung preview.'}</p>
              </div>
            ))}
          </div>
        )}

        {account && !loadingInbox && messages.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">Hộp thư đang trống. Bấm "Làm Mới Hộp Thư" để kiểm tra lại.</p>
        )}
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
