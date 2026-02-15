# DateDrop - Deployment Checklist & Production Guide

## Pre-Launch Checklist

### Security ✅

- [ ] **Environment Variables**
  - [ ] `JWT_SECRET` - Use strong random 32+ character string
  - [ ] `DB_PASSWORD` - Use strong password (16+ chars, mixed case, numbers, symbols)
  - [ ] `EMAIL_PASSWORD` - Gmail app password, NOT regular password
  - [ ] Never commit `.env` file to git

- [ ] **Database**
  - [ ] PostgreSQL password changed from default
  - [ ] Database backups configured
  - [ ] SSL/TLS connections enabled
  - [ ] Unnecessary database users removed

- [ ] **HTTPS**
  - [ ] SSL certificate installed (Let's Encrypt)
  - [ ] Automatic certificate renewal configured
  - [ ] HTTP redirects to HTTPS
  - [ ] HSTS headers enabled

- [ ] **Authentication**
  - [ ] JWT secret is unique per environment
  - [ ] Password hashing working (bcryptjs)
  - [ ] Email verification required before match access
  - [ ] Age verification (18+) enforced
  - [ ] Login rate limiting implemented

- [ ] **API Security**
  - [ ] CORS configured for your domain only
  - [ ] Rate limiting on all endpoints
  - [ ] Input validation on all forms
  - [ ] SQL injection prevention (parameterized queries)
  - [ ] XSS protection enabled
  - [ ] CSRF tokens implemented

- [ ] **User Privacy**
  - [ ] Messages deleted when match denied (implemented)
  - [ ] No public user directory
  - [ ] Passwords never logged
  - [ ] PII encryption at rest
  - [ ] GDPR compliance (data export/deletion)

### Functionality ✅

- [ ] **User Flows**
  - [ ] Signup → Email verification → Dashboard
  - [ ] Complete 66-question survey across 6 sections
  - [ ] Opt-in to weekly drops
  - [ ] View matches and respond
  - [ ] Message with matches
  - [ ] Deny matches (ends conversation)
  - [ ] Edit profile information

- [ ] **Weekly Matching**
  - [ ] Cron job scheduled for Sunday 10 AM ET
  - [ ] Matching algorithm producing results
  - [ ] Email notifications sent to matched users
  - [ ] Matches expire after 7 days
  - [ ] Opt-in resets each week

- [ ] **Messaging**
  - [ ] Real-time message polling working
  - [ ] Messages persist in database
  - [ ] Message history retrievable
  - [ ] Messages hidden when match denied
  - [ ] Timestamps accurate

- [ ] **Profile Moderation**
  - [ ] Admin can view pending profiles
  - [ ] Admin can approve/reject profiles
  - [ ] Rejected users notified
  - [ ] Fake profile detection working

### Performance ✅

- [ ] **Frontend**
  - [ ] Production build created (`npm run build`)
  - [ ] All assets minified and optimized
  - [ ] Lazy loading implemented for images
  - [ ] Bundle size < 500KB gzipped
  - [ ] Lighthouse score > 80

- [ ] **Backend**
  - [ ] Database query optimization complete
  - [ ] Indexes created on frequently queried columns
  - [ ] Connection pooling configured
  - [ ] Caching strategy implemented
  - [ ] Response times < 200ms average

- [ ] **Database**
  - [ ] Indexes on all foreign keys
  - [ ] Query plans optimized
  - [ ] Autovacuum enabled
  - [ ] WAL backups configured
  - [ ] Partition strategy for large tables

### Monitoring ✅

- [ ] **Logging**
  - [ ] Application logs to file/service (Sentry)
  - [ ] Database query logging enabled
  - [ ] API request logging implemented
  - [ ] Error tracking configured
  - [ ] Log rotation configured (7-30 days)

- [ ] **Monitoring**
  - [ ] Server health monitoring active
  - [ ] Database monitoring enabled
  - [ ] Uptime monitoring configured
  - [ ] Alert system set up
  - [ ] Dashboard created for key metrics

- [ ] **Backups**
  - [ ] Database backups automated (daily)
  - [ ] Backup testing scheduled
  - [ ] Retention policy set (30+ days)
  - [ ] Off-site backups configured
  - [ ] Recovery procedures documented

### Testing ✅

- [ ] **Manual Testing**
  - [ ] Complete user signup flow
  - [ ] Survey completion across all sections
  - [ ] Weekly drop matching working
  - [ ] Message sending/receiving
  - [ ] Profile editing
  - [ ] Match denial
  - [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
  - [ ] Mobile testing on various devices

- [ ] **Automated Testing**
  - [ ] Unit tests written and passing
  - [ ] Integration tests passing
  - [ ] API endpoint tests covering happy/sad paths
  - [ ] Database migration tests
  - [ ] E2E tests passing

- [ ] **Load Testing**
  - [ ] App tested with 100+ concurrent users
  - [ ] Database handles expected query load
  - [ ] API endpoints respond within SLA
  - [ ] No memory leaks detected

### Documentation ✅

- [ ] **Code Documentation**
  - [ ] README.md complete and up-to-date
  - [ ] SETUP.md with clear instructions
  - [ ] API documentation (comments or Swagger)
  - [ ] Database schema documented
  - [ ] Architecture diagram created

- [ ] **Operations**
  - [ ] Deployment procedures documented
  - [ ] Rollback procedures documented
  - [ ] Troubleshooting guide created
  - [ ] On-call procedures established
  - [ ] Incident response plan written

- [ ] **User Documentation**
  - [ ] Getting started guide
  - [ ] FAQ section
  - [ ] Privacy policy written
  - [ ] Terms of service written
  - [ ] Contact/support information provided

---

## Deployment Steps

### Step 1: Choose Hosting Platform

**Option A: Heroku (Easiest for beginners)**
- Pros: Easy setup, automatic scaling, managed database
- Cons: More expensive at scale, less control
- Cost: ~$25-50/month

**Option B: DigitalOcean (Good balance)**
- Pros: Affordable, full control, good documentation
- Cons: More manual setup, more ops work
- Cost: ~$10-20/month

**Option C: AWS (Most enterprise)**
- Pros: Scalable, lots of features, global
- Cons: Complex, expensive at scale, steep learning curve
- Cost: ~$50-200/month

**Option D: Docker + Docker Swarm/Kubernetes**
- Pros: Portable, scalable, modern
- Cons: Complex setup, requires DevOps knowledge
- Cost: Varies by platform

### Step 2: Prepare Code

```bash
# Ensure all tests pass
npm test

# Build frontend
cd frontend
npm run build

# Build backend (check for errors)
cd ../backend
npm start  # Then stop (Ctrl+C)

# No uncommitted changes
git status  # Should show clean working tree
```

### Step 3: Set Up Monitoring/Logging

**Option 1: Sentry (Error Tracking)**
```bash
npm install @sentry/node

# In backend/src/server.js
const Sentry = require("@sentry/node");
Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

**Option 2: LogRocket (Session Replay)**
```bash
npm install logrocket

# In frontend/src/main.jsx
import LogRocket from 'logrocket';
LogRocket.init('app-id');
```

### Step 4: Final Environment Setup

**Create production `.env`:**
```bash
# Database
DB_HOST=prod-db-hostname
DB_PORT=5432
DB_NAME=datedrop_prod
DB_USER=datedrop_prod_user
DB_PASSWORD=<strong-password>

# JWT
JWT_SECRET=<32-char-random-string>

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-app-email@gmail.com
EMAIL_PASSWORD=<app-specific-password>

# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### Step 5: Deploy

**For Heroku:**
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:standard-0
heroku config:set JWT_SECRET=...
heroku config:set EMAIL_PASSWORD=...
git push heroku main
heroku run npm run migrate
```

**For DigitalOcean:**
```bash
# SSH into droplet
ssh root@<ip-address>

# Follow SETUP.md instructions
# Then deploy with git push
git push origin main
pm2 restart datedrop-api
```

### Step 6: Post-Deployment Verification

```bash
# Check app is running
curl https://your-domain.com/health

# Verify database
psql -U datedrop_prod_user -d datedrop_prod -c "\dt"

# Check logs
pm2 logs datedrop-api

# Test authentication
# Navigate to app and signup/login

# Verify email
# Check email verification works

# Test full flow
# Complete survey, opt-in, message (if matches exist)
```

---

## Scaling Strategies

### As Traffic Grows (1K → 10K users)

1. **Database**
   - Add read replicas
   - Implement connection pooling (PgBouncer)
   - Move to managed service (AWS RDS)

2. **Caching**
   - Add Redis for sessions
   - Cache survey questions
   - Cache user profiles

3. **Message Queue**
   - Add Bull/RabbitMQ for email
   - Offload heavy computations

### As Traffic Grows (10K → 100K users)

1. **Infrastructure**
   - Containerize with Docker
   - Deploy on Kubernetes
   - Use CDN for static assets

2. **Database**
   - Implement sharding
   - Separate read/write databases
   - Archive old messages

3. **Matching Algorithm**
   - Move to Elasticsearch for faster matching
   - Implement pre-calculated scores
   - Use message queue for matching job

---

## Maintenance Tasks

### Daily
- Monitor error logs
- Check database disk space
- Verify backups completed

### Weekly
- Review application metrics
- Check user feedback/support
- Update dependencies (security patches)

### Monthly
- Full backup test (restore to staging)
- Performance review
- Update documentation
- Security audit

### Quarterly
- Major dependency updates
- Disaster recovery drill
- Capacity planning review

---

## Disaster Recovery Plan

### Database Corruption

```bash
# Restore from backup
psql -U postgres -d postgres -f backup.sql

# Verify integrity
psql -d datedrop_db -c "SELECT COUNT(*) FROM users;"
```

### Complete System Failure

1. Restore database from backup
2. Deploy application from git
3. Run migrations
4. Verify with smoke tests
5. Notify users if necessary

### Security Breach

1. Immediately rotate all secrets
2. Force password reset for all users
3. Review access logs
4. Patch vulnerability
5. Deploy updated code
6. Notify affected users
7. Document incident

---

## Monitoring Alerts

Set up alerts for:

- [ ] Database disk usage > 80%
- [ ] API response time > 500ms
- [ ] Error rate > 1%
- [ ] Server CPU > 80%
- [ ] Server memory > 85%
- [ ] Database connections > 80% of max
- [ ] Failed login attempts spike
- [ ] Weekly matching job failure

---

## Cost Optimization

1. **Database** - Use RDS Multi-AZ only for production
2. **Server** - Right-size instances, use auto-scaling
3. **Storage** - Archive old messages, delete logs after 30 days
4. **Bandwidth** - Use CDN for static assets
5. **Email** - Use transactional email service (SendGrid) instead of personal email

---

## Going Live Announcement

Once deployed:

1. Create landing page
2. Set up social media accounts
3. Write launch blog post
4. Reach out to Orthodox Jewish communities
5. Build initial user base (beta testers)
6. Gather feedback and iterate
7. Marketing campaign

---

## Support & Contact

- **Technical Support**: devops@datedrop.com
- **User Support**: support@datedrop.com
- **Emergency**: pager-duty on-call rotation

## Success Metrics

Track these KPIs:

- [ ] User signup rate
- [ ] Email verification rate
- [ ] Survey completion rate
- [ ] Weekly drop opt-in rate
- [ ] Match acceptance rate
- [ ] Message conversion rate
- [ ] User retention (weekly, monthly)
- [ ] System uptime (target: 99.9%)
- [ ] API latency (target: < 200ms)
