# 🎬 A.N.M Video Downloader - React Version

Ứng dụng tải video đa nền tảng với Shopee Affiliate Tracking, được xây dựng bằng React + TypeScript + Vite.

---

## ✨ Tính năng

- ✅ **Tải video đa nền tảng** (Shopee, TikTok, Facebook, YouTube, v.v.)
- ✅ **Shopee Affiliate Tracking** qua iframe để kiếm hoa hồng
- ✅ **Gemini AI Analysis** tự động phát hiện platform và title
- ✅ **n8n Backend Integration** lấy download link từ server
- ✅ **Dark Mode** hỗ trợ
- ✅ **Multi-language** (Tiếng Việt, English, Trung, Hàn)
- ✅ **Responsive Design** mobile-friendly
- ✅ **Link Shortener** tích hợp

---

## 🏗️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **UI:** TailwindCSS
- **Icons:** Lucide React
- **AI:** Google Gemini API
- **Backend:** n8n Workflow Automation
- **CDN:** Cloudflare Pages
- **Tunnel:** Cloudflare Tunnel (Zero Trust)

---

## 📁 Cấu trúc Project

```
web-fontend-v2/
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── DownloadForm.tsx
│   ├── ResultList.tsx
│   ├── ShopeeAffiliate.tsx          # ✨ NEW: Affiliate tracking
│   ├── ShortenForm.tsx
│   ├── FeatureSection.tsx
│   ├── TutorialSection.tsx
│   ├── SupportedPlatforms.tsx
│   ├── FAQSection.tsx
│   ├── PrivacyPolicy.tsx
│   ├── TermsOfService.tsx
│   ├── ContactForm.tsx
│   └── AboutUs.tsx
│
├── services/
│   ├── geminiService.ts             # Gemini AI analysis
│   ├── n8nService.ts                # ✨ NEW: n8n webhook calls
│   └── affiliateService.ts          # ✨ NEW: Shopee affiliate
│
├── utils/
│   └── translations.ts              # i18n
│
├── App.tsx                          # Main app
├── App_Enhanced.tsx                 # ✨ NEW: With n8n + affiliate
├── index.tsx                        # Entry point
├── types.ts                         # TypeScript types
│
├── .env.example                     # ✨ NEW: Config template
├── SETUP_GUIDE.md                   # ✨ NEW: Setup instructions
├── README.md                        # This file
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy template
copy .env.example .env.local

# Edit .env.local với các giá trị thực
```

### 3. Run Development Server

```bash
npm run dev
```

Mở browser: http://localhost:5173

---

## 🔧 Setup đầy đủ

Xem hướng dẫn chi tiết: **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**

**Tóm tắt:**

1. ✅ Replace `App.tsx` bằng `App_Enhanced.tsx`
2. ✅ Replace `components/ResultList.tsx` bằng `ResultList_Enhanced.tsx`
3. ✅ Configure `.env.local`
4. ✅ Setup n8n workflow (import `Shopee Web Download API.json`)
5. ✅ Setup Cloudflare Tunnel
6. ✅ Deploy to Cloudflare Pages

---

## ⚙️ Environment Variables

File: `.env.local`

```env
# n8n Webhook
VITE_N8N_WEBHOOK_URL=https://your-domain.com/webhook/shopee-download

# Shopee Affiliate
VITE_SHOPEE_SITE_ID=your_site_id
VITE_SHOPEE_PARTNER_ID=your_partner_id
```

Xem full config: `.env.example`

---

## 🎯 Workflow

```
User paste URL
    ↓
Gemini AI analyze → Platform + Title
    ↓
[If Shopee] → Show affiliate iframe (2-3s)
    ↓
Call n8n webhook → Get download link
    ↓
Display download button
    ↓
User clicks → Direct download from CDN
```

---

## 📦 Build for Production

```bash
npm run build
```

Output: `dist/` folder

Deploy `dist/` to:
- ✅ Cloudflare Pages (Recommended)
- ✅ Vercel
- ✅ Netlify
- ✅ Static hosting

---

## 🛠️ Scripts

| Command | Mô tả |
|---------|-------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 🧪 Testing

### Local Test

```bash
npm run dev
```

Test với URL:
- Shopee: `https://shopee.vn/video/...`
- TikTok: `https://www.tiktok.com/@.../video/...`
- Facebook: `https://www.facebook.com/.../videos/...`

### Production Test

1. Deploy lên Cloudflare Pages
2. Test với real URLs
3. Check Shopee Affiliate Dashboard sau 24h

---

## 💰 Monetization

### Shopee Affiliate

1. Đăng ký: https://affiliate.shopee.vn
2. Lấy Site ID + Partner ID
3. Update `.env.local`
4. Deploy

**Ước tính thu nhập:**

- 1000 downloads/ngày
- 1% conversion → 10 orders
- Avg order: 500k VNĐ
- Commission: 5%
- **→ ~250k/ngày = 7.5 triệu/tháng** 💰

---

## 📚 Documentation

| File | Mô tả |
|------|-------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Hướng dẫn setup chi tiết |
| [.env.example](./.env.example) | Config template |
| ../web-frontend/CLOUDFLARE_PAGES_SETUP.md | Deploy frontend |
| ../web-frontend/CLOUDFLARE_TUNNEL_SETUP.md | Setup tunnel |
| ../web-frontend/SHOPEE_AFFILIATE_SETUP.md | Affiliate guide |

---

## 🔍 Troubleshooting

### TypeScript Errors

```bash
rm -rf node_modules .vite
npm install
```

### Env Variables Not Loading

Restart dev server:

```bash
# Ctrl+C
npm run dev
```

### CORS Errors

Check:
1. n8n workflow has CORS headers
2. Cloudflare Tunnel config
3. Webhook URL correct

---

## 🎨 Customization

### Thay đổi theme colors

File: `index.html` (Tailwind config)

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
      }
    }
  }
}
```

### Thêm ngôn ngữ mới

File: `utils/translations.ts`

```typescript
export const translations = {
  vi: { ... },
  en: { ... },
  kr: { ... }, // ✨ Add new language
};
```

---

## 🚧 Roadmap

- [x] Gemini AI analysis
- [x] Shopee download
- [x] Shopee affiliate tracking
- [x] n8n backend integration
- [x] Dark mode
- [x] Multi-language
- [ ] TikTok API integration
- [ ] Facebook video support
- [ ] Batch download
- [ ] Download history
- [ ] User accounts
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Pull requests welcome!

1. Fork repo
2. Create feature branch
3. Commit changes
4. Push and create PR

---

## 📝 License

MIT License - Free to use!

---

## 🙏 Credits

- **React** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Gemini AI** - Link analysis
- **n8n** - Workflow automation
- **Cloudflare** - CDN + Tunnel
- **Shopee** - Affiliate program

---

## ⭐ Star if useful!

Nếu project này hữu ích, đừng quên star repo! 🌟

---

**Made with ❤️ by A.N.M Team**
