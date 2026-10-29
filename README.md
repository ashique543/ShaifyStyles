# 🌸 Shaify Styles — Full-Stack E-Commerce & Boutique Management Platform

[![Instagram](https://img.shields.io/badge/Instagram-%40shaifystyles__-E4405F?logo=instagram&logoColor=white)](https://instagram.com/shaifystyles_)
[![Frontend](https://img.shields.io/badge/Frontend-Angular%20Standalone-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![Backend](https://img.shields.io/badge/Backend-Python%20Flask-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Payments](https://img.shields.io/badge/Payments-Razorpay-0C2340?logo=razorpay&logoColor=blue)](https://razorpay.com)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Admin](https://img.shields.io/badge/Admin%20Panel-JWT%20Secured-7B1FA2?logo=jsonwebtokens&logoColor=white)](http://localhost:4200/admin/login)

A comprehensive, full-stack boutique e-commerce platform and dedicated Store Owner Admin Panel for **"Shaify Styles"** ([@shaifystyles_](https://instagram.com/shaifystyles_)), specializing in:
- **Modest Fashion**: Pakistani luxury lawn suits, ceremonial farshi gharara ensembles, and authentic Lucknowi Chikankari kurtis.
- **Handcrafted Hijab Bouquets**: Signature blooming rose hijab arrangements folded with premium georgette and modal hijabs, pearl pins, and dried baby's breath.
- **Custom Gift Hampers**: Bespoke bridal keepsake trunks, Eid celebration boxes, and personalized greeting notes.

---

## 🎨 Design System & Aesthetics

- **Color Palette**: Luxury rose wine (`#A3485E`), dark burgundy (`#873649`), champagne gold (`#C5A059`), warm cream (`#FAF7F2`), and deep charcoal (`#252021`).
- **Typography**: Google Fonts *Playfair Display* (luxury editorial serif headings) paired with *Plus Jakarta Sans* (clean modern sans-serif body).
- **Clean Architecture**: Clean separation of concerns with standalone HTML templates, TypeScript logic classes, and a unified global design system in `styles.css`.

---

## ✨ Key Features

### 🛍️ Customer Boutique Storefront (`/`)
1. **Customer Authentication (Google Sign-In & Mobile OTP)**:
   - **Mobile OTP**: Fast 10-digit phone verification with SMS gateway integration (Fast2SMS / Twilio) or auto-generated simulation code (`123456`).
   - **Google Sign-In**: Instant one-click Google OAuth 2.0 authentication or quick demo profile testing.
   - **Persistent Shopper Session**: 30-day token storage and automatic checkout address pre-filling.
   - **Customer "My Orders" History & Live Stepper**: 5-stage visual progress timeline (`Placed` ➔ `Paid` ➔ `Packing` ➔ `In Transit` ➔ `Delivered`), direct Courier AWB live tracking button, and **1-Click "Download Invoice (PDF)"**.
2. **Interactive Catalog & Dynamic Collections**: Filter by category chips fetched dynamically from the database (`GET /api/categories`), instant keyword search, and sorting.
3. **Product Details Modal**: High-res imagery, fabric details, size/style selector, inventory availability, and pre-filled WhatsApp inquiry links.
4. **Slide-in Cart Drawer & Promo Coupons**:
   - Real-time quantity adjustment, free shipping threshold progress tracker.
   - **Coupon Discount Input**: Validates promo codes in real time with instant cart subtotal discount calculation (`POST /api/coupons/validate`).
   - Delivery address form with auto-fill.
5. **Razorpay Payment Gateway**: Seamless integration supporting UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, NetBanking, and a simulated fallback demo mode.
6. **Order Confirmation & Tracking**: Receipt modal with unique Order IDs (`#SS-xxx`) and direct one-click WhatsApp order tracking.

### 🛡️ Store Owner Admin Panel (`/admin`)
1. **JWT-Secured Authentication**: Protected routes via Angular `authGuard` and Flask-JWT-Extended backend authorization.
2. **Live Sales Dashboard**: KPI metric cards for Total Revenue, Total Orders, Pending Dispatches, and Low Stock inventory alerts.
3. **Product Management**: Full CRUD operations with dynamically populated category selectors from the database.
4. **🏷️ Dynamic Category Management (`/admin/categories`)**:
   - Create, edit, toggle visibility, and delete collections with custom emoji icons (`👗`, `🌹`, `🎁`, etc.), slug URLs, descriptions, and display sorting.
   - Instant synchronization with customer storefront tabs without redeploying code.
5. **🎟️ Promo Coupons Engine (`/admin/coupons`)**:
   - Manage discount codes (Percentage `% OFF` or Flat `₹ OFF`), minimum order threshold, usage caps, and active/pause toggles.
6. **🧾 Order Fulfillment & Professional PDF Bill Generator (`/admin/orders`)**:
   - Filter orders by status, customer phone, or date range.
   - Status transitions (`created` ➔ `paid` ➔ `processing` ➔ `shipped` ➔ `delivered`), assign courier partner & AWB consignment numbers.
   - **1-Click "Download Bill (PDF)"**: Generates branded tax invoices via ReportLab with boutique logo, customer address, itemized line totals, coupons, and tracking barcode info.
   - **1-Click "Print Bill"**: Print-ready warehouse slip formatting for thermal or A4 printing.
7. **One-Click WhatsApp Dispatch**: Generates pre-formatted WhatsApp customer dispatch messages with tracking info and order details ready to send.
8. **🚀 In-App Deployment & Health Center (`/admin/deployment`)**:
   - Live system status matrix (Database, Razorpay, Google OAuth, SMS OTP, Cloudinary, WSGI).
   - Copyable guides and commands for Render, Railway, Vercel, Netlify, and managed PostgreSQL (Neon / Supabase).
   - One-click copyable production environment variables generator.

---

## 🔑 Default Admin Credentials

| Field | Value |
|---|---|
| **Admin Login URL** | [http://localhost:4200/admin/login](http://localhost:4200/admin/login) |
| **Username** | `admin` |
| **Password** | `admin123` |
| **Email** | `admin@shaifystyles.com` |

> [!TIP]
> You can also create additional admin accounts using the Flask CLI:
> ```bash
> cd backend
> flask create-admin --username owner --email owner@shaifystyles.com
> ```

---

## 🏗️ Project Architecture

```
ecommerce/
├── backend/                              # Python Flask REST API
│   ├── app/
│   │   ├── controllers/                  # Controller layer: Blueprints & API endpoints
│   │   │   ├── admin_controller.py       # Admin auth, dashboard metrics, orders, PDF bills
│   │   │   ├── auth_controller.py        # Customer Google & phone OTP authentication
│   │   │   ├── category_controller.py    # Public & admin category endpoints
│   │   │   ├── coupon_controller.py      # Promo code validation & admin CRUD
│   │   │   ├── order_controller.py       # Checkout intent, Razorpay verify, customer invoice
│   │   │   └── product_controller.py     # Product catalog query & filter
│   │   ├── services/                     # Service layer: Business & checkout domain logic
│   │   │   ├── admin_service.py          # Dashboard analytics & system diagnostics
│   │   │   ├── auth_service.py           # OTP dispatch & JWT issuance
│   │   │   ├── category_service.py       # Taxonomy business rules
│   │   │   ├── coupon_service.py         # Discount validation & usage counting
│   │   │   ├── order_service.py          # Checkout verification & inventory reservation
│   │   │   ├── pdf_service.py            # ReportLab branded invoice PDF generator
│   │   │   └── product_service.py        # Catalog search & filtering
│   │   ├── repositories/                 # Repository layer: All SQLAlchemy database operations
│   │   │   ├── base_repository.py        # Generic BaseRepository with CRUD helpers
│   │   │   ├── admin_repository.py       # Admin credentials queries
│   │   │   ├── category_repository.py    # Category taxonomy queries & auto-seeding
│   │   │   ├── coupon_repository.py      # Promo code lookups & usage increments
│   │   │   ├── order_repository.py       # Orders & order items multi-record transactions
│   │   │   ├── otp_repository.py         # Phone OTP expiry management
│   │   │   ├── product_repository.py     # Product catalog queries & stock decrementing
│   │   │   └── user_repository.py        # Customer profile records
│   │   ├── __init__.py                   # App factory, blueprints, migrations, auto-seed
│   │   ├── config.py                     # PostgreSQL/SQLite configuration & JWT secret
│   │   ├── models.py                     # SQLAlchemy models: Product, Order, Category, Coupon, Admin
│   │   └── seed.py                       # Initial product catalog seed data
│   ├── uploads/                          # Local image upload storage
│   ├── .env.example                      # Sample backend environment variables
│   ├── requirements.txt                  # Python dependencies (ReportLab, Flask-SQLAlchemy, etc.)
│   └── app.py                            # Flask server runner (python app.py)
│
├── frontend/                             # Angular Standalone Web App
│   ├── public/
│   │   └── assets/images/                # Boutique photography and hero banner
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/                    # Dedicated Store Owner Admin Module
│   │   │   │   ├── components/
│   │   │   │   │   ├── admin-layout.component.ts/.html     # Admin layout shell
│   │   │   │   │   ├── admin-sidebar.component.ts/.html    # Collapsible navigation
│   │   │   │   │   └── admin-toasts.component.ts/.html     # Alert notifications
│   │   │   │   ├── guards/
│   │   │   │   │   └── auth.guard.ts                       # Angular route protection
│   │   │   │   ├── models/
│   │   │   │   │   └── admin.models.ts                     # Admin TypeScript interfaces
│   │   │   │   ├── pages/
│   │   │   │   │   ├── login/admin-login.component.ts/.html
│   │   │   │   │   ├── dashboard/admin-dashboard.component.ts/.html
│   │   │   │   │   ├── products/admin-products.component.ts/.html
│   │   │   │   │   ├── categories/admin-categories.component.ts/.html  # Dynamic Category Hub
│   │   │   │   │   ├── coupons/admin-coupons.component.ts/.html        # Promo Coupons Manager
│   │   │   │   │   ├── orders/admin-orders.component.ts/.html          # PDF Bills & Fulfillment
│   │   │   │   │   └── deployment/admin-deployment.component.ts/.html  # Health & Deployment
│   │   │   │   └── services/
│   │   │   │       ├── admin-api.service.ts                # Admin REST client with JWT & PDF download
│   │   │   │       └── admin-auth.service.ts               # Session storage & auth state
│   │   │   ├── components/               # Customer Storefront Components
│   │   │   │   ├── navbar/               # Announcement bar & header (.ts / .html)
│   │   │   │   ├── hero/                 # Hero section & value props (.ts / .html)
│   │   │   │   ├── product-card/         # Product card with badges (.ts / .html)
│   │   │   │   ├── product-details-modal/# Size selector & WhatsApp inquiry (.ts / .html)
│   │   │   │   ├── cart-drawer/          # Shopping bag, coupon box & checkout (.ts / .html)
│   │   │   │   ├── orders-modal/         # 5-stage live status stepper & invoice PDF (.ts / .html)
│   │   │   │   ├── auth-modal/           # Google & OTP customer login (.ts / .html)
│   │   │   │   ├── order-confirmation-modal/ # Order receipt (.ts / .html)
│   │   │   │   └── footer/               # Boutique policies & admin link (.ts / .html)
│   │   │   ├── pages/
│   │   │   │   └── storefront/           # Customer storefront page (.ts / .html)
│   │   │   ├── models/                   # Product & Order customer models
│   │   │   ├── services/                 # ApiService, CartService & CustomerAuthService
│   │   │   ├── app.routes.ts             # Storefront and Admin route definitions
│   │   │   ├── app.ts                    # Root component with router-outlet
│   │   │   └── app.html                  # Root template
│   │   ├── index.html                    # Typography, SEO meta tags, Razorpay SDK
│   │   └── styles.css                    # Consolidated global stylesheet
│   └── package.json
│
├── .env.example                          # Root environment template
├── .gitignore                            # Clean ignores for node_modules, .db, cache, env
```

### 🏛️ Backend 3-Tier Architecture Pattern

The backend follows a strict separation of concerns:
```
[Client / Angular] ◄──HTTP──► [Controllers] ◄────► [Services] ◄────► [Repositories] ◄────► [SQLAlchemy / DB]
```
1. **Controller Layer (`backend/app/controllers/`)**:
   - Manages HTTP routing, request parameter/body validation, JWT identity resolution, and response serialization.
   - Delegates all business logic to services.
2. **Service Layer (`backend/app/services/`)**:
   - Contains all domain logic, payment verification (Razorpay SDK / HMAC), stock availability checks, OTP dispatch, and external API communication.
   - Interacts strictly with the Repository layer for database operations.
3. **Repository Layer (`backend/app/repositories/`)**:
   - Encapsulates all SQLAlchemy queries, CRUD mutations, filters, pagination, and database transactions (`db.session`).
   - Zero HTTP or business logic.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Python 3.10+**
- **Node.js v18+** & **npm**

### 2. Backend Setup
```bash
cd backend

# (Optional) Create & activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run the Flask API server (auto-creates SQLite tables, seeds catalog and default admin)
python app.py
```
> The Flask API will start at: **`http://127.0.0.1:5000`**

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Angular development server
npm start
```
> The Angular storefront will be available at: **`http://localhost:4200`**  
> Access the Store Admin Panel at: **`http://localhost:4200/admin`**

---

## 📡 REST API Reference

### Public Customer Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status, DB connection, and brand info |
| `GET` | `/api/products` | Query catalog (`?category=...&search=...&sort=price_asc|price_desc|newest`) |
| `GET` | `/api/products/<id>` | Retrieve detailed product data |
| `GET` | `/api/products/categories` | Retrieve available boutique categories |
| `POST` | `/api/orders/create` | Calculate total, initialize Razorpay order ID, save pending order |
| `POST` | `/api/orders/verify` | Verify Razorpay HMAC signature, mark order as "paid", decrement stock |
| `GET` | `/api/orders/<id>` | Fetch order receipt and delivery details |

### Customer Authentication & Profile Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/google` | Public | Google Sign-In with OAuth token or email payload |
| `POST` | `/api/auth/otp/send` | Public | Send 6-digit OTP code to 10-digit mobile number |
| `POST` | `/api/auth/otp/verify` | Public | Verify OTP code and issue JWT access token |
| `GET` | `/api/auth/me` | Bearer JWT | Retrieve current customer profile |
| `PUT` | `/api/auth/me` | Bearer JWT | Update customer profile (name, email, default address) |
| `GET` | `/api/auth/orders` | Bearer JWT | Retrieve customer personal order history |

### Protected Store Admin Endpoints (Require `Bearer <JWT_TOKEN>`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Authenticate admin user and issue JWT access token |
| `GET` | `/api/admin/me` | Fetch currently logged-in admin user profile |
| `GET` | `/api/admin/metrics` | Retrieve dashboard KPI metrics (revenue, orders, low-stock alerts) |
| `GET` | `/api/admin/products` | Paginated product listing with filters |
| `POST` | `/api/admin/products` | Create a new boutique product |
| `PUT` | `/api/admin/products/<id>` | Update an existing product (stock, price, sizes, etc.) |
| `DELETE` | `/api/admin/products/<id>` | Delete a product from the catalog |
| `POST` | `/api/admin/upload` | Upload a product image directly (multipart/form-data) |
| `GET` | `/api/admin/orders` | Query orders with status, date range, and search filters |
| `GET` | `/api/admin/orders/<id>` | Fetch detailed order information with item breakdown |
| `PATCH` | `/api/admin/orders/<id>/status` | Update fulfillment status, tracking carrier/AWB, and staff notes |
| `GET` | `/api/admin/deployment-status` | System health check (Database, Razorpay, Google OAuth, SMS, Media) |

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
   If test keys or mock values are configured in `.env`, the platform automatically activates **Demo Mode**. You can place orders, receive simulated payment IDs, verify signatures, decrement inventory, and view the receipt without needing live banking credentials.

---

## 🚢 Production Deployment

### Backend Deployment (Render / Railway / VPS)
1. Set **Root Directory** to `backend`.
2. Set **Build Command**: `pip install -r requirements.txt`.
3. Set **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT "app:app"`.
4. Configure environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (`postgresql://...`)
   - `JWT_SECRET_KEY`: Long random secret string
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Live credentials
   - `FLASK_ENV`: `production`

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. Set **Root Directory** to `frontend`.
2. Set **Build Command**: `npm run build`.
3. Set **Output Directory**: `dist/frontend/browser`.
4. Ensure SPA rewrite rule (`/*` ➔ `/index.html`) is enabled for Angular routing.

---

## 🌸 Brand Support & Social Links

- **Instagram**: [@shaifystyles_](https://instagram.com/shaifystyles_)
- **WhatsApp Inquiries**: `+91 98765 43210`
- **License**: MIT
