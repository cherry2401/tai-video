# ✅ Integration Checklist - Shopee Affiliate + n8n

## 📝 Files to Replace/Update

### Step 1: Backup Original Files

```bash
cd "I:\Workflow\n8n\Workflow\Backups\web-fontend-v2"

# Backup originals
copy App.tsx App.tsx.backup
copy components\ResultList.tsx components\ResultList.tsx.backup
```

### Step 2: Replace with Enhanced Versions

```bash
# Replace App.tsx
copy App_Enhanced.tsx App.tsx

# Replace ResultList
copy components\ResultList_Enhanced.tsx components\ResultList.tsx
```

---

## 🔧 Configuration

### Step 3: Create .env.local

```bash
copy .env.example .env.local
notepad .env.local
```

**Điền các giá trị:**

```env
VITE_N8N_WEBHOOK_URL=https://your-domain.com/webhook/shopee-download
VITE_SHOPEE_SITE_ID=your_site_id
VITE_SHOPEE_PARTNER_ID=your_partner_id
```

---

## 🧪 Testing

### Step 4: Test Local

```bash
npm install   # Nếu chưa install
npm run dev
```

**Browser:** http://localhost:5173

**Test cases:**

- [ ] Paste Shopee URL → Gemini analyze works
- [ ] Shopee iframe hiển thị (if có internet)
- [ ] Download button hiện (sẽ fail nếu chưa setup n8n)

---

## 🔗 Backend Setup

### Step 5: Import n8n Workflow

1. Mở n8n: http://localhost:5678
2. Import: `../Shopee Web Download API.json`
3. Click **Active**
4. Copy webhook URL

### Step 6: Update .env.local

```env
VITE_N8N_WEBHOOK_URL=<webhook_url_từ_n8n>
```

```bash
# Restart dev server
npm run dev
```

### Step 7: Test với n8n

- [ ] Paste Shopee URL
- [ ] Gemini analyze
- [ ] Iframe load
- [ ] n8n được gọi (check n8n executions)
- [ ] Download link trả về
- [ ] Download button active

---

## 🚀 Deploy

### Step 8: Setup Cloudflare Tunnel

Follow: `../web-frontend/CLOUDFLARE_TUNNEL_SETUP.md`

```powershell
cloudflared tunnel login
cloudflared tunnel create n8n-tunnel
# ... setup config.yml
cloudflared service install
sc start cloudflared
```

### Step 9: Deploy Frontend

```bash
# Push to GitHub
git add .
git commit -m "Add Shopee affiliate + n8n integration"
git push

# Cloudflare Pages auto-deploy
```

### Step 10: Update Production .env

Vào Cloudflare Pages → Settings → Environment Variables

Add:

```
VITE_N8N_WEBHOOK_URL=https://your-domain.com/webhook/shopee-download
VITE_SHOPEE_SITE_ID=your_site_id
VITE_SHOPEE_PARTNER_ID=your_partner_id
```

**Redeploy** sau khi add env vars.

---

## 🛍️ Shopee Affiliate

### Step 11: Đăng ký Shopee Affiliate

1. https://affiliate.shopee.vn
2. Đăng ký
3. Chờ duyệt (1-3 ngày)

### Step 12: Lấy Site ID + Partner ID

1. Dashboard → Settings → Site ID
2. Account → Partner ID

### Step 13: Update .env

Local:

```bash
# .env.local
VITE_SHOPEE_SITE_ID=an1234
VITE_SHOPEE_PARTNER_ID=567890
```

Production:

```
Cloudflare Pages → Environment Variables → Update
```

---

## ✅ Final Checklist

### Local Development

- [ ] npm install completed
- [ ] App.tsx replaced
- [ ] ResultList.tsx replaced
- [ ] .env.local created
- [ ] Dev server runs (npm run dev)
- [ ] Gemini analysis works
- [ ] Shopee iframe loads

### Backend

- [ ] n8n workflow imported
- [ ] Workflow activated
- [ ] Webhook URL copied
- [ ] .env.local updated với webhook URL
- [ ] n8n responds to requests

### Cloudflare

- [ ] Tunnel created
- [ ] Tunnel config.yml setup
- [ ] Tunnel service running
- [ ] DNS routed
- [ ] n8n accessible via tunnel

### Production

- [ ] Code pushed to GitHub
- [ ] Cloudflare Pages connected
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Live URL works

### Shopee Affiliate

- [ ] Account approved
- [ ] Site ID obtained
- [ ] Partner ID obtained
- [ ] .env updated (local + production)
- [ ] Iframe loads products correctly

### End-to-End Test

- [ ] Paste Shopee video URL
- [ ] Gemini analyzes platform
- [ ] Iframe shows Shopee product (2-3s)
- [ ] n8n webhook called
- [ ] Download link received
- [ ] Download button active
- [ ] Video downloads successfully
- [ ] Shopee affiliate dashboard shows clicks

---

## 🎯 Success Criteria

Khi tất cả checkbox trên đều ✅:

✅ **Local development** works
✅ **n8n backend** responds
✅ **Cloudflare deployment** live
✅ **Shopee affiliate** tracking
✅ **End-to-end** download flow

🎉 **Congratulations! You're ready to make money!** 💰

---

## 📞 Need Help?

### Debug Steps

1. **Check browser console** (F12)
2. **Check Network tab** (API calls)
3. **Check n8n executions log**
4. **Check Cloudflare Tunnel** status: `cloudflared tunnel list`

### Common Issues

| Issue | Fix |
|-------|-----|
| TypeScript errors | `rm -rf node_modules && npm install` |
| Env vars not loading | Restart dev server |
| CORS errors | Check n8n CORS headers |
| Iframe blocked | Test in different browser |
| Download fails | Check n8n workflow active |

### Documentation

- `SETUP_GUIDE.md` - Full setup guide
- `.env.example` - Config template
- `../web-frontend/CLOUDFLARE_TUNNEL_SETUP.md` - Tunnel guide

---

**Last updated:** 2024
**Version:** 2.0 (with n8n + Shopee Affiliate)
