# TaiVideo API Documentation

## Base URL
- **Production**: `https://taivideo.huphet.vn/api/video-download`
- **Cloudflare Proxy**: Frontend gọi `/api/video-download` → Cloudflare Function proxy tới n8n

## Endpoint

### POST /api/video-download

Download video từ các nền tảng được hỗ trợ.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ | URL video cần tải |
| `platform` | string | ✅ | Platform: `youtube`, `tiktok`, `facebook`, `instagram`, `shopee`, `douyin` |
| `phase` | string | ❌ | Chỉ cho YouTube: `extract` (lấy formats) hoặc `download` (tải video) |
| `video_format_id` | string | ❌ | Chỉ cho YouTube phase=download: ID format video đã chọn |
| `audio_format_id` | string | ❌ | Chỉ cho YouTube phase=download: ID format audio |

#### Response

```json
{
  "error": false,
  "downloadUrl": "https://...",
  "title": "Video title",
  "quality": "1080p",
  "thumbnail": "https://...",
  "platform": "youtube",
  "formats": [...],       // Chỉ có khi phase=extract
  "phase": "extract"      // Chỉ có khi YouTube
}
```

#### Error Response
```json
{
  "error": true,
  "message": "Không thể tải video"
}
```

#### YouTube 2-Phase Flow

**Phase 1: Extract formats**
```json
// Request
{ "url": "https://youtube.com/watch?v=xxx", "platform": "youtube", "phase": "extract" }

// Response
{
  "error": false,
  "title": "Video Title",
  "thumbnail": "https://img.youtube.com/vi/xxx/hqdefault.jpg",
  "formats": [
    { "format_id": "137", "height": 1080, "ext": "mp4", "filesize": 50000000, "vcodec": "avc1", "acodec": "none" },
    { "format_id": "140", "height": 0, "ext": "m4a", "acodec": "mp4a.40.2", "vcodec": "none" }
  ]
}
```

**Phase 2: Download with selected format**
```json
// Request
{ "url": "https://youtube.com/watch?v=xxx", "platform": "youtube", "phase": "download", "video_format_id": "137", "audio_format_id": "140" }

// Response
{
  "error": false,
  "downloadUrl": "https://snapvid.cc/download/...",
  "title": "Video Title",
  "quality": "1080p"
}
```

#### Other Platforms (Satoru V2)
```json
// Request
{ "url": "https://tiktok.com/@user/video/123", "platform": "tiktok" }

// Response
{
  "error": false,
  "downloadUrl": "https://...",
  "title": "TikTok Video",
  "thumbnail": "https://...",
  "quality": "HD"
}
```

## Timeouts
| Phase | Timeout |
|-------|---------|
| Extract (formats) | 30,000ms |
| Download (non-YouTube) | 30,000ms |
| Download (YouTube muxing) | 300,000ms (5 min) |

## n8n Workflow Config
- **Webhook URL**: `https://auto.myphamhaki.vn/webhook/snapvie-download`
- **Muxing polling**: 60 iterations × 5s = 300s max
