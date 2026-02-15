# DateDrop - Heroku Deployment Guide

Complete step-by-step guide to deploy DateDrop to Heroku.

**Estimated Time**: 20-30 minutes
**Cost**: Free tier available ($0-$7/month for production)

---

## Prerequisites

Before starting, you'll need:

1. **Heroku Account** - Sign up at [heroku.com](https://www.heroku.com)
2. **Heroku CLI** - [Download and install](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git** - Already installed
4. **PostgreSQL Database** - Heroku Postgres add-on (recommended)
5. **Email Service** - Gmail app password or SendGrid account

---

## Step 1: Login to Heroku CLI

```bash
heroku login
```

This opens a browser to authenticate. Once logged in, return to terminal.

---

## Step 2: Create Heroku App

Navigate to your project root and create two Heroku apps (one for backend, one for frontend):

### Backend App
```bash
cd datedrop-app
heroku create datedrop-api --remote heroku-backend
```

Replace `datedrop-api` with a unique name (will be your backend URL).

**Output will show:**
```
Creating ⬢ datedrop-api... done
https://datedrop-api.herokuapp.com/ | https://git.heroku.com/datedrop-api.git
```

Save this URL - you'll need it for frontend configuration.

---

## Step 3: Add PostgreSQL Database

```bash
heroku addons:create heroku-postgresql:hobby-dev --app datedrop-api
```

This creates a free PostgreSQL database.

Verify it was created:
```bash
heroku pg:info --app datedrop-api
```

---

## Step 4: Configure Backend Environment Variables

Get your database URL:
```bash
heroku config:get DATABASE_URL --app datedrop-api
```

Now set all required environment variables:

```bash
heroku config:set \
  NODE_ENV=production \
  DATABASE_URL=$(heroku config:get DATABASE_URL --app datedrop-api) \
  JWT_SECRET=$(openssl rand -hex 32) \
  BACKEND_URL=https://datedrop-api.herokuapp.com \
  GMAIL_USER=your-email@gmail.com \
  GMAIL_PASSWORD=your-16-char-app-password \
  --app datedrop-api
```

**Important**:
- Replace `your-email@gmail.com` with your Gmail address
- For `GMAIL_PASSWORD`, get a 16-character app password from Google Account Settings

### Getting Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-factor authentication if needed
3. Go to "App passwords"
4. Select "Mail" and "Windows Computer"
5. Copy the 16-character password

---

## Step 5: Create Heroku Procfile for Backend

In `/backend` directory, create `Procfile`:

```bash
cat > backend/Procfile << 'EOF'
web: node src/server.js
EOF
```

---

## Step 6: Deploy Backend to Heroku

From project root:

```bash
# Make sure you're in git repo
git add .
git commit -m "Initial DateDrop commit"

# Add Heroku remote if not already added
heroku git:remote --app datedrop-api --remote heroku-backend

# Deploy backend
git push heroku-backend master
```

The deployment will take 2-3 minutes. Watch the logs:

```bash
heroku logs --tail --app datedrop-api
```

You should see:
```
Server running on port 3001
Weekly matching job initialized
```

---

## Step 7: Run Database Migrations

```bash
heroku run "cd backend && npm run migrate" --app datedrop-api
```

Verify the migration completed successfully.

---

## Step 8: Create Frontend Heroku App

```bash
heroku create datedrop-web --remote heroku-frontend
```

---

## Step 9: Set Frontend Environment Variables

```bash
heroku config:set \
  REACT_APP_API_URL=https://datedrop-api.herokuapp.com \
  --app datedrop-web
```

---

## Step 10: Create Frontend Procfile

The frontend needs a simple Node server to serve React. Create `frontend/Procfile`:

```bash
cat > frontend/Procfile << 'EOF'
web: npx serve -s dist -l $PORT
EOF
```

And add `serve` to package.json (in frontend):

```bash
cd frontend
npm install --save serve
cd ..
```

---

## Step 11: Update Frontend Build Script

In `frontend/package.json`, ensure the build script is set:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "serve": "serve -s dist",
  "preview": "vite preview"
}
```

---

## Step 12: Deploy Frontend to Heroku

```bash
# Make sure all changes are committed
git add .
git commit -m "Add Heroku deployment files"

# Deploy frontend
git push heroku-frontend master
```

This will build and deploy. Watch logs:

```bash
heroku logs --tail --app datedrop-web
```

You should see:
```
Successfully built
Launching app
```

---

## Step 13: Verify Deployment

Check that both apps are running:

```bash
heroku open --app datedrop-api
heroku open --app datedrop-web
```

**Backend**: Should show a simple message or error page (that's ok)
**Frontend**: Should show the DateDrop login page

---

## Step 14: Test the Application

1. Open frontend URL: `https://datedrop-web.herokuapp.com`
2. Sign up with test account
3. Complete survey
4. Opt-in for drops
5. Check backend logs for any errors:

```bash
heroku logs --tail --app datedrop-api
```

---

## Common Issues & Fixes

### Issue: "Application error" on page load

**Solution**: Check backend logs for errors
```bash
heroku logs --tail --app datedrop-api
```

Common causes:
- Missing environment variable
- Database migration failed
- Invalid DATABASE_URL

### Issue: API calls return 404

**Solution**: Verify frontend has correct API URL
```bash
heroku config --app datedrop-web | grep REACT_APP_API_URL
```

### Issue: Database errors in logs

**Solution**: Check database connection
```bash
heroku pg:diagnose --app datedrop-api
```

### Issue: "H10 App crashed"

**Solution**: Usually a missing dependency or syntax error
```bash
# Rebuild from scratch
heroku builds:cancel --app datedrop-api
git push heroku-backend master --force
```

---

## Scaling & Performance

### Upgrade from Free Tier

When you're ready for production traffic:

```bash
# Upgrade web dyno (from free to standard)
heroku dyno:type standard-1x --app datedrop-api
heroku dyno:type standard-1x --app datedrop-web

# Upgrade database (from hobby to standard)
heroku addons:upgrade heroku-postgresql:standard-0 --app datedrop-api
```

### Enable Autoscaling

```bash
heroku labs:enable autoscaling --app datedrop-api
```

---

## Monitoring

### View Logs

```bash
# Real-time logs
heroku logs --tail --app datedrop-api

# Last 100 lines
heroku logs -n 100 --app datedrop-api

# Specific time range
heroku logs --app datedrop-api --tail --since 1h
```

### Monitor Performance

```bash
heroku metrics --app datedrop-api
```

### Check App Status

```bash
heroku apps:info datedrop-api
heroku apps:info datedrop-web
```

---

## Scheduled Jobs (Weekly Matching)

The weekly matching job runs automatically via `node-cron` every Sunday at 10 AM ET.

To manually trigger a drop for testing:

```bash
heroku run "curl -X POST http://localhost:3001/api/match/drop/trigger" --app datedrop-api
```

Or check when the next scheduled job runs:

```bash
heroku logs --tail --app datedrop-api | grep "Weekly"
```

---

## Updating Your App

After making code changes:

```bash
# Backend changes
git add .
git commit -m "Update backend feature"
git push heroku-backend master

# Frontend changes
git add .
git commit -m "Update frontend feature"
git push heroku-frontend master
```

---

## SSL Certificate (HTTPS)

Heroku provides free SSL certificates automatically for `.herokuapp.com` domains.

For custom domain:
```bash
heroku domains:add www.datedrop.com --app datedrop-web
heroku domains:add api.datedrop.com --app datedrop-api

# Enable automatic SSL
heroku labs:enable http-session-affinity --app datedrop-web
heroku labs:enable http-session-affinity --app datedrop-api
```

---

## Custom Domain Setup

1. Register domain (e.g., GoDaddy, Namecheap)
2. Add to Heroku:

```bash
heroku domains:add datedrop.com --app datedrop-web
heroku domains:add api.datedrop.com --app datedrop-api
```

3. Update DNS provider with Heroku nameservers
4. Wait for propagation (can take 24-48 hours)

---

## Cleanup / Removal

To delete your apps:

```bash
heroku apps:destroy --app datedrop-api
heroku apps:destroy --app datedrop-web
```

---

## Next Steps

After deployment:

1. ✅ Test signup → survey → matching → messaging flow
2. ✅ Monitor logs for 24 hours
3. ✅ Set up monitoring/alerts (Sentry, New Relic)
4. ✅ Enable error tracking
5. ✅ Set up automated backups for database
6. ✅ Create admin user for profile moderation
7. ✅ Beta test with small user group
8. ✅ Marketing & launch

---

## Support

**Heroku Documentation**: https://devcenter.heroku.com/
**Heroku Status**: https://status.heroku.com/
**Heroku Support**: https://help.heroku.com/

For issues with DateDrop app logic, see SETUP.md and DEPLOYMENT.md

---

**🎉 Your app is now live!**

Track your live users and metrics in the Heroku dashboard.
