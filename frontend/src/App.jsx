
import React, { useEffect, useState } from "react";
import {
  Routes, Route, Link, Navigate,
  useParams, useNavigate,
} from "react-router-dom";
import {
  ArrowRight, ArrowLeft, Search, SlidersHorizontal,
  Heart, ShoppingBag, Plus, CheckCircle2,
  ShieldCheck, Trash2, Pencil, Package,
  BookOpen, Headphones, Laptop, ImagePlus,
  X, ChevronLeft, ChevronRight, Clock3, PackageCheck,MessageCircle
} from "lucide-react";


import Messages from "./pages/Messages.jsx";
import MyListings from "./pages/MyListings";
import Layout from "./components/Layout";
import ProductCard from "./components/ProductCard";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import {
  useShop,
  productImage,
  isProductAvailable,
  API_URL,
} from "./store/useShop";
import { useAuth } from "./store/useAuth";
import { categories } from "./data/products";

const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

const productId = (p) => String(p.id || p._id);

function getImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

// ========================================
// PRODUCT IMAGE
// ========================================

function ProductArt({
  product,
  className = "detail-art",
  imageIndex = 0,
}) {
  const image = product.imageUrls?.[imageIndex]
    ? getImageUrl(product.imageUrls[imageIndex])
    : productImage(product);

  if (image) {
    return (
      <div
        className={className}
        style={{ overflow: "hidden" }}
      >
        <img
          src={image}
          alt={product.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }

  const category = (product.category || "").toLowerCase();
  let Icon = Package;

  if (category.includes("book")) Icon = BookOpen;
  else if (category.includes("electronic") || category.includes("tech"))
    Icon = Laptop;
  else if (category.includes("accessor") || category.includes("audio"))
    Icon = Headphones;

  return (
    <div
      className={className}
      style={{ background: product.color || "#eee5ff" }}
    >
      <Icon size={64} strokeWidth={1.4} />
    </div>
  );
}

// ========================================
// PRODUCT GRID
// ========================================

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
        <ProductCard key={productId(p)} p={p} />
      ))}
    </div>
  );
}

// ========================================
// HOME
// ========================================

function Home() {
  const products = useShop((s) => s.products);
  const loadProducts = useShop((s) => s.loadProducts);
  const productsLoading = useShop((s) => s.productsLoading);
  const productsError = useShop((s) => s.productsError);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("recent");

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = products
    .filter(
      (p) =>
        (category === "All" || p.category === category) &&
        `${p.title} ${p.description} ${p.college || ""}`
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
              Explore marketplace <ArrowRight size={17} />
            </a>

            <div className="hero-trust">
              <span>
                <ShieldCheck size={16} /> College community
              </span>
              <span>
                <Heart size={16} /> Sustainable shopping
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

      <section className="container marketplace" id="discover">
        <div className="section-head">
          <div>
            <span className="eyebrow">HANDPICKED FOR YOU</span>
            <h2>Explore the marketplace</h2>
            <p>Little treasures from students around you.</p>
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
              type="button"
              className={
                "category " + (category === c ? "active" : "")
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

        {productsLoading && (
          <p className="muted">Loading marketplace listings...</p>
        )}

        {productsError && (
          <p className="muted" role="alert">
            Unable to refresh listings: {productsError}
          </p>
        )}

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
          Start selling <ArrowRight size={17} />
        </Link>
      </section>
    </>
  );
}

// ========================================
// PRODUCT DETAILS
// ========================================

function Product() {
  const { id } = useParams();
  const navigate = useNavigate();

  const products = useShop((s) => s.products);
  const addCart = useShop((s) => s.addCart);
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const wishlist = useShop((s) => s.wishlist);
  const deleteProduct = useShop((s) => s.deleteProduct);

  const user = useAuth((s) => s.user);

  const [remoteProduct, setRemoteProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState("");

  const localProduct = products.find(
    (item) => productId(item) === id
  );

  const p = localProduct || remoteProduct;

  useEffect(() => {
    if (!/^[a-f\d]{24}$/i.test(id)) return;

    let active = true;

    async function fetchProduct() {
      setLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/api/products/${id}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Product not found.");
        }

        const result = await response.json();

        if (active) {
          setRemoteProduct({
            ...result.product,
            id: String(result.product._id),
          });
          setActiveImage(0);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProduct();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading && !p) {
    return (
      <div className="container page">
        <p>Loading product...</p>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="container page">
        <h2>Item not found</h2>
        <Link to="/home">Back to marketplace</Link>
      </div>
    );
  }

  const currentId = productId(p);
  const saved = wishlist.includes(currentId);
  const status = p.status || "Available";
  const available = isProductAvailable(p);
  const images = p.imageUrls || [];

  const sellerName =
    typeof p.seller === "object"
      ? p.seller?.name || "Student"
      : /^[a-f\d]{24}$/i.test(String(p.seller || ""))
        ? "Student"
        : p.seller || "Student";

  const sellerId =
    p.sellerId ||
    (typeof p.seller === "object"
      ? p.seller?._id || p.seller?.id
      : p.seller);

  const isOwner = Boolean(
    user &&
      sellerId &&
      String(sellerId) === String(user.id || user._id)
  );

  const original = Number(p.original);
  const showOriginal =
    p.original !== null &&
    p.original !== undefined &&
    p.original !== "" &&
    Number.isFinite(original) &&
    original > Number(p.price);

  function changeImage(direction) {
    if (!images.length) return;

    setActiveImage(
      (current) =>
        (current + direction + images.length) % images.length
    );
  }

  async function deleteListing() {
    if (!isOwner || deleting) return;

    if (!window.confirm("Delete this listing permanently?")) {
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteProduct(currentId);
      navigate("/home", { replace: true });
    } catch (error) {
      setDeleteError(
        error.message || "Unable to delete listing."
      );
    } finally {
      setDeleting(false);
    }
  }


  async function messageSeller() {
    if (isOwner || startingChat) return;
  
    setStartingChat(true);
    setChatError("");
  
    try {
      const response = await fetch(
        `${API_URL}/api/messages/conversations`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: currentId,
          }),
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(
          result.message || "Unable to start chat."
        );
      }
  
      const conversationId = result.conversation?._id;
  
      if (!conversationId) {
        throw new Error("Conversation ID is missing.");
      }
  
      navigate(`/messages?chat=${conversationId}`);
    } catch (error) {
      setChatError(
        error.message || "Unable to message seller."
      );
    } finally {
      setStartingChat(false);
    }
  }
  return (
    <div className="container page">
      <Link className="back" to="/home">
        <ArrowLeft size={16} />
        Back to marketplace
      </Link>

      <div className="detail-grid">
        <div>
          <ProductArt
            product={p}
            imageIndex={activeImage}
          />

          {images.length > 1 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 14,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => changeImage(-1)}
                >
                  <ChevronLeft size={18} />
                </button>

                <span>
                  {activeImage + 1} / {images.length}
                </span>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => changeImage(1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                {images.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    style={{
                      padding: 0,
                      width: 68,
                      height: 68,
                      borderRadius: 12,
                      overflow: "hidden",
                      cursor: "pointer",
                      border:
                        activeImage === index
                          ? "2px solid #9275ca"
                          : "1px solid #e6def2",
                    }}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`Product photo ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="detail-content">
          <span className="eyebrow">
            {p.category} · {p.college || "Campus"}
          </span>

          <h1>{p.title}</h1>

          <span className="tag">
            {p.condition || "Good"}
          </span>

          <span
            role="status"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginLeft: 10,
              padding: "7px 13px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              background: available ? "#e4f8ed" : status === "Reserved" ? "#fff0d7" : "#f0e5fa",
              color: available ? "#23794e" : status === "Reserved" ? "#98620e" : "#7952a6",
            }}
          >
            {available ? <CheckCircle2 size={16} /> : status === "Reserved" ? <Clock3 size={16} /> : <PackageCheck size={16} />}
            {status}
          </span>

          {!available && (
            <p style={{ marginTop: 14, color: "var(--muted, #82778f)" }}>
              {status === "Reserved"
                ? "This item is currently reserved and cannot be added to your cart."
                : "This item has been sold and is no longer available."}
            </p>
          )}

          <div className="detail-price">
            {money(p.price)}
            {showOriginal && <s>{money(original)}</s>}
          </div>

          <p>{p.description}</p>

          <div className="seller-box">
            <div className="avatar">
              {sellerName[0]?.toUpperCase() || "S"}
            </div>

            <div>
              <strong>{sellerName}</strong>
              <small>
                Student seller · {p.college || "Campus"}
              </small>
            </div>
          </div>

          <div className="detail-actions">
          {!isOwner && (
  <button
    type="button"
    className="btn btn-outline"
    onClick={messageSeller}
    disabled={startingChat}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      borderColor: "#a78bfa",
    }}
  >
    <MessageCircle size={18} />
    {startingChat ? "Opening chat..." : "Message Seller"}
  </button>
)}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!available}
              title={!available ? `This item is ${status.toLowerCase()}` : "Add to cart"}
              style={!available ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
              onClick={() => {
                if (!available) return;
                const added = addCart(currentId);
                if (added) {
                  navigate("/cart");
                } else {
                  setCartMessage("This product is not currently available to add to your cart.");
                }
              }}
            >
              <ShoppingBag size={18} />
              {available ? "Add to cart" : status === "Reserved" ? "Reserved" : "Sold out"}
            </button>

            <button
              className="btn btn-outline"
              onClick={() => toggleWishlist(currentId)}
            >
              <Heart
                size={18}
                fill={saved ? "currentColor" : "none"}
              />
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          {chatError && (
  <p
    role="alert"
    style={{
      marginTop: 12,
      color: "#dc2626",
    }}
  >
    {chatError}
  </p>
)}

          {isOwner && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 18,
              }}
            >
              <Link
                to={`/product/${currentId}/edit`}
                className="btn btn-outline"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Pencil size={17} />
                Edit Listing
              </Link>

              <button
                type="button"
                onClick={deleteListing}
                disabled={deleting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 18px",
                  background: "#fff1f2",
                  color: "#be123c",
                  border: "1px solid #fecdd3",
                  borderRadius: 12,
                  cursor: deleting ? "wait" : "pointer",
                  fontWeight: 600,
                }}
              >
                <Trash2 size={17} />
                {deleting ? "Deleting..." : "Delete Listing"}
              </button>
            </div>
          )}

          {cartMessage && <p role="alert" style={{ color: "#9b650d" }}>{cartMessage}</p>}

          {deleteError && (
            <p role="alert" style={{ color: "#be123c" }}>
              {deleteError}
            </p>
          )}

          <div className="notice">
            <ShieldCheck size={18} />
            Check the item's condition and arrange
            exchanges in a safe, public location.
            Online payments are not enabled.
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// WISHLIST
// ========================================

function Wishlist() {
  const wishlist = useShop((s) => s.wishlist);
  const products = useShop((s) => s.products);

  const savedProducts = products.filter((p) =>
    wishlist.includes(productId(p))
  );

  return (
    <div className="container page">
      <span className="eyebrow">YOUR FAVORITES</span>
      <h1>Saved with care</h1>
      <p className="muted">Everything that caught your eye.</p>
      <Grid products={savedProducts} />
    </div>
  );
}

// ========================================
// SHOPPING CART
// ========================================

function Cart() {
  const cart = useShop((s) => s.cart);
  const products = useShop((s) => s.products);
  const removeCart = useShop((s) => s.removeCart);
  const demoCheckout = useShop((s) => s.demoCheckout);
  const navigate = useNavigate();

  const items = cart
    .map((id) =>
      products.find((p) => productId(p) === id)
    )
    .filter(Boolean);

  const total = items.reduce(
    (sum, p) => sum + Number(p.price),
    0
  );

  return (
    <div className="container page">
      <span className="eyebrow">ALMOST YOURS</span>
      <h1>Your shopping bag</h1>

      {!items.length ? (
        <div className="empty">
          <ShoppingBag size={38} strokeWidth={1.5} />
          <p>Your bag is waiting for something special.</p>
          <Link className="btn btn-primary" to="/home">
            Browse marketplace
          </Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="cart-list">
            {items.map((p) => (
              <div
                className="cart-row"
                key={productId(p)}
              >
                <ProductArt
                  product={p}
                  className="cart-art"
                />

                <div className="cart-info">
                  <Link to={`/product/${productId(p)}`}>
                    <strong>{p.title}</strong>
                  </Link>

                  <small>
                    {p.college || "Campus"} · {p.condition}
                  </small>

                  <b>{money(p.price)}</b>
                </div>

                <button
                  className="icon-button"
                  onClick={() =>
                    removeCart(productId(p))
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
              <span>Items ({items.length})</span>
              <b>{money(total)}</b>
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
                const success = demoCheckout();
                if (success) {
                  navigate("/orders");
                } else {
                  window.alert("Your cart contains an unavailable item. Refresh the marketplace and try again.");
                }
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

// ========================================
// ORDERS
// ========================================

function Orders() {
  const orders = useShop((s) => s.orders);

  return (
    <div className="container page">
      <span className="eyebrow">YOUR PURCHASES</span>
      <h1>My orders</h1>

      {orders.length === 0 ? (
        <div className="empty">
          <Package size={38} strokeWidth={1.5} />
          <p>No orders yet.</p>
          <Link className="btn btn-primary" to="/home">
            Shop now
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div
              className="order-card"
              key={order.id}
            >
              <div className="order-header">
                <strong>
                  Order #{String(order.id).slice(0, 8)}
                </strong>
                <span className="tag">
                  {order.status}
                </span>
              </div>

              <small>
                {new Date(order.date).toLocaleDateString(
                  "en-IN"
                )}
              </small>

              <p>
                {order.items
                  .map((p) => p.title)
                  .join(", ")}
              </p>

              <strong>{money(order.total)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========================================
// SELL + EDIT LISTING
// ========================================

function Sell({ editing = false }) {
  const { id: editId } = useParams();
  const navigate = useNavigate();

  const currentUser = useAuth((s) => s.user);
  const products = useShop((s) => s.products);
  const addProduct = useShop((s) => s.addProduct);
  const updateProduct = useShop((s) => s.updateProduct);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    original: "",
    category: "Books",
    condition: "Good",
    college: "",
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [loadingEdit, setLoadingEdit] = useState(editing);
  const [editAllowed, setEditAllowed] = useState(!editing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load product details when editing

  useEffect(() => {
    if (!editing) return;

    let active = true;

    async function loadListing() {
      setLoadingEdit(true);
      setEditAllowed(false);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/products/${editId}`,
          { credentials: "include" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Product not found."
          );
        }

        const product = result.product;

        const sellerId = String(
          typeof product.seller === "object"
            ? product.seller?._id || product.seller?.id
            : product.seller
        );

        const userId = String(
          currentUser?.id || currentUser?._id || ""
        );

        if (!userId || sellerId !== userId) {
          throw new Error(
            "Only the seller can edit this listing."
          );
        }

        if (!active) return;

        setForm({
          title: product.title || "",
          description: product.description || "",
          price: String(product.price ?? ""),
          original:
            product.original == null
              ? ""
              : String(product.original),
          category: product.category || "Books",
          condition: product.condition || "Good",
          college: product.college || "",
        });

        setExistingImages(product.imageUrls || []);
        setEditAllowed(true);
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load listing."
          );
        }
      } finally {
        if (active) setLoadingEdit(false);
      }
    }

    loadListing();

    return () => {
      active = false;
    };
  }, [
    editing,
    editId,
    currentUser?.id,
    currentUser?._id,
  ]);

  // Preview new photos

  useEffect(() => {
    const urls = images.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviews(urls);

    return () => {
      urls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [images]);

  function update(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function selectImages(event) {
    const selected = Array.from(
      event.target.files || []
    );

    event.target.value = "";

    if (images.length + selected.length > 5) {
      setError(
        "You can upload a maximum of 5 photos."
      );
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const invalid = selected.some(
      (file) =>
        !allowedTypes.includes(file.type) ||
        file.size > 5 * 1024 * 1024
    );

    if (invalid) {
      setError(
        "Only JPG, PNG and WebP images up to 5 MB are allowed."
      );
      return;
    }

    setImages((previous) => [
      ...previous,
      ...selected,
    ]);

    setError("");
  }

  function removeImage(index) {
    setImages((previous) =>
      previous.filter(
        (_, position) => position !== index
      )
    );
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!editing && images.length === 0) {
      setError(
        "Please upload at least one product photo."
      );
      return;
    }

    const price = Number(form.price);
    const original = Number(form.original);

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError(
        "Please enter valid product details."
      );
      return;
    }

    if (
      form.original !== "" &&
      (!Number.isFinite(original) ||
        original < price)
    ) {
      setError(
        "Original price must be at least the selling price."
      );
      return;
    }

    setSubmitting(true);

    try {
      const product = editing
        ? await updateProduct(editId, form, images)
        : await addProduct(form, images);

      navigate(`/product/${productId(product)}`);
    } catch (err) {
      setError(
        err.message || "Unable to save your listing."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const price = Number(form.price);
  const original = Number(form.original);

  const showDiscount =
    form.original !== "" &&
    price > 0 &&
    original > price;

  const discount = showDiscount
    ? Math.round((1 - price / original) * 100)
    : 0;

  if (loadingEdit) {
    return (
      <div className="container page">
        <p>Loading your listing...</p>
      </div>
    );
  }

  if (editing && !editAllowed) {
    return (
      <div className="container page">
        <h2>Cannot edit listing</h2>
        <p role="alert">{error}</p>

        <Link
          to="/home"
          className="btn btn-outline"
        >
          Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <span className="eyebrow">
        {editing
          ? "MAKE IT EVEN BETTER"
          : "GIVE IT A SECOND CHAPTER"}
      </span>

      <h1>
        {editing
          ? "Edit your listing"
          : "Sell something lovely"}
      </h1>

      <p className="muted">
        {editing
          ? "Update your product details and pricing."
          : "Upload your product photos, share its story, and find it a new home on campus."}
      </p>

      <div className="sell-layout">
        <form
          className="form-card"
          onSubmit={submit}
        >
          <label>Product photos</label>

          <p className="muted">
            Add up to 5 photos. Your first photo
            will be the cover image.
          </p>

          {editing &&
            existingImages.length > 0 &&
            images.length === 0 && (
              <div style={{ marginBottom: 16 }}>
                <p className="muted">
                  Current photos. Upload new photos
                  only if you want to replace them.
                </p>

                <div className="cm-upload-grid">
                  {existingImages.map(
                    (image, index) => (
                      <div
                        className="cm-upload-preview"
                        key={image}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`Current photo ${index + 1}`}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          <div className="cm-upload-grid">
            {previews.map((url, index) => (
              <div
                className="cm-upload-preview"
                key={url}
              >
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                />

                {index === 0 && (
                  <span className="cm-cover-badge">
                    Cover
                  </span>
                )}

                <button
                  type="button"
                  className="cm-remove-image"
                  onClick={() => removeImage(index)}
                  aria-label="Remove photo"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <label className="cm-upload-button">
                <ImagePlus size={30} />

                <strong>
                  {editing
                    ? "Replace photos"
                    : "Add photos"}
                </strong>

                <small>JPG, PNG or WebP</small>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={selectImages}
                />
              </label>
            )}
          </div>

          <p className="muted">
            {images.length} new photos selected
          </p>

          <label>
            Product title
            <input
              name="title"
              value={form.title}
              onChange={update}
              required
              maxLength={120}
              placeholder="e.g. Scientific Calculator"
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              required
              maxLength={3000}
              rows={4}
              placeholder="Describe the item and its condition..."
            />
          </label>

          {/* ORIGINAL + SELLING PRICE */}

          <div className="form-row">
            <label>
              Selling price (₹)
              <input
                name="price"
                type="number"
                min="1"
                step="0.01"
                value={form.price}
                onChange={update}
                required
                placeholder="650"
              />
            </label>

            <label>
              Original price (₹) — Optional
              <input
                name="original"
                type="number"
                min="1"
                step="0.01"
                value={form.original}
                onChange={update}
                placeholder="1200"
              />
            </label>
          </div>

          {/* LIVE DISCOUNT PREVIEW */}

          {showDiscount && (
            <div
              style={{
                background: "#f5efff",
                border: "1px solid #e7dafa",
                borderRadius: 16,
                padding: 18,
                marginBottom: 20,
              }}
            >
              <small
                style={{
                  color: "#775a9c",
                  fontWeight: 600,
                }}
              >
                PRICE PREVIEW
              </small>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                <strong
                  style={{
                    fontSize: 25,
                    color: "#4e3578",
                  }}
                >
                  {money(price)}
                </strong>

                <s
                  style={{
                    color: "#988aa7",
                    fontSize: 17,
                  }}
                >
                  {money(original)}
                </s>

                <span
                  style={{
                    background: "#e0f6e7",
                    color: "#28794a",
                    borderRadius: 20,
                    padding: "5px 10px",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {discount}% OFF
                </span>
              </div>
            </div>
          )}

          <label>
            College
            <input
              name="college"
              value={form.college}
              onChange={update}
              placeholder="Your college name"
            />
          </label>

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
                ].map((condition) => (
                  <option
                    key={condition}
                    value={condition}
                  >
                    {condition}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <p
              className="cm-upload-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="cm-publish-button"
            disabled={submitting}
          >
            {editing ? (
              <Pencil size={18} />
            ) : (
              <Plus size={18} />
            )}

            {submitting
              ? "Saving..."
              : editing
                ? "Save Changes"
                : "Publish Listing"}
          </button>

          {editing && (
            <Link
              to={`/product/${editId}`}
              className="btn btn-outline"
              style={{
                marginTop: 12,
                display: "inline-flex",
              }}
            >
              Cancel editing
            </Link>
          )}

          <p className="disclaimer">
            Your listing will be saved in
            CampusMart's database. Online
            payments are not enabled.
          </p>
        </form>

        <aside className="seller-tips">
          <h3>Seller's corner 💜</h3>

          <p>
            Good photos, clear descriptions,
            and fair prices help your listing
            stand out.
          </p>

          <div className="tip">
            <CheckCircle2 size={18} />
            Take clear photos in good lighting.
          </div>

          <div className="tip">
            <CheckCircle2 size={18} />
            Describe any scratches or wear.
          </div>

          <div className="tip">
            <CheckCircle2 size={18} />
            Mention included accessories.
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
            {products.length} listings on CampusMart
          </div>
        </aside>
      </div>
    </div>
  );
}

// ========================================
// PROTECTED MARKETPLACE PAGE
// ========================================

function MarketplacePage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

// ========================================
// MAIN APP
// ========================================

export default function App() {
  const checkAuth = useAuth(
    (state) => state.checkAuth
  );

  const user = useAuth(
    (state) => state.user
  );

  const loading = useAuth(
    (state) => state.loading
  );

  const [authChecked, setAuthChecked] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        await checkAuth();
      } catch (error) {
        console.error(
          "Authentication check failed:",
          error
        );
      } finally {
        if (active) {
          setAuthChecked(true);
        }
      }
    }

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
  path="/messages"
  element={
    <MarketplacePage>
      <Messages />
    </MarketplacePage>
  }
/> 
      <Route
  path="/my-listings"
  element={
    <MarketplacePage>
      <MyListings />
    </MarketplacePage>
  }
/>
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

      {/* EDIT LISTING */}

      <Route
        path="/product/:id/edit"
        element={
          <MarketplacePage>
            <Sell editing />
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
