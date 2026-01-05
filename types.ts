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
  HOME = 'Home',
  TOOL = 'Tool',
  VIDEO = 'Video',
  RUT_GON = 'Rút gọn'
}