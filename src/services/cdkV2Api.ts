import { Language } from '../utils/translations';

type ApiState = 'valid' | 'invalid' | 'requires_confirmation' | 'pending' | 'success' | 'error';

interface ApiEnvelope<T> {
  ok: boolean;
  state: ApiState;
  message: string;
  data?: T;
  upstreamStatus?: number;
  errorCode?: string;
}

export interface V2VerifyData {
  code: string;
  status: string;
  service: string;
  plan: string;
  term: string;
  keyType: string | null;
  subscriptionHours: number | null;
  activatedEmail: string | null;
  activatedAt: string | null;
  subscriptionEndsAt: string | null;
}

export interface V2ActivateData {
  code: string;
  status: string;
}

export interface V2ActivationData {
  code: string;
  status: string;
  activatedEmail: string | null;
  name: string | null;
  service: string;
  plan: string | null;
  term: string | null;
  attempts: number | null;
}

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

const fetchJson = async <T,>(
  url: string,
  body: Record<string, unknown>,
  language: Language,
): Promise<ApiEnvelope<T>> => {
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
    let payload: ApiEnvelope<T> | null = null;

    if (rawText) {
      try {
        payload = JSON.parse(rawText) as ApiEnvelope<T>;
      } catch {
        payload = null;
      }
    }

    if (response.ok && payload) {
      return payload;
    }

    const detail = payload?.message || rawText?.trim();
    lastError = detail || (language === 'vi'
      ? `Yêu cầu thất bại (HTTP ${response.status}). Vui lòng thử lại.`
      : `Request failed (HTTP ${response.status}). Please try again.`);

    const isLastCandidate = i === candidates.length - 1;
    if (response.status !== 404 || isLastCandidate) {
      break;
    }
  }

  throw new Error(lastError);
};

export const verifyCdkV2 = async (cdk: string, language: Language): Promise<ApiEnvelope<V2VerifyData>> =>
  fetchJson<V2VerifyData>('/api/cdk-v2-verify', { cdk }, language);

export const activateSessionV2 = async (
  cdk: string,
  sessionJson: string,
  confirmOverwrite: boolean,
  language: Language,
): Promise<ApiEnvelope<V2ActivateData>> =>
  fetchJson<V2ActivateData>('/api/cdk-v2-activate-session', { cdk, sessionJson, confirmOverwrite }, language);

export const pollActivationV2 = async (cdk: string, language: Language): Promise<ApiEnvelope<V2ActivationData>> =>
  fetchJson<V2ActivationData>('/api/cdk-v2-activation', { cdk }, language);
