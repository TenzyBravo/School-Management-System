# Deployment Guide

This guide covers deploying the School Management System to production using Render (recommended) or other platforms.

## 🚀 Quick Deploy to Render

### Option 1: Using render.yaml (Easiest)

1. **Push your code to GitHub** (already done)

2. **Create Render account**: https://render.com (free)

3. **Deploy from dashboard**:
   - Click "New" → "Blueprint"
   - Connect your GitHub repository: `TenzyBravo/School-Management-System`
   - Render will detect `render.yaml` and set up everything automatically
   - Set the root directory: `school_management`

4. **Configure environment variables**:
   - `ALLOWED_HOSTS`: Your Render URL (e.g., `your-app.onrender.com`)
   - `CORS_ALLOWED_ORIGINS`: Your frontend URL (e.g., `https://your-frontend.vercel.app`)

5. **Deploy!** Click "Apply" and wait ~5 minutes

### Option 2: Manual Setup

1. **Create PostgreSQL Database**:
   - Go to Render Dashboard → "New" → "PostgreSQL"
   - Name: `school-management-db`
   - Plan: Free
   - Copy the "Internal Database URL" (starts with `postgresql://`)

2. **Create Web Service**:
   - Go to Render Dashboard → "New" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Name**: `school-management-api`
     - **Runtime**: Python 3
     - **Build Command**: `./build.sh`
     - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
     - **Root Directory**: `school_management`

3. **Environment Variables**:
   Add these in Render dashboard:
   ```env
   SECRET_KEY=<generate-random-50-char-string>
   DJANGO_SETTINGS_MODULE=config.settings.production
   DEBUG=False
   DATABASE_URL=<paste-your-database-url>
   ALLOWED_HOSTS=your-app.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   PYTHON_VERSION=3.11.0
   ```

4. **Deploy**: Click "Create Web Service"

---

## 🎨 Deploy Frontend to Vercel

1. **Create Vercel account**: https://vercel.com (free)

2. **Import project**:
   - Click "Add New" → "Project"
   - Import from GitHub: `TenzyBravo/School-Management-System`
   - Root Directory: `school_management/frontend`

3. **Configure build settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Environment Variables**:
   ```env
   VITE_API_URL=https://your-app.onrender.com
   ```

5. **Deploy**: Click "Deploy"

6. **Update Django CORS**:
   - Go back to Render
   - Update `CORS_ALLOWED_ORIGINS` with your Vercel URL
   - Example: `https://school-management-frontend.vercel.app`

---

## 🔧 Post-Deployment Setup

### Create Superuser

1. **Via Render Shell**:
   - Go to your web service in Render
   - Click "Shell" tab
   - Run:
     ```bash
     python manage.py createsuperuser
     ```

2. **Create Test Data** (optional):
   ```bash
   python manage.py create_test_users
   ```

### Access Admin Panel

- Admin: `https://your-app.onrender.com/admin/`
- API Docs: `https://your-app.onrender.com/api/docs/`
- Frontend: `https://your-frontend.vercel.app`

---

## 📊 Database Migrations

Migrations run automatically during deployment via `build.sh`.

To run manually:
```bash
# Via Render Shell
python manage.py migrate

# Check migration status
python manage.py showmigrations
```

---

## 🔐 Security Checklist

Before going live:

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Set `DEBUG=False` in production
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Set up `CORS_ALLOWED_ORIGINS` with your frontend URL
- [ ] Enable HTTPS (automatic on Render)
- [ ] Review Django security settings in `production.py`
- [ ] Set up database backups (Render does this automatically)
- [ ] Consider adding Sentry for error tracking

---

## 🌍 Custom Domain (Optional)

### On Render:

1. Go to your web service → "Settings"
2. Scroll to "Custom Domains"
3. Click "Add Custom Domain"
4. Enter your domain (e.g., `api.yourschool.com`)
5. Update your DNS records as instructed
6. Update `ALLOWED_HOSTS` in environment variables

### On Vercel:

1. Go to your project → "Settings" → "Domains"
2. Add your custom domain
3. Update DNS records as instructed

---

## 📈 Monitoring & Logs

### View Logs on Render:

- Go to your service → "Logs" tab
- Real-time logs show requests, errors, and deployments

### Check Application Health:

- Health endpoint: `https://your-app.onrender.com/api/v1/`
- Should return API root with available endpoints

---

## 🔄 Continuous Deployment

Auto-deploy is enabled by default on Render:

1. Push changes to `main` branch
2. Render automatically detects changes
3. Runs `build.sh` (migrations + static files)
4. Restarts the service
5. Takes ~3-5 minutes

To disable auto-deploy:
- Go to service → "Settings"
- Toggle "Auto-Deploy"

---

## 🐛 Troubleshooting

### Build Fails

**Check build logs** in Render dashboard:
- Missing dependencies? Update `requirements/base.txt`
- Migration errors? Check database connection
- Permission errors? Ensure `build.sh` is executable

### 500 Internal Server Error

1. Check logs in Render dashboard
2. Verify `DATABASE_URL` is set correctly
3. Ensure migrations have run: `python manage.py migrate`
4. Check `ALLOWED_HOSTS` includes your domain

### Static Files Not Loading

1. Verify `STATIC_ROOT` is set in settings
2. Run `python manage.py collectstatic` manually
3. Check WhiteNoise is in `MIDDLEWARE`

### CORS Errors (Frontend Can't Connect)

1. Check `CORS_ALLOWED_ORIGINS` includes your frontend URL
2. Ensure URL has no trailing slash
3. Verify HTTPS is used (not HTTP)

### Database Connection Issues

1. Verify `DATABASE_URL` is correct in Render
2. Check database is running (not suspended)
3. Ensure internal connection is used (not external)

---

## 💰 Free Tier Limitations

### Render Free Tier:

- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Free PostgreSQL database (90 days, then expires if inactive)
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold start takes ~30 seconds

**Solutions**:
- Use a service like UptimeRobot to ping your app every 10 minutes
- Upgrade to paid plan ($7/month) for always-on service

### Vercel Free Tier:

- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Always on (no cold starts)
- ✅ Custom domains included

---

## 🆙 Upgrading to Paid Plans

### When to Upgrade:

- Need 24/7 uptime without cold starts
- Require more than 1 web service
- Need database backups and monitoring
- Want custom metrics and alerts

### Render Pricing:

- **Starter**: $7/month (no cold starts, 1 service)
- **Standard**: $25/month (multiple services, team features)
- **Database**: $7/month (persistent, backed up)

### Vercel Pricing:

- **Pro**: $20/month (team features, analytics)
- Frontend stays free for most use cases

---

## 📚 Additional Resources

- [Render Django Guide](https://render.com/docs/deploy-django)
- [Vercel Deployment](https://vercel.com/docs)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
- [Render Community Forum](https://community.render.com/)

---

## 🆘 Need Help?

- Check logs first (most issues are in the logs)
- Review environment variables
- Ensure all migrations are applied
- Try deploying to a test service first
- Create an issue on GitHub if stuck

---

**Ready to deploy?** Follow the "Quick Deploy to Render" section above and you'll be live in 10 minutes!
