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
}

export enum NavItem {
  HOME = 'HOME',
  TOOL = 'TOOL',
  VIDEO = 'VIDEO',
  AI_WRITER = 'AI_WRITER',
  RUT_GON = 'RUT_GON'
}