import React, { useState } from 'react';
import { AlertCircle, Inbox, Loader2, Mail, RefreshCw } from 'lucide-react';

type ReadMode = 'graph' | 'oauth2';

interface ParsedCredential {
  email: string;
  refresh_token: string;
  client_id: string;
}

interface OutlookMessage {
  id?: string;
  subject?: string;
  from?: string;
  date?: string;
  intro?: string;
  text?: string;
  html?: string;
  body?: string;
  message?: string;
}

const urlRegex = /(https?:\/\/[^\s<>"')\]]+)/gi;

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeMessage = (msg: Record<string, unknown>): OutlookMessage => {
  const fromObj = msg.from as { address?: string; name?: string } | undefined;
  const from =
    typeof msg.from === 'string'
      ? msg.from
      : fromObj?.name && fromObj?.address
        ? `${fromObj.name} <${fromObj.address}>`
        : fromObj?.address || fromObj?.name || undefined;

  const html = typeof msg.html === 'string' ? msg.html : undefined;
  const text = typeof msg.text === 'string' ? msg.text : undefined;
  const body = typeof msg.body === 'string' ? msg.body : typeof msg.message === 'string' ? msg.message : undefined;

  return {
    id: typeof msg.id === 'string' ? msg.id : undefined,
    subject: typeof msg.subject === 'string' ? msg.subject : '(Không có tiêu đề)',
    from,
    date: (msg.date as string) || (msg.createdAt as string) || (msg.time as string) || undefined,
    intro: typeof msg.intro === 'string' ? msg.intro : undefined,
    text,
    html,
    body,
    message: typeof msg.message === 'string' ? msg.message : undefined,
  };
};

const extractMessages = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return payload.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null);
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  const candidates = ['data', 'messages', 'mail', 'result', 'items'];
  for (const key of candidates) {
    if (Array.isArray(obj[key])) {
      return (obj[key] as unknown[]).filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null);
    }
  }
  return [];
};

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
              key={`outlook-url-${lineIdx}-${idx}-${cleanUrl}`}
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline break-all"
            >
              {cleanUrl}
            </a>
          );

          if (trailing) chunks.push(trailing);
          lastIndex = end;
        });

        if (lastIndex < line.length) chunks.push(line.slice(lastIndex));
        return (
          <React.Fragment key={`outlook-line-${lineIdx}`}>
            {chunks}
            {lineIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </>
  );
};

const OutlookMailboxUtility: React.FC = () => {
  const [mode, setMode] = useState<ReadMode>('oauth2');
  const [credentialText, setCredentialText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<OutlookMessage[]>([]);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [activeEmail, setActiveEmail] = useState<string>('');

  const parseCredential = (raw: string): ParsedCredential | null => {
    const firstLine = raw
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    if (!firstLine) return null;
    const parts = firstLine.split('|').map((part) => part.trim());

    if (parts.length >= 4) {
      return {
        email: parts[0],
        refresh_token: parts[2],
        client_id: parts[3],
      };
    }

    if (parts.length >= 3) {
      return {
        email: parts[0],
        refresh_token: parts[1],
        client_id: parts[2],
      };
    }

    return null;
  };

  const readMailbox = async () => {
    const credential = parseCredential(credentialText);
    if (!credential) {
      setError('Sai định dạng. Dùng: email|password|refresh_token|client_id hoặc email|refresh_token|client_id');
      return;
    }

    setLoading(true);
    setError(null);
    setExpandedMessageId(null);

    try {
      const response = await fetch('/api/dongvan-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          email: credential.email,
          refresh_token: credential.refresh_token,
          client_id: credential.client_id,
          list_mail: 'all',
        }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message = (data as { message?: string; msg?: string })?.message || (data as { msg?: string })?.msg;
        throw new Error(message || 'Không thể đọc mailbox từ DongVan API.');
      }

      const rawMessages = extractMessages(data);
      const normalized = rawMessages.map(normalizeMessage);
      setMessages(normalized);
      setActiveEmail(credential.email);
      if (normalized.length === 0) {
        setError('Không có thư hoặc API không trả danh sách thư cho tài khoản này.');
      }
    } catch (err) {
      setMessages([]);
      setActiveEmail('');
      setError(err instanceof Error ? err.message : 'Lỗi đọc mailbox.');
    } finally {
      setLoading(false);
    }
  };

  const getMessageBody = (message: OutlookMessage): string => {
    if (message.text?.trim()) return message.text.trim();
    if (message.html?.trim()) return stripHtml(message.html);
    if (message.body?.trim()) return message.body.trim();
    if (message.message?.trim()) return message.message.trim();
    if (message.intro?.trim()) return message.intro.trim();
    return 'Không có nội dung thư.';
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fadeIn pb-20">
      <div className="text-center mb-7 space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-wide text-gray-900 dark:text-gray-100">Outlook / Hotmail</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
          Đọc inbox bằng token theo chuẩn DongVanFB API.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Chế độ:</span>
          <button
            onClick={() => setMode('graph')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold ${mode === 'graph' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            Graph API
          </button>
          <button
            onClick={() => setMode('oauth2')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold ${mode === 'oauth2' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
          >
            OAuth2
          </button>
        </div>

        <textarea
          value={credentialText}
          onChange={(e) => setCredentialText(e.target.value)}
          rows={6}
          placeholder="email|password|refresh_token|client_id"
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm resize-y"
        />

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mỗi lần đọc dùng dòng đầu tiên. Không lưu token trên trình duyệt.
          </p>
          <button
            onClick={readMailbox}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Đọc hòm thư
          </button>
        </div>

        <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900/20">
          <div className="px-4 md:px-6 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
              <Inbox size={16} />
              Thư đến {activeEmail ? `(${activeEmail})` : ''}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{messages.length} thư</span>
          </div>

          <div className="min-h-[260px] max-h-[700px] overflow-y-auto">
            {!loading && messages.length === 0 && (
              <div className="h-full min-h-[260px] flex items-center justify-center text-center px-6">
                <div>
                  <Mail className="mx-auto text-gray-400" size={30} />
                  <p className="text-gray-700 dark:text-gray-200 font-semibold mt-4">Chưa có dữ liệu thư</p>
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map((message, index) => {
                  const key = message.id || `${index}-${message.subject || 'mail'}`;
                  const isExpanded = expandedMessageId === key;
                  return (
                    <div key={key} className={isExpanded ? 'bg-blue-50/70 dark:bg-blue-900/20' : ''}>
                      <button
                        type="button"
                        onClick={() => setExpandedMessageId((prev) => (prev === key ? null : key))}
                        className="w-full text-left px-4 md:px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{message.subject || '(Không có tiêu đề)'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Từ: {message.from || 'N/A'} {message.date ? `• ${message.date}` : ''}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 break-words">{message.intro || '...'}</p>
                      </button>

                      {isExpanded && (
                        <div className="px-4 md:px-6 pb-4 pt-0 border-t border-gray-200/80 dark:border-gray-700/80">
                          <p className="text-sm leading-6 whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 py-3">
                            {renderTextWithLinks(getMessageBody(message))}
                          </p>
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

export default OutlookMailboxUtility;
