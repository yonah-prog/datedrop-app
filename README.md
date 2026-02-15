# 🔥 DateDrop - Orthodox Jewish Dating App

> **Revolutionary AI-powered dating for the Orthodox Jewish community**
>
> Smart matching algorithm + weekly drops = meaningful connections

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-336791)
![License](https://img.shields.io/badge/License-Proprietary-red)

## Overview

DateDrop is a sophisticated dating platform that uses a comprehensive 66-question survey to match compatible Orthodox Jewish individuals. Unlike traditional swipe-based apps, DateDrop features **weekly matching events** (drops) where users are presented with curated, high-compatibility matches on Sunday mornings.

### Key Differentiators

✨ **66-Question Survey** - Deep compatibility matching based on:
- Religious practice & observance
- Hashkafa & values
- Learning, career & ambition
- Lifestyle & personality
- Marriage & family vision
- Compatibility & personal growth

🎯 **AI Matching Algorithm** - 3-tier scoring system:
- **Tier 1**: Dealbreaker filtering (non-negotiables)
- **Tier 2**: Weighted category scoring (6 categories)
- **Tier 3**: Complementarity analysis

📅 **Weekly Drops** - Matches released every Sunday at 10 AM ET
- Users opt-in proactively
- Prevents endless swiping fatigue
- One week to respond before matches expire

💬 **Secure Messaging** - Message only your matches
- Real-time message updates
- Complete message history
- Privacy: messages hidden if match denied

👥 **Community-Focused**
- Human profile moderation
- Age verification (18+)
- Identity verification via full name
- No public browsing - matches only

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **PostgreSQL** v12+ ([Download](https://www.postgresql.org/))
- **Git** ([Download](https://git-scm.com/))

### Installation (5 minutes)

```bash
# 1. Clone repository
git clone <repo-url>
cd datedrop-app

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run migrate
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` - You're ready to go! 🎉

**See [SETUP.md](./SETUP.md) for detailed instructions**

---

## 📋 Features Implemented

### ✅ Phase 1: Foundation
- User signup with email verification
- Age verification (18+ only)
- JWT authentication
- User profile management
- Profile moderation queue
- Database schema (8 tables)

### ✅ Phase 2: Survey System
- All 66 questions organized by section
- 6-section modular survey (users can resume)
- Multiple question types (Likert, multi-choice, multi-select, text)
- Importance weighting system
- Real-time progress tracking

### ✅ Phase 3: Matching Algorithm
- 3-tier compatibility scoring
- Dealbreaker filtering
- Weighted category scoring
- Scheduled weekly matching (Sunday 10 AM ET)
- 7-day match expiration
- Prevented duplicate/blocked matches

### ✅ Phase 4 & 5: Interactions & Messaging
- View active matches with public profiles
- Accept/deny matches (ends conversation)
- Send/receive messages in real-time
- Message history and threading
- Message deletion on denial (privacy)
- Drop opt-in management

### ✅ Phase 6: Production Polish
- Profile editing page
- Comprehensive setup guide
- Deployment documentation
- Production checklists
- Security hardening
- Performance optimization tips

---

## 🏗️ Architecture

### Frontend Stack
- **React 18** - UI framework
- **Vite** - Build tool (super fast ⚡)
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS3** - Modern styling

### Backend Stack
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **node-cron** - Scheduled jobs
- **bcryptjs** - Password hashing
- **JWT** - Authentication
- **nodemailer** - Email

### Database (PostgreSQL)
- `users` - User accounts with verification
- `profiles` - Location, schools, bio
- `survey_responses` - 66-Q answers
- `matches` - Compatibility pairs
- `messages` - Conversations
- `weekly_drop_events` - Drops
- `drop_opt_ins` - User preferences
- `profile_moderation` - Safety queue

---

## 📊 Project Status

| Feature | Status |
|---------|--------|
| Auth & Foundation | ✅ Complete |
| Survey System | ✅ Complete |
| Matching Algorithm | ✅ Complete |
| Messages & Interactions | ✅ Complete |
| Production Polish | ✅ Complete |
| **READY FOR DEPLOYMENT** | 🎉 **YES** |

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup & local development
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment & scaling

---

## 🔒 Security Features

- ✅ Age Verification (18+)
- ✅ Identity Verification (legal name)
- ✅ Email Verification
- ✅ Human Profile Moderation
- ✅ Password Hashing (bcryptjs)
- ✅ JWT Authentication
- ✅ SQL Injection Prevention
- ✅ XSS Protection
- ✅ Privacy Protection (message deletion)
- ✅ No Public Profiles (matches only)

---

## 🎯 Next Steps for Launch

1. **Deploy to Production** - Use DEPLOYMENT.md
2. **Set up Monitoring** - Sentry, LogRocket
3. **Configure Email** - Gmail app password
4. **Domain Setup** - SSL certificate, DNS
5. **Marketing** - Community outreach
6. **Beta Testing** - Small group testing
7. **Launch** - Public availability

---

## 📝 License

This project is **proprietary and confidential**. All rights reserved.

---

## 🙋 Support

- **Issues**: Open GitHub issue
- **Email**: dev@datedrop.com

---

**DateDrop** - *Bringing the right people together at the right time* ⏰💕

*Built with ❤️ for the Orthodox Jewish community*
