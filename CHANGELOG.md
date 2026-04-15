# Changelog - TaiVideo

## [2026-04-13]

### Added
- **YouTube Quality Selector**: 2-phase download flow (extract formats → user chọn quality → download+mux)
  - `QualitySelector` component hiển thị grid các format (1080p, 720p, 480p...)
  - `fetchFormats()` + `fetchDownloadWithFormat()` trong `n8nService.ts`
- **Instant Thumbnails**: YouTube thumbnail load ngay từ URL (không cần API)
  - `getInstantThumbnail()` trong `geminiService.ts`
- **Streaming Result Updates**: từng result cập nhật UI ngay khi API respond (thay vì đợi tất cả)
- **Placeholder Thumbnails**: Shopee và các platform khác hiện ảnh picsum trong lúc chờ API

### Changed
- **Download Timeout**: Tăng từ 120s → 300s (5 phút) cho YouTube muxing
- **n8n Polling Loop**: 24 iterations → 60 iterations (300s max)
- **Nút Download**: Đổi "Tải lại" → "Tải xuống", căn giữa trên cả mobile và desktop

### Fixed
- **CORS 403**: Xóa `_middleware.ts` và `cors.ts` vô tình push lên, block domain `taivideo.huphet.vn`
- **Platform Detection**: Case-insensitive YouTube check (`'YouTube'` vs `'youtube'`)
- **Regex Escaping**: Fix `\\\\d+` → `\\d+` trong n8n workflow JSON (format parser bị fail)
- **.gitignore**: Thêm `_middleware.ts`, `cors.ts`, `.env` vào ignore list

## [2026-04-12]

### Added
- YouTube download qua proxy để ẩn Snapvie origin URL trên mobile

### Fixed
- Download timeout tăng lên 150s để match n8n polling 120s
