
import React, { useEffect, useState } from "react";

import {
  Routes,
  Route,
  Link,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  Heart,
  ShoppingBag,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  ArrowLeft,
  Package,
  BookOpen,
  Headphones,
  Laptop,
} from "lucide-react";

import Layout from "./components/Layout";
import ProductCard from "./components/ProductCard";
import ProtectedRoute from "./components/ProtectedRoute";

import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { useShop } from "./store/useShop";
import { useAuth } from "./store/useAuth";
import { categories } from "./data/products";

const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

// PRODUCT ILLUSTRATION

function ProductArt({ product, className = "detail-art" }) {
  const category = (product.category || "").toLowerCase();

  let Icon = Package;

  if (category.includes("book")) {
    Icon = BookOpen;
  } else if (
    category.includes("electronic") ||
    category.includes("tech")
  ) {
    Icon = Laptop;
  } else if (
    category.includes("accessor") ||
    category.includes("audio")
  ) {
    Icon = Headphones;
  }

  return (
    <div
      className={className}
      style={{
        background: product.color || "#eee5ff",
      }}
    >
      <Icon size={64} strokeWidth={1.4} />
    </div>
  );
}

// PRODUCT GRID

function Grid({ products }) {
  if (!products.length) {
    return (
      <div className="empty">
        <Package size={38} strokeWidth={1.5} />
        <h3>Nothing here yet</h3>
        <p>Try a different filter or explore more listings.</p>

        <Link className="btn btn-primary" to="/home">
          Explore items
        </Link>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}

// HOME PAGE

function Home() {
  const products = useShop((s) => s.products);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("recent");

  const filtered = products
    .filter(
      (p) =>
        (category === "All" || p.category === category) &&
        `${p.title} ${p.description} ${p.college}`
          .toLowerCase()
          .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      return 0;
    });

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">
              THE STUDENT-TO-STUDENT MARKETPLACE
            </span>

            <h1>
              Good finds.
              <br />
              <em>Better stories.</em>
            </h1>

            <p>
              Discover pre-loved campus essentials,
              save money, and give your favorite things
              a second chapter.
            </p>

            <a className="btn btn-primary" href="#discover">
              Explore marketplace
              <ArrowRight size={17} />
            </a>

            <div className="hero-trust">
              <span>
                <ShieldCheck size={16} />
                College community
              </span>

              <span>
                <Heart size={16} />
                Sustainable shopping
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-blob">
              <BookOpen size={54} strokeWidth={1.4} />
              <Headphones size={54} strokeWidth={1.4} />
              <Laptop size={54} strokeWidth={1.4} />
            </div>

            <div className="hero-sticker">
              Pre-loved
              <br />
              with care
            </div>

            <div className="hero-note">
              Your campus, your finds
            </div>
          </div>
        </div>
      </section>

      <section
        className="container marketplace"
        id="discover"
      >
        <div className="section-head">
          <div>
            <span className="eyebrow">
              HANDPICKED FOR YOU
            </span>

            <h2>Explore the marketplace</h2>

            <p>
              Little treasures from students around you.
            </p>
          </div>

          <Link className="text-link" to="/sell">
            Have something to sell?
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="filters">
          <label className="search">
            <Search size={18} />

            <input
              placeholder="Search books, gadgets, anything..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="sort">
            <SlidersHorizontal size={17} />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>

        <div className="categories">
          {categories.map((c) => (
            <button
              key={c}
              className={
                "category " +
                (category === c ? "active" : "")
              }
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="results">
          Showing {filtered.length} lovely finds
        </div>

        <Grid products={filtered} />
      </section>

      <section className="container bottom-cta">
        <span>PASS IT ON</span>

        <h2>
          Your old favorite could be
          <br />
          someone's new favorite.
        </h2>

        <Link className="btn btn-primary" to="/sell">
          Start selling
          <ArrowRight size={17} />
        </Link>
      </section>
    </>
  );
}

// PRODUCT DETAILS

function Product() {
  const { id } = useParams();
  const navigate = useNavigate();

  const p = useShop((s) =>
    s.products.find((item) => String(item.id) === id)
  );

  const { addCart, toggleWishlist, wishlist } = useShop();

  if (!p) {
    return (
      <div className="container page">
        <h2>Item not found</h2>

        <Link to="/home">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const saved = wishlist.includes(p.id);

  return (
    <div className="container page">
      <Link className="back" to="/home">
        <ArrowLeft size={16} />
        Back to marketplace
      </Link>

      <div className="detail-grid">
        <ProductArt product={p} />

        <div className="detail-content">
          <span className="eyebrow">
            {p.category} · {p.college}
          </span>

          <h1>{p.title}</h1>

          <span className="tag">
            {p.condition}
          </span>

          <div className="detail-price">
            {money(p.price)}

            {p.original ? (
              <s>{money(p.original)}</s>
            ) : null}
          </div>

          <p>{p.description}</p>

          <div className="seller-box">
            <div className="avatar">
              {p.seller?.[0] || "S"}
            </div>

            <div>
              <strong>
                {p.seller || "Student"}
              </strong>

              <small>
                Student seller · {p.college}
              </small>
            </div>
          </div>

          <div className="detail-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                addCart(p.id);
                navigate("/cart");
              }}
            >
              <ShoppingBag size={18} />
              Add to cart
            </button>

            <button
              className="btn btn-outline"
              onClick={() => toggleWishlist(p.id)}
            >
              <Heart
                size={18}
                fill={
                  saved ? "currentColor" : "none"
                }
              />

              {saved ? "Saved" : "Save"}
            </button>
          </div>

          <div className="notice">
            <ShieldCheck size={18} />
            Demo listing. Verify item condition
            and seller identity before any
            real-world exchange.
          </div>
        </div>
      </div>
    </div>
  );
}

// WISHLIST

function Wishlist() {
  const { wishlist, products } = useShop();

  const savedProducts = products.filter(
    (p) => wishlist.includes(p.id)
  );

  return (
    <div className="container page">
      <span className="eyebrow">
        YOUR FAVORITES
      </span>

      <h1>Saved with care</h1>

      <p className="muted">
        Everything that caught your eye.
      </p>

      <Grid products={savedProducts} />
    </div>
  );
}

// SHOPPING CART

function Cart() {
  const {
    cart,
    products,
    removeCart,
    demoCheckout,
  } = useShop();

  const navigate = useNavigate();

  const items = cart
    .map((id) =>
      products.find((p) => p.id === id)
    )
    .filter(Boolean);

  const total = items.reduce(
    (sum, p) => sum + Number(p.price),
    0
  );

  return (
    <div className="container page">
      <span className="eyebrow">
        ALMOST YOURS
      </span>

      <h1>Your shopping bag</h1>

      {!items.length ? (
        <div className="empty">
          <ShoppingBag
            size={38}
            strokeWidth={1.5}
          />

          <p>
            Your bag is waiting for something special.
          </p>

          <Link
            className="btn btn-primary"
            to="/home"
          >
            Browse marketplace
          </Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="cart-list">
            {items.map((p) => (
              <div
                className="cart-row"
                key={p.id}
              >
                <ProductArt
                  product={p}
                  className="cart-art"
                />

                <div className="cart-info">
                  <Link
                    to={`/product/${p.id}`}
                  >
                    <strong>
                      {p.title}
                    </strong>
                  </Link>

                  <small>
                    {p.college} · {p.condition}
                  </small>

                  <b>
                    {money(p.price)}
                  </b>
                </div>

                <button
                  className="icon-button"
                  onClick={() =>
                    removeCart(p.id)
                  }
                  aria-label="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h3>Order summary</h3>

            <div className="summary-line">
              <span>
                Items ({items.length})
              </span>

              <b>
                {money(total)}
              </b>
            </div>

            <div className="summary-line">
              <span>Delivery</span>
              <span>Arrange with seller</span>
            </div>

            <hr />

            <div className="summary-line total">
              <b>Total</b>
              <b>{money(total)}</b>
            </div>

            <button
              className="btn btn-primary full"
              onClick={() => {
                demoCheckout();
                navigate("/orders");
              }}
            >
              Create demo order
              <ArrowRight size={17} />
            </button>

            <p className="disclaimer">
              Demo only. No payment is collected.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

// ORDERS

function Orders() {
  const orders = useShop((s) => s.orders);

  return (
    <div className="container page">
      <span className="eyebrow">
        YOUR PURCHASES
      </span>

      <h1>My orders</h1>

      {orders.length === 0 ? (
        <div className="empty">
          <Package
            size={38}
            strokeWidth={1.5}
          />

          <p>No orders yet.</p>

          <Link
            className="btn btn-primary"
            to="/home"
          >
            Shop now
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => (
            <div
              className="order-card"
              key={o.id}
            >
              <div className="order-header">
                <strong>
                  Order #{String(o.id).slice(0, 8)}
                </strong>

                <span className="tag">
                  {o.status}
                </span>
              </div>

              <small>
                {new Date(
                  o.date
                ).toLocaleDateString("en-IN")}
              </small>

              <p>
                {o.items
                  .map((p) => p.title)
                  .join(", ")}
              </p>

              <strong>
                {money(o.total)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// SELL PRODUCT

function Sell() {
  const { addProduct, products } = useShop();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    original: "",
    category: "Books",
    condition: "Good",
  });

  const update = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submit = (e) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      Number(form.price) <= 0
    ) {
      return;
    }

    addProduct(form);
    navigate("/home");
  };

  return (
    <div className="container page">
      <span className="eyebrow">
        GIVE IT A SECOND CHAPTER
      </span>

      <h1>Sell something lovely</h1>

      <p className="muted">
        List an item in minutes.
        Listings are currently stored locally.
      </p>

      <div className="sell-layout">
        <form
          className="form-card"
          onSubmit={submit}
        >
          <label>
            Product title

            <input
              name="title"
              value={form.title}
              onChange={update}
              required
              maxLength={100}
              placeholder="e.g. Engineering Drawing Drafter"
            />
          </label>

          <label>
            Description

            <textarea
              name="description"
              value={form.description}
              onChange={update}
              required
              maxLength={1000}
              rows={4}
              placeholder="Describe the item and its condition..."
            />
          </label>

          <div className="form-row">
            <label>
              Selling price (₹)

              <input
                name="price"
                type="number"
                min="1"
                value={form.price}
                onChange={update}
                required
              />
            </label>

            <label>
              Original price (₹)

              <input
                name="original"
                type="number"
                min="1"
                value={form.original}
                onChange={update}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Category

              <select
                name="category"
                value={form.category}
                onChange={update}
              >
                {categories
                  .filter((c) => c !== "All")
                  .map((c) => (
                    <option
                      key={c}
                      value={c}
                    >
                      {c}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Condition

              <select
                name="condition"
                value={form.condition}
                onChange={update}
              >
                {[
                  "New",
                  "Like New",
                  "Good",
                  "Fair",
                ].map((c) => (
                  <option
                    key={c}
                    value={c}
                  >
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            className="btn btn-primary full"
            type="submit"
          >
            <Plus size={18} />
            Publish demo listing
          </button>

          <p className="disclaimer">
            Product listings are stored locally
            until MongoDB product integration
            is added.
          </p>
        </form>

        <aside className="seller-tips">
          <h3>Seller's corner</h3>

          <p>
            Good photos, clear descriptions,
            and fair prices help your listing
            stand out.
          </p>

          <div className="tip">
            <CheckCircle2 size={18} />
            Describe any scratches or wear.
          </div>

          <div className="tip">
            <CheckCircle2 size={18} />
            Include accessories and original price.
          </div>

          <div className="tip">
            <CheckCircle2 size={18} />
            Meet in a safe, public campus location.
          </div>

          <div className="tip">
            <CheckCircle2 size={18} />
            Never share OTPs or payment credentials.
          </div>

          <div className="seller-count">
            {products.length} demo listings on CampusMart
          </div>
        </aside>
      </div>
    </div>
  );
}

// REUSABLE PROTECTED PAGE

function MarketplacePage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

// MAIN APP

export default function App() {
  const checkAuth = useAuth((state) => state.checkAuth);
  const user = useAuth((state) => state.user);
  const loading = useAuth((state) => state.loading);

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Authentication check failed:", error);
      } finally {
        if (active) {
          setAuthChecked(true);
        }
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, [checkAuth]);

  if (!authChecked || loading) {
    return (
      <div className="cm-app-loading">
        Loading CampusMart...
      </div>
    );
  }

  return (
    <Routes>
      {/* AUTHENTICATION */}

      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/home" replace />
          ) : (
            <Auth />
          )
        }
      />

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/home" replace />
          ) : (
            <Auth />
          )
        }
      />

      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to="/home" replace />
          ) : (
            <Auth />
          )
        }
      />

      {/* PASSWORD RECOVERY */}

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />

      {/* MARKETPLACE */}

      <Route
        path="/home"
        element={
          <MarketplacePage>
            <Home />
          </MarketplacePage>
        }
      />

      <Route
        path="/product/:id"
        element={
          <MarketplacePage>
            <Product />
          </MarketplacePage>
        }
      />

      <Route
        path="/wishlist"
        element={
          <MarketplacePage>
            <Wishlist />
          </MarketplacePage>
        }
      />

      <Route
        path="/cart"
        element={
          <MarketplacePage>
            <Cart />
          </MarketplacePage>
        }
      />

      <Route
        path="/orders"
        element={
          <MarketplacePage>
            <Orders />
          </MarketplacePage>
        }
      />

      <Route
        path="/sell"
        element={
          <MarketplacePage>
            <Sell />
          </MarketplacePage>
        }
      />

      {/* FALLBACK */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
