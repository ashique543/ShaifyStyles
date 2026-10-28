# 🌸 Shaify Styles — Full-Stack E-Commerce Platform

[![Instagram](https://img.shields.io/badge/Instagram-%40shaifystyles__-E4405F?logo=instagram&logoColor=white)](https://instagram.com/shaifystyles_)
[![Frontend](https://img.shields.io/badge/Frontend-Angular%20Standalone-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![Backend](https://img.shields.io/badge/Backend-Python%20Flask-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Payments](https://img.shields.io/badge/Payments-Razorpay-0C2340?logo=razorpay&logoColor=blue)](https://razorpay.com)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)

An elegant, full-stack boutique e-commerce web platform for **"Shaify Styles"** ([@shaifystyles_](https://instagram.com/shaifystyles_)) specializing in:
- **Modest Fashion**: Pakistani luxury lawn suits, ceremonial farshi gharara ensembles, and daily Lucknowi Chikankari kurtis.
- **Handcrafted Hijab Bouquets**: Signature blooming rose hijab arrangements crafted with modal & silk georgette hijabs, pearl pins, and dried baby's breath.
- **Custom Gift Hampers**: Bespoke bridal keepsakes, Eid celebration boxes, and self-care trunks.

---

## 🎨 Brand Aesthetic & Design System

- **Color Palette**: Warm boutique luxury neutrals — Cream (`#FAF7F2`), Deep Rose (`#A3485E`), Muted Gold (`#C5A059`), and Charcoal (`#252021`).
- **Typography**: Google Fonts *Playfair Display* (luxury editorial serif headings) paired with *Plus Jakarta Sans* (clean readable sans-serif).
- **Features**: Announcement banner, interactive category chips, real-time search, responsive product cards, WhatsApp direct inquiries, cart drawer with free shipping progress bar, and Razorpay modal checkout.

---

## 🏗️ Project Architecture

```
ecommerce/
├── backend/                  # Python Flask REST API
│   ├── app/
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── products.py   # Product list, category filter, search, sort
│   │   │   └── orders.py     # Razorpay order create, signature verification
│   │   ├── __init__.py       # App factory, CORS, DB init, auto-seed
│   │   ├── config.py         # Config with PostgreSQL/SQLite fallback
│   │   ├── models.py         # Product, Order, OrderItem SQLAlchemy models
│   │   └── seed.py           # Initial boutique catalog seed data
│   ├── .env.example          # Sample environment variables
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # Server entry point
│
├── frontend/                 # Angular Standalone Web App
│   ├── public/
│   │   └── assets/images/    # Generated boutique hero & product photography
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── navbar/                     # Announcement bar & header
│   │   │   │   ├── hero/                       # Hero section with value props
│   │   │   │   ├── product-card/               # Product card with badges
│   │   │   │   ├── product-details-modal/      # Size selector, WhatsApp inquiry
│   │   │   │   ├── cart-drawer/                # Slide-in bag, shipping form, Razorpay
│   │   │   │   ├── order-confirmation-modal/   # Receipt screen with WhatsApp tracking
│   │   │   │   └── footer/                     # Boutique footer & policies
│   │   │   ├── models/                         # TypeScript interfaces
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts              # REST API client
│   │   │   │   └── cart.service.ts             # Signal-based cart & localStorage
│   │   │   ├── app.ts                          # Main application component
│   │   │   ├── app.html                        # Main template
│   │   │   └── app.css                         # App-specific styles
│   │   ├── index.html                          # Fonts, SEO, and Razorpay script
│   │   └── styles.css                          # Global design system & utilities
│   └── package.json
│
├── .env.example              # Workspace environment template
└── README.md                 # Full documentation
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Python 3.10+** (tested on 3.14)
- **Node.js v18+** & **npm**

### 2. Backend Setup
```bash
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env if you wish to configure real Razorpay keys or PostgreSQL

# Run the Flask API server (auto-creates tables and seeds catalog)
python run.py
```
The Flask API will start at: `http://127.0.0.1:5000`

### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start the Angular development server
npm start
```
The Angular boutique storefront will be live at: `http://localhost:4200`

---

## 💳 Razorpay Payment Flow & Demo Mode

The platform integrates the **Razorpay Payment Gateway**:

1. **Production / Live Testing Mode**:
   Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
   When customers click **"Pay via Razorpay"**, the official Razorpay Checkout popup opens allowing payments via:
   - UPI (Google Pay, PhonePe, Paytm, BHIM)
   - Credit & Debit Cards (Visa, Mastercard, RuPay)
   - NetBanking (All major Indian banks)
   - Wallets & PayLater

2. **Simulated / Dev Demo Mode**:
   If dummy keys or no keys are configured in `.env`, the platform automatically switches to **Demo Mode**. You can place orders, receive simulated payment IDs, verify signatures, decrement inventory, and view the receipt without needing live banking credentials.

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status, DB connection, and brand info |
| `GET` | `/api/products` | Query products (`?category=...&search=...&sort=price_asc\|price_desc\|newest`) |
| `GET` | `/api/products/<id>` | Retrieve detailed product information |
| `GET` | `/api/products/categories` | Retrieve available categories |
| `POST` | `/api/orders/create` | Calculate server-side total, initialize Razorpay order, save pending order |
| `POST` | `/api/orders/verify` | Verify Razorpay HMAC SHA256 signature, mark order as "paid", decrement stock |
| `GET` | `/api/orders/<id>` | Fetch order receipt and delivery details |

---

## 🚢 Deployment Guide

### Deploying the Backend (Render / Railway)

#### Option A: Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT "app:create_app()"`
4. Add Environment Variables in Render:
   - `DATABASE_URL`: Your PostgreSQL connection string (Render auto-provides this if you add a Render PostgreSQL database)
   - `RAZORPAY_KEY_ID`: `rzp_live_...` or `rzp_test_...`
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Secret
   - `FLASK_ENV`: `production`

#### Option B: Railway
1. Create a new project on [Railway](https://railway.app).
2. Provision a **PostgreSQL** service and a **Python** service connected to `/backend`.
3. Railway automatically sets `DATABASE_URL` from the provisioned PostgreSQL instance.
4. Set the start command to `gunicorn -w 4 -b 0.0.0.0:$PORT "app:create_app()"`.

---

### Deploying the Frontend (Vercel / Netlify)

#### Option A: Vercel
1. Import your repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Angular`.
4. Build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/frontend/browser`
5. Environment Variables:
   - If hosting backend on a separate domain, configure the API proxy in `vercel.json` or update `ApiService.baseUrl`.

#### Option B: Netlify
1. Create a new site from Git on [Netlify](https://netlify.com).
2. Set base directory to `frontend`.
3. Build command: `npm run build`
4. Publish directory: `frontend/dist/frontend/browser`

---

## 💬 WhatsApp Boutique Integration

Every product card and details modal includes a dynamic **"Inquire on WhatsApp"** link:
- Prefills the WhatsApp message with the product title, selected size, and price.
- Connects directly to the Shaify Styles team (`@shaifystyles_`) for bespoke color requests, ribbon customizations, and personalized greeting cards.
