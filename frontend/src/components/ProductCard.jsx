
import React from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Check,
  Clock3,
  PackageCheck,
} from "lucide-react";

import {
  useShop,
  productImage,
  isProductAvailable,
} from "../store/useShop";

export default function ProductCard({ p }) {
  const wishlist = useShop((s) => s.wishlist);
  const toggleWishlist = useShop(
    (s) => s.toggleWishlist
  );
  const addCart = useShop((s) => s.addCart);
  const cart = useShop((s) => s.cart);

  const id = String(p.id || p._id);
  const isLiked = wishlist.includes(id);
  const inCart = cart.includes(id);

  const image = productImage(p);

  const status = p.status || "Available";
  const available = isProductAvailable(p);
  const isSold = status === "Sold";
  const isReserved = status === "Reserved";

  const price = Number(p.price);
  const original = Number(p.original);

  const validPrice = Number.isFinite(price)
    ? price
    : 0;

  const showOriginal =
    p.original !== null &&
    p.original !== undefined &&
    p.original !== "" &&
    Number.isFinite(original) &&
    original > validPrice;

  const statusStyles = {
    Available: {
      background: "#e4f8ed",
      color: "#23794e",
    },
    Reserved: {
      background: "#fff0d7",
      color: "#98620e",
    },
    Sold: {
      background: "#f0e5fa",
      color: "#7952a6",
    },
  };

  const badgeStyle =
    statusStyles[status] ||
    statusStyles.Available;

  function handleAddToCart() {
    if (!available || inCart) return;
    addCart(id);
  }

  return (
    <article className="product-card">
      {/* PRODUCT IMAGE */}

      <div
        className="product-art"
        style={{
          background: p.color || "#E9DDFC",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Link
          to={`/product/${id}`}
          className="product-emoji"
          aria-label={`View ${p.title}`}
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={p.title}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: isSold
                  ? "grayscale(55%)"
                  : "none",
                opacity: isSold ? 0.7 : 1,
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 65,
                opacity: isSold ? 0.5 : 1,
              }}
            >
              {p.emoji || "📦"}
            </span>
          )}
        </Link>

        {/* CONDITION BADGE */}

        <span className="condition">
          {p.condition || "Good"}
        </span>

        {/* WISHLIST BUTTON */}

        <button
          type="button"
          className={
            "heart-button " +
            (isLiked ? "liked" : "")
          }
          onClick={() => toggleWishlist(id)}
          aria-label={
            isLiked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          style={{
            position: "absolute",
            right: 12,
            top: 12,
            zIndex: 3,
          }}
        >
          <Heart
            size={19}
            fill={
              isLiked ? "currentColor" : "none"
            }
          />
        </button>

        {/* SOLD OVERLAY */}

        {isSold && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(36, 27, 49, 0.24)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <span
              style={{
                padding: "12px 25px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.94)",
                color: "#7952a6",
                fontWeight: 900,
                fontSize: 22,
                letterSpacing: 2,
                transform: "rotate(-8deg)",
                boxShadow:
                  "0 8px 30px rgba(0,0,0,0.12)",
              }}
            >
              SOLD
            </span>
          </div>
        )}
      </div>

      {/* PRODUCT INFORMATION */}

      <div className="product-info">
        <div className="product-meta">
          {p.category || "Other"} ·{" "}
          {p.college || "Campus"}
        </div>

        <Link
          to={`/product/${id}`}
          className="product-title"
        >
          {p.title}
        </Link>

        {/* AVAILABILITY BADGE */}

        <div style={{ marginTop: 11 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 11px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800,
              background: badgeStyle.background,
              color: badgeStyle.color,
            }}
          >
            {available ? (
              <Check size={14} />
            ) : isReserved ? (
              <Clock3 size={14} />
            ) : (
              <PackageCheck size={14} />
            )}

            {status}
          </span>
        </div>

        {/* PRICE AND CART */}

        <div className="product-bottom">
          <div>
            <strong>
              ₹{validPrice.toLocaleString("en-IN")}
            </strong>

            {showOriginal && (
              <s style={{ marginLeft: 7 }}>
                ₹{original.toLocaleString("en-IN")}
              </s>
            )}
          </div>

          <button
            type="button"
            className="mini-cart"
            title={
              isSold
                ? "This item has been sold"
                : isReserved
                ? "This item is reserved"
                : inCart
                ? "Already in cart"
                : "Add to cart"
            }
            onClick={handleAddToCart}
            disabled={!available || inCart}
            aria-label={
              isSold
                ? "Sold out"
                : isReserved
                ? "Item reserved"
                : inCart
                ? "Already in cart"
                : "Add to cart"
            }
            style={{
              opacity:
                !available || inCart ? 0.55 : 1,
              cursor:
                !available || inCart
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {inCart ? (
              <Check size={17} />
            ) : (
              <ShoppingBag size={17} />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
