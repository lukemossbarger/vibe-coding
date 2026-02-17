# Northwestern Dining Tracker - Deployment Guide

This guide covers deploying the Northwestern Dining Tracker as a public website for multiple users.

## Architecture Overview

This application is designed from the ground up for multi-user deployment with:
- ✅ Google OAuth authentication
- ✅ User-specific data isolation
- ✅ Cross-device synchronization
- ✅ Scalable database architecture (PostgreSQL via Supabase)
- ✅ Serverless deployment ready (Next.js App Router)

---

## Deployment Options

### **Option 1: Vercel (Recommended)**

**Best for:** Quick deployment, zero configuration, automatic scaling

**Pricing:**
- **Hobby (Free):** Perfect for starting out
  - 100GB bandwidth/month
  - Unlimited personal projects
  - Automatic HTTPS
  - Support for hundreds of concurrent users
- **Pro ($20/month):** When you scale
  - 1TB bandwidth/month
  - Advanced analytics
  - Password protection
  - Support for thousands of users

**Pros:**
- Native Next.js support (zero config)
- Automatic deployments from Git
- Global CDN (fast worldwide)
- Built-in preview deployments
- Free SSL certificates

**Cons:**
- Limited customization of server config
- Cannot self-host

---

### **Option 2: Railway**

**Best for:** Full-stack apps with integrated database

**Pricing:**
- **Free Trial:** $5 credit to start
- **Developer Plan:** ~$5-20/month (pay per usage)

**Pros:**
- Can host database and app together
- Simple pricing model
- Good for hobby projects

**Cons:**
- More expensive than Vercel for high traffic
- Smaller community

---

### **Option 3: Self-Hosted (VPS)**

**Best for:** Full control, learning infrastructure

**Options:**
- DigitalOcean Droplet (~$6/month)
- AWS EC2
- Google Cloud Compute
- Linode

**Pros:**
- Complete control
- Predictable pricing
- Learn DevOps skills

**Cons:**
- Manual setup required
- You manage updates and security
- Need to configure NGINX, PM2, etc.

---

## Step-by-Step Deployment (Vercel)

### **Prerequisites**
- [ ] GitHub account
- [ ] Vercel account (free - sign up at vercel.com)
- [ ] Google Cloud Console project with OAuth credentials
- [ ] Supabase PostgreSQL database (you already have this)

### **Step 1: Prepare Your Repository**

1. **Ensure all changes are committed:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify environment variables are NOT committed:**
   - Check that `.env` is in `.gitignore`
   - Never commit API keys or secrets!

### **Step 2: Update Google OAuth for Production**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth 2.0 Client ID
3. Add production authorized redirect URIs:
   - **For Vercel:** `https://your-app-name.vercel.app/api/auth/callback/google`
   - **For custom domain:** `https://yourdomain.com/api/auth/callback/google`
4. Keep `http://localhost:3000/api/auth/callback/google` for development
5. Click "Save"

### **Step 3: Deploy to Vercel**

#### **Option A: Using Vercel Dashboard (Easiest)**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
5. Click "Deploy"

#### **Option B: Using Vercel CLI**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? (accept default or customize)
# - Directory? ./ (default)
# - Override settings? No

# Once deployed, you'll get a URL like:
# https://northwestern-dining.vercel.app
```

### **Step 4: Configure Environment Variables in Vercel**

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Environment Variables"
3. Add the following variables:

#### **Required Environment Variables:**

| Variable | Value | Where to Get It |
|----------|-------|----------------|
| `DATABASE_URL` | Your Supabase PostgreSQL connection string | Supabase Dashboard → Settings → Database |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret | Google Cloud Console → Credentials |
| `AUTH_SECRET` | The secret we generated | From your `.env` file |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | From your `.env` file |
| `OPENAI_API_KEY` | Your OpenAI API key (optional fallback) | From your `.env` file |
| `ZENROWS_API_KEY` | Your ZenRows API key for scraping | From your `.env` file |

**Important Settings:**
- Set environment variables for: **Production**, **Preview**, and **Development**
- This ensures they work across all deployment types

### **Step 5: Trigger Redeployment**

After adding environment variables:
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache" is OFF (first time)
5. Click "Redeploy"

### **Step 6: Verify Deployment**

1. Visit your deployed URL: `https://your-app.vercel.app`
2. You should be redirected to `/auth/signin`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Should redirect to `/menu` after sign-in
6. Check Supabase database for new user record:
   ```sql
   SELECT * FROM users ORDER BY "createdAt" DESC LIMIT 1;
   ```

---

## Custom Domain Setup (Optional)

### **Option A: Buy a Domain**

**Recommended Registrars:**
- [Namecheap](https://www.namecheap.com) (~$10/year)
- [Google Domains](https://domains.google) (~$12/year)
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (at-cost pricing)

**Suggested Domains:**
- `nudining.app`
- `northwestern-eats.com`
- `wildcat-dining.com`
- `nucafe.app`

### **Option B: Request Northwestern Subdomain**

Contact Northwestern IT to request:
- `dining.northwestern.edu`
- `menu.northwestern.edu`

### **Configure Custom Domain in Vercel**

1. Go to Vercel project → "Settings" → "Domains"
2. Add your domain: `yourdomain.com`
3. Vercel will provide DNS records to add:
   - **Type:** A
   - **Name:** `@`
   - **Value:** `76.76.21.21`

   OR

   - **Type:** CNAME
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com`

4. Add these records in your domain registrar's DNS settings
5. Wait for DNS propagation (5 minutes - 48 hours)
6. Update Google OAuth authorized redirect URIs with new domain

---

## Database Scaling (Supabase)

Your current Supabase free tier supports:
- **Database:** 500MB storage
- **Bandwidth:** 2GB/month
- **API Requests:** Unlimited

### **When to Upgrade:**

**Free Tier Limits:**
- ~10,000 users with basic usage
- ~50,000 meal entries
- Good for MVP and initial launch

**Pro Tier ($25/month):**
- 8GB database storage
- 50GB bandwidth
- Better support
- Upgrade when approaching limits

### **Monitor Usage:**

Check Supabase dashboard:
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to "Settings" → "Usage"
4. Set up billing alerts

---

## Monitoring & Analytics

### **Built-in Vercel Analytics (Free)**

Enable in Vercel dashboard:
1. Go to "Analytics" tab
2. Enable Web Analytics
3. Tracks page views, top pages, referrers

### **Optional: Google Analytics**

1. Create GA4 property
2. Add tracking code to `app/layout.tsx`:
   ```typescript
   <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" />
   <Script id="google-analytics">
     {`
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', 'G-XXXXXXXXXX');
     `}
   </Script>
   ```

### **Error Monitoring: Sentry (Optional)**

For production error tracking:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Security Checklist

Before going public, ensure:

- [ ] All API keys are in environment variables (not in code)
- [ ] `.env` is in `.gitignore`
- [ ] Google OAuth redirect URIs updated for production URL
- [ ] Database has user-specific data isolation (userId filtering)
- [ ] API routes are protected with authentication middleware
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] Sessions expire after reasonable time (30 days default)
- [ ] Rate limiting considered for API endpoints (optional for MVP)

---

## Legal Requirements for Public Launch

### **1. Privacy Policy (Required for Google OAuth)**

Create `/app/privacy/page.tsx`:

**Must include:**
- What data you collect (email, name, profile picture, meal data)
- How you use it (personalization, recommendations)
- How you store it (Supabase, encrypted)
- User rights (data export, deletion)
- Third-party services (Google OAuth, OpenAI/Anthropic)

**Template:** Use [Termly](https://termly.io/products/privacy-policy-generator/) or [PrivacyPolicies.com](https://www.privacypolicies.com/)

### **2. Terms of Service**

Create `/app/terms/page.tsx`:

**Must include:**
- Acceptable use policy
- User responsibilities
- Liability limitations
- Account termination clause
- Intellectual property rights

### **3. Cookie Notice**

If using analytics, add cookie banner:
```bash
npm install react-cookie-consent
```

### **4. Google OAuth App Verification**

For public launch (>100 users), submit for Google verification:
1. Go to Google Cloud Console → OAuth consent screen
2. Click "Publish App"
3. If using sensitive scopes, apply for verification
4. Fill out questionnaire
5. Verification takes 1-2 weeks

---

## Performance Optimization

### **Before Launch:**

1. **Enable Image Optimization:**
   - Already enabled by default in Next.js
   - Serves WebP format automatically

2. **Enable Caching:**
   Vercel automatically caches:
   - Static assets (CSS, JS, images)
   - API routes with cache headers

3. **Database Indexes:**
   Already included in schema:
   - `tracked_meals_user_date_idx` on userId + date
   - `tracked_meals_date_idx` on date

4. **API Response Times:**
   Monitor in Vercel dashboard → Analytics → Functions

### **After Launch:**

1. **Monitor Web Vitals:**
   - Check Vercel Analytics for Core Web Vitals
   - Target: LCP < 2.5s, FID < 100ms, CLS < 0.1

2. **Optimize Heavy Queries:**
   - If meal fetching is slow, add pagination
   - Consider caching frequently accessed menus

---

## Scaling Roadmap

### **Phase 1: MVP (0-100 users)**
- **Current Setup:** ✅
- Free tiers work perfectly
- No additional costs

### **Phase 2: Growth (100-1,000 users)**
- **Upgrade Vercel:** Pro plan ($20/month) for better analytics
- **Monitor Supabase:** Stay on free tier or upgrade if needed
- **Total Cost:** ~$20-45/month

### **Phase 3: Scale (1,000-10,000 users)**
- **Vercel:** Pro plan with higher bandwidth
- **Supabase:** Pro plan ($25/month)
- **Consider:** Redis caching for menu data (Upstash free tier)
- **Total Cost:** ~$45-100/month

### **Phase 4: Enterprise (10,000+ users)**
- **Vercel:** Enterprise plan (custom pricing)
- **Supabase:** Team or Enterprise
- **Consider:**
  - CDN for static assets
  - Dedicated database instance
  - Load balancing
- **Total Cost:** $200-1,000+/month

---

## Maintenance & Updates

### **Automated Deployments**

With Vercel connected to GitHub:
1. Push to `main` branch → auto-deploys to production
2. Push to other branches → creates preview deployment
3. Open PR → automatic preview link in PR comments

### **Database Migrations**

When updating schema:
```bash
# Make changes to lib/db/schema.ts

# Push to database
npm run db:push

# Or generate migration (recommended for production)
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

### **Rollback Strategy**

If deployment breaks:
1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Instant rollback!

---

## Support & Troubleshooting

### **Common Issues:**

**1. "Unauthorized" errors after deployment**
- Check environment variables are set correctly
- Verify Google OAuth redirect URIs include production URL
- Check AUTH_SECRET is the same as development

**2. Database connection errors**
- Verify DATABASE_URL is correct
- Check Supabase database is not paused (happens after 7 days inactive on free tier)
- Test connection from Vercel using database debugging tool

**3. OAuth redirect mismatch**
- Add production URL to Google Cloud Console
- Format: `https://yourdomain.com/api/auth/callback/google`
- No trailing slash!

### **Get Help:**

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **NextAuth Docs:** [authjs.dev](https://authjs.dev)

---

## Cost Estimate Summary

### **Minimal Launch (Free)**
- Vercel: Free
- Supabase: Free
- Domain: $10/year (optional)
- **Total: $0-10/year**

### **Growing Project (100-1000 users)**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Domain: $10/year
- **Total: ~$45/month + $10/year**

### **Popular Service (1000-10000 users)**
- Vercel Pro: $20-50/month (higher bandwidth)
- Supabase Pro: $25-100/month
- Optional CDN: $0-20/month
- **Total: ~$50-170/month**

---

## Launch Checklist

Before announcing to users:

- [ ] Deploy to Vercel
- [ ] Configure custom domain (optional)
- [ ] Test Google OAuth login flow
- [ ] Verify database connections work
- [ ] Test meal tracking end-to-end
- [ ] Add Privacy Policy page
- [ ] Add Terms of Service page
- [ ] Set up error monitoring (optional)
- [ ] Enable Vercel Analytics
- [ ] Test on mobile devices
- [ ] Test cross-device sync
- [ ] Create social media accounts (optional)
- [ ] Prepare announcement post
- [ ] Set up support email

---

## Marketing Your App (Optional)

### **Northwestern Community:**
- Post in Northwestern subreddit: r/Northwestern
- Share in class GroupMe/Discord servers
- Submit to Northwestern Daily newsletter
- Contact student newspaper (Daily Northwestern)

### **Social Media:**
- Create Instagram account
- Post screenshots and features
- Use hashtags: #Northwestern #Wildcats #NUDining

### **Feature Requests:**
- Set up GitHub Issues for bug reports
- Create feedback form (Google Forms or Typeform)
- Email: feedback@yourdomain.com

---

## Future Improvements

Once deployed and stable:

1. **Mobile App** (React Native)
   - iOS and Android apps
   - Push notifications for meal recommendations
   - Offline support

2. **Social Features**
   - Share favorite meals with friends
   - See what friends are eating
   - Meal ratings and reviews

3. **Advanced Analytics**
   - Weekly nutrition reports
   - Trend analysis
   - Meal diversity score

4. **Integration with Dining Services**
   - Official API integration
   - Real-time menu updates
   - Meal plan balance tracking

---

## Questions?

If you have questions during deployment:
1. Check Vercel deployment logs for errors
2. Review this guide's troubleshooting section
3. Check official documentation linked above
4. Open a GitHub issue in your repository

**Good luck with your launch! 🚀**
