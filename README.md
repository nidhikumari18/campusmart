# CampusMart 🛍️

### A Student-to-Student Marketplace

**CampusMart** is a full-stack marketplace platform designed to help college students buy and sell pre-loved items within their campus community.

From textbooks and electronics to stationery and accessories, CampusMart makes it easier for students to discover affordable essentials and give unused products a second life.

## ✨ Features

- **User Authentication** — Secure sign-up, login, logout, and password reset.
- **Product Listings** — Students can create listings with descriptions, prices, categories, and conditions.
- **Image Uploads** — Upload up to five photos of a product.
- **Product Discovery** — Browse, search, filter, and sort marketplace listings.
- **Product Details** — View item descriptions, prices, and uploaded photos.
- **Wishlist** — Save products for later.
- **Shopping Cart** — Add or remove items from a cart.
- **Responsive Design** — Clean lavender-themed interface for desktop and mobile.
- **Order Interface** — Demo checkout and order tracking interface.

> **Note:** Checkout is currently a demo feature. Real payments and completed transactions are not supported yet.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Styling | CSS3, Nunito, Lucide Icons |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcrypt |
| Image Uploads | Multer |
| State Management | Zustand |
| Email Service | Nodemailer |
| Version Control | Git, GitHub |

## 📁 Project Structure

```text
campusmart/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── ProductPhotoUpload.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Auth.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Sell.jsx
│   │   │   ├── Product.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Wishlist.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   │
│   │   ├── store/
│   │   │   ├── useAuth.js
│   │   │   └── useShop.js
│   │   │
│   │   ├── App.jsx
│   │   └── index.css
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Product.js
│   │   │
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   │       ├── authRoutes.js
│   │       └── productRoutes.js
│   │
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/nidhikumari18/campusmart.git
cd campusmart
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder and configure the required environment variables.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=http://localhost:5173

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email
SMTP_PASS=your_app_password
MAIL_FROM=your_sender_email
```

Never commit real credentials or `.env` files to GitHub.

### 3. Start the Backend

```bash
npm run dev
```

The backend runs at:

`http://localhost:5000`

### 4. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

`http://localhost:5173`

## 📸 Product Image Uploads

CampusMart allows students to upload photos while creating a listing.

- Supports JPG, PNG, and WebP.
- Maximum five photos per product.
- Maximum file size of 5 MB per photo.
- Displays uploaded photos on product cards and product detail pages.

During local development, images are stored in the backend's `uploads` directory. Persistent cloud image storage is planned for deployment.

## 🔐 Authentication

CampusMart uses JWT-based authentication with password hashing.

Users can register, log in, log out, and request password-reset links through email. Protected marketplace pages require authentication.

## 🎨 Design

The interface uses a soft lavender-inspired aesthetic with rounded cards, spacious layouts, responsive navigation, and Nunito typography.

The design focuses on making the marketplace simple, approachable, and easy to navigate.

## 🔮 Future Improvements

- Real-time buyer–seller chat
- Seller profiles and ratings
- College-based product filtering
- Persistent cloud image storage
- Product editing and deletion
- Notifications
- Reporting and moderation tools
- Secure payment integration
- Improved order management

## 👩‍💻 Developer

**Nidhi Kumari**

Computer Science Engineering Student | IGDTUW

- **GitHub:** [nidhikumari18](https://github.com/nidhikumari18)
- **LinkedIn:** [Nidhi Kumari](https://www.linkedin.com/in/nidhikumari53/)

## 📄 License

No open-source license has been specified for this project.

---

**CampusMart — Good finds. Better stories.**

*Built for students, by a student.*