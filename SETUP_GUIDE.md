# 🚀 Hướng dẫn Setup React App với Shopee Affiliate Tracking

## 📋 Tổng quan

Bạn đã có giao diện React từ AI Studio. Tôi đã bổ sung:

✅ **n8n Webhook Service** - Gọi API n8n để lấy download link
✅ **Shopee Affiliate Tracking** - Iframe tracking để kiếm hoa hồng
✅ **Enhanced App Logic** - Flow hoàn chỉnh: Analyze → Affiliate Track → Download
✅ **Updated UI Components** - Hiển thị download links thực tế

---

## 📁 Files đã tạo/cập nhật

### ✅ **New Services**

| File | Mô tả |
|------|-------|
| `services/n8nService.ts` | Gọi n8n webhook để lấy download link |
| `services/affiliateService.ts` | Shopee affiliate tracking utilities |

### ✅ **New Components**

| File | Mô tả |
|------|-------|
| `components/ShopeeAffiliate.tsx` | Component hiển thị Shopee iframe |
| `components/ResultList_Enhanced.tsx` | ResultList với download button thực sự |

### ✅ **Enhanced Files**

| File | Mô tả |
|------|-------|
| `App_Enhanced.tsx` | App.tsx với n8n + affiliate integration |
| `types.ts` | Updated với downloadUrl, quality, errorMessage |

### ✅ **Config Files**

| File | Mô tả |
|------|-------|
| `.env.example` | Environment variables template |

---

## 🔧 Setup Steps

### Bước 1: Cài đặt dependencies (nếu chưa)

```bash
cd "I:\Workflow\n8n\Workflow\Backups\web-fontend-v2"

# Install dependencies
npm install
```

### Bước 2: Thay thế files

#### 2.1. Backup files cũ

```bash
# Backup App.tsx gốc
copy App.tsx App.tsx.backup

# Backup ResultList.tsx gốc
copy components\ResultList.tsx components\ResultList.tsx.backup
```

#### 2.2. Thay thế bằng enhanced versions

```bash
# Replace App.tsx
copy App_Enhanced.tsx App.tsx

# Replace ResultList.tsx
copy components\ResultList_Enhanced.tsx components\ResultList.tsx
```

#### 2.3. Verify imports

Mở `App.tsx` và kiểm tra các imports, đảm bảo:

```typescript
import ShopeeAffiliate from './components/ShopeeAffiliate';
import { enrichResultWithDownload } from './services/n8nService';
import { isShopeeUrl } from './services/affiliateService';
```

---

### Bước 3: Cấu hình Environment Variables

#### 3.1. Tạo file .env.local

```bash
copy .env.example .env.local
```

#### 3.2. Sửa .env.local

Mở `.env.local` và điền các giá trị:

```env
# n8n Webhook URL (sau khi setup Cloudflare Tunnel)
VITE_N8N_WEBHOOK_URL=https://your-domain.com/webhook/shopee-download

# Shopee Affiliate (lấy từ https://affiliate.shopee.vn)
VITE_SHOPEE_SITE_ID=an1234
VITE_SHOPEE_PARTNER_ID=567890
```

**Lưu ý:** Nếu chưa có thông tin, tạm thời để giá trị mặc định, sẽ cập nhật sau.

---

### Bước 4: Test Local

```bash
npm run dev
```

Mở browser: `http://localhost:5173` (hoặc port Vite chỉ định)

**Test flow:**

1. Paste link Shopee video
2. Click "Download"
3. Kiểm tra:
   - ✅ Gemini analyze link → Hiện result card
   - ✅ Shopee iframe hiển thị (nếu là Shopee)
   - ⚠️ Download link sẽ fail (vì chưa setup n8n webhook)

---

## 🔗 Setup Backend (n8n + Cloudflare Tunnel)

### Bước 5: Import n8n Workflow

1. Mở n8n UI: `http://localhost:5678`
2. Import file: `../Shopee Web Download API.json`
3. Click **Active** để enable workflow
4. Copy **Production Webhook URL**

### Bước 6: Setup Cloudflare Tunnel

Follow hướng dẫn trong folder `web-frontend/`:

1. **Deploy frontend:** `CLOUDFLARE_PAGES_SETUP.md`
2. **Setup tunnel:** `CLOUDFLARE_TUNNEL_SETUP.md`

Sau khi setup xong, bạn sẽ có:
- Frontend URL: `https://your-project.pages.dev`
- Webhook URL: `https://your-domain.com/webhook/shopee-download`

### Bước 7: Update .env.local

```env
VITE_N8N_WEBHOOK_URL=https://your-domain.com/webhook/shopee-download
```

**Rebuild app:**

```bash
npm run build
```

---

## 🛍️ Setup Shopee Affiliate

### Bước 8: Đăng ký Shopee Affiliate

1. Truy cập: https://affiliate.shopee.vn
2. Đăng nhập và đăng ký chương trình
3. Chờ duyệt (1-3 ngày)

### Bước 9: Lấy Affiliate Params

Sau khi được duyệt:

1. Vào **Settings** → **Site Information** → Lấy **Site ID**
2. Vào **Account** → Lấy **Partner ID**

### Bước 10: Update .env.local

```env
VITE_SHOPEE_SITE_ID=an1234     # ✏️ Thay bằng Site ID của bạn
VITE_SHOPEE_PARTNER_ID=567890  # ✏️ Thay bằng Partner ID của bạn
```

---

## 📦 Deploy lên Production

### Bước 11: Push to GitHub

```bash
git add .
git commit -m "Add Shopee affiliate tracking & n8n integration"
git push
```

### Bước 12: Cloudflare Pages Auto Deploy

Cloudflare Pages sẽ tự động:
1. Detect push
2. Build project: `npm run build`
3. Deploy lên CDN

**Check deployment:**
- Vào Cloudflare Pages Dashboard
- Xem build logs
- Test URL live: `https://your-project.pages.dev`

---

## 🧪 Test End-to-End

### Test 1: Local (với mock data)

```bash
npm run dev
```

1. Paste: `https://shopee.vn/video/test123`
2. Gemini analyze → Hiện result
3. Shopee iframe load (nếu có internet)
4. Download button sẽ fail (chưa có n8n)

### Test 2: Production (full flow)

1. Truy cập: `https://your-project.pages.dev`
2. Paste real Shopee video URL
3. Kiểm tra:
   - ✅ Iframe hiện sản phẩm Shopee
   - ✅ Sau 2-3s, hiện "Đang lấy link download..."
   - ✅ n8n webhook trả về download link
   - ✅ Button "Tải xuống" active
   - ✅ Click download → Video tải về

---

## 🔍 Troubleshooting

### Issue 1: TypeScript errors

```bash
# Clear cache
rm -rf node_modules .vite
npm install
npm run dev
```

### Issue 2: Import errors

Kiểm tra các imports trong `App.tsx`:

```typescript
// Phải có đủ các imports này
import ShopeeAffiliate from './components/ShopeeAffiliate';
import { enrichResultWithDownload } from './services/n8nService';
import { isShopeeUrl } from './services/affiliateService';
```

### Issue 3: Env variables không load

```bash
# Restart dev server
# Ctrl+C to stop
npm run dev
```

Đảm bảo biến bắt đầu bằng `VITE_`:

```env
✅ VITE_N8N_WEBHOOK_URL=...
❌ N8N_WEBHOOK_URL=...
```

### Issue 4: CORS errors khi gọi n8n

n8n workflow đã có CORS headers. Nếu vẫn lỗi:

1. Check Cloudflare Tunnel config
2. Verify n8n workflow active
3. Test webhook với Postman

### Issue 5: Affiliate iframe không load

- Safari/Firefox strict mode có thể block
- Private/Incognito mode không set cookie
- Ad blocker có thể chặn

**Giải pháp:** Thêm fallback text trong component.

---

## 📊 Monitoring

### Check Shopee Affiliate Performance

1. Vào: https://affiliate.shopee.vn/dashboard
2. Metrics:
   - Clicks (lượt click iframe)
   - Orders (đơn hàng phát sinh)
   - Revenue (doanh thu)
   - Commission (hoa hồng)

### Check n8n Executions

1. Vào n8n UI: `http://localhost:5678`
2. Tab **Executions**
3. Filter by:
   - Status: Success/Error
   - Workflow: "Shopee Web Download API"
   - Time range

### Check Cloudflare Analytics

1. Cloudflare Pages Dashboard
2. Analytics tab:
   - Page views
   - Unique visitors
   - Bandwidth
   - Geographic data

---

## 🎯 Next Steps

### Immediate

- [ ] Test local với mock Shopee URL
- [ ] Setup n8n workflow
- [ ] Setup Cloudflare Tunnel
- [ ] Deploy to production
- [ ] Test end-to-end

### Short-term

- [ ] Add error boundaries
- [ ] Improve loading states
- [ ] Add analytics (Google Analytics)
- [ ] Mobile optimization

### Long-term

- [ ] Support more platforms (TikTok, FB)
- [ ] Batch download
- [ ] Download history
- [ ] User accounts

---

## 📚 Related Docs

| Doc | Location |
|-----|----------|
| Cloudflare Pages Setup | `../web-frontend/CLOUDFLARE_PAGES_SETUP.md` |
| Cloudflare Tunnel Setup | `../web-frontend/CLOUDFLARE_TUNNEL_SETUP.md` |
| Shopee Affiliate Guide | `../web-frontend/SHOPEE_AFFILIATE_SETUP.md` |
| Quick Reference | `../web-frontend/QUICK_REFERENCE.md` |

---

## ✅ Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Files replaced (App.tsx, ResultList.tsx)
- [ ] .env.local created and configured
- [ ] Local test passed (Gemini analysis works)
- [ ] n8n workflow imported and active
- [ ] Cloudflare Tunnel setup
- [ ] Environment variables updated with real URLs
- [ ] Production test passed (full flow works)
- [ ] Shopee affiliate approved and configured
- [ ] Analytics setup

---

## 🎉 Hoàn thành!

Bạn đã có:
✅ React app với UI đẹp từ AI Studio
✅ Shopee affiliate tracking
✅ n8n backend integration
✅ Cloudflare CDN deployment
✅ Miễn phí 100%

**Bắt đầu kiếm tiền từ Shopee affiliate! 💰**

---

**Có vấn đề? Check:**
1. Console logs (F12)
2. Network tab (API calls)
3. n8n executions log
4. Cloudflare Tunnel status
