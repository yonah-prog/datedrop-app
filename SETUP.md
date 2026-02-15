# DateDrop App - Setup & Deployment Guide

A sophisticated Orthodox Jewish dating app with AI-powered matching and weekly drops.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Configuration](#configuration)
5. [Running the App](#running-the-app)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v18+): [Download](https://nodejs.org/)
- **PostgreSQL** (v12+): [Download](https://www.postgresql.org/download/)
- **Git**: [Download](https://git-scm.com/)
- **npm** or **yarn** (comes with Node.js)

### Verify Installation

```bash
node --version    # Should be v18 or higher
npm --version     # Should be v9 or higher
psql --version    # Should be v12 or higher
```

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd datedrop-app
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings (see Configuration section)
nano .env
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Open PostgreSQL shell
psql -U postgres

# Create database
CREATE DATABASE datedrop_db;

# Create user (if not exists)
CREATE USER datedrop_user WITH PASSWORD 'your_secure_password';

# Grant privileges
ALTER ROLE datedrop_user SET client_encoding TO 'utf8';
ALTER ROLE datedrop_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE datedrop_user SET default_transaction_deferrable TO on;
ALTER ROLE datedrop_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE datedrop_db TO datedrop_user;

# Exit psql
\q
```

### 2. Run Migrations

```bash
cd backend

# Run database migrations
npm run migrate

# You should see: "✓ Migrations completed successfully"
```

### 3. Verify Database

```bash
psql -U datedrop_user -d datedrop_db -c "\dt"

# You should see all tables listed
```

---

## Configuration

### Backend `.env` File

Create `backend/.env` with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datedrop_db
DB_USER=datedrop_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Scheduling
CRON_SCHEDULE=0 10 * * 0
TIMEZONE=America/New_York
```

### Important Notes

**JWT_SECRET:**
- Must be at least 32 characters long
- Use a random string generator: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**EMAIL_PASSWORD:**
- For Gmail, you need an [App Password](https://myaccount.google.com/apppasswords)
- NOT your regular Gmail password
- Enable 2-factor authentication first

**FRONTEND_URL:**
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

---

## Running the App

### Development Mode (Recommended for testing)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev

# Output: Server running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev

# Output: VITE v... ready in ... ms
# ➜  Local:   http://localhost:3000/
```

Visit `http://localhost:3000` in your browser.

### Production Build

**Frontend:**
```bash
cd frontend
npm run build

# Creates optimized build in dist/ folder
```

**Backend:**
```bash
cd backend
npm start

# Runs with Node.js (no auto-reload)
```

---

## Deployment

### Option 1: Heroku Deployment

#### Prerequisites
- Heroku account: [Sign up](https://www.heroku.com/)
- Heroku CLI: [Download](https://devcenter.heroku.com/articles/heroku-cli)

#### Steps

```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create your-datedrop-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASSWORD=your_app_password
heroku config:set FRONTEND_URL=https://your-datedrop-app.herokuapp.com

# Deploy backend
cd backend
git push heroku main

# Run migrations
heroku run npm run migrate

# Check logs
heroku logs --tail
```

#### Deploy Frontend

If using Heroku for frontend as well:

```bash
# Install Heroku buildpack for Node/static
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static.git

# Create static.json in frontend/
```

**Or** deploy frontend separately to Vercel/Netlify.

### Option 2: DigitalOcean Deployment

#### Prerequisites
- DigitalOcean account: [Sign up](https://www.digitalocean.com/)
- Droplet (Ubuntu 20.04, 2GB RAM minimum)

#### Setup on Droplet

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Configure PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE datedrop_db;
CREATE USER datedrop_user WITH PASSWORD 'secure_password';
ALTER ROLE datedrop_user SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE datedrop_db TO datedrop_user;
\q
```

#### Deploy Application

```bash
# Clone repo
cd /var/www
git clone <your-repo-url>
cd datedrop-app

# Setup backend
cd backend
npm install
npm run migrate

# Start with PM2
pm2 start "npm start" --name "datedrop-api"
pm2 startup
pm2 save

# Setup frontend
cd ../frontend
npm install
npm run build

# Configure Nginx
# Create /etc/nginx/sites-available/datedrop with:
# ... (see Nginx config below)
sudo ln -s /etc/nginx/sites-available/datedrop /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

#### Nginx Configuration

Create `/etc/nginx/sites-available/datedrop`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/datedrop-app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 3: Docker Deployment

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

EXPOSE 5000

CMD ["node", "backend/src/server.js"]
```

Build and run:
```bash
docker build -t datedrop-app .
docker run -p 5000:5000 -e DB_HOST=postgres datedrop-app
```

---

## Environment Variables Checklist

- [ ] `DB_HOST` - PostgreSQL host
- [ ] `DB_PORT` - PostgreSQL port (5432)
- [ ] `DB_NAME` - Database name
- [ ] `DB_USER` - Database user
- [ ] `DB_PASSWORD` - Database password
- [ ] `JWT_SECRET` - 32+ char random string
- [ ] `EMAIL_HOST` - SMTP host
- [ ] `EMAIL_PORT` - SMTP port (587)
- [ ] `EMAIL_USER` - Sender email
- [ ] `EMAIL_PASSWORD` - App-specific password
- [ ] `NODE_ENV` - development/production
- [ ] `PORT` - Backend port (5000)
- [ ] `FRONTEND_URL` - Frontend domain

---

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql

# Verify credentials in .env
```

### Email Verification Not Working

```
Error: Invalid login: 535-5.7.8 Username and password not accepted
```

**Solution:**
- Use [Gmail App Password](https://myaccount.google.com/apppasswords), not regular password
- Enable 2-factor authentication
- If using another provider, ensure credentials are correct

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

### Module Not Found

```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

### Migration Failed

```
Error: relation "users" already exists
```

**Solution:**
```bash
# Drop database and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS datedrop_db;"

# Run setup again
npm run migrate
```

---

## Performance Optimization

### Database

```sql
-- Add indexes for faster queries
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_survey_user ON survey_responses(user_id);
```

### Caching

Consider adding Redis for:
- User sessions
- Message polling
- Match cache

### CDN

Deploy static assets to CDN (Cloudflare, AWS CloudFront) for faster delivery.

---

## Monitoring & Logging

### PM2 Monitoring

```bash
pm2 monit

pm2 logs datedrop-api
```

### Database Backups

```bash
# Backup
pg_dump -U datedrop_user datedrop_db > backup.sql

# Restore
psql -U datedrop_user datedrop_db < backup.sql
```

---

## Security Checklist

- [ ] Use HTTPS in production (Let's Encrypt)
- [ ] Set strong JWT_SECRET (32+ chars)
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for your domain
- [ ] Rate limiting on API endpoints
- [ ] SQL injection protection (using parameterized queries)
- [ ] XSS protection (React sanitization)
- [ ] CSRF tokens for state-changing operations
- [ ] Password hashing (bcryptjs)
- [ ] Email verification required
- [ ] Regular security updates

---

## Support & Resources

- **Documentation**: See README.md
- **Issues**: Report bugs on GitHub
- **Email**: support@datedrop.com (update as needed)

---

## License

This project is proprietary and confidential. All rights reserved.
