export interface VideoFormat {
  format_id: string;
  ext: string;
  height: number;
  vcodec: string;
  filesize: number;
  has_audio: boolean;
  format_note: string;
}

export interface DownloadResult {
  id: string;
  originalUrl: string;
  platform: string;
  title: string;
  status: 'success' | 'error' | 'processing';
  thumbnail?: string;
  downloadUrl?: string; // Link download từ n8n
  quality?: string; // HD, FHD, etc.
  errorMessage?: string; // Thông báo lỗi nếu có
  formats?: VideoFormat[]; // Danh sách formats cho quality selector (YouTube)
}

export enum NavItem {
  HOME = 'HOME',
  TOOL = 'TOOL',
  VIDEO = 'VIDEO',
  AI_WRITER = 'AI_WRITER',
  RUT_GON = 'RUT_GON'
}