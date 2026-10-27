
import React, { useEffect, useState, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import {
  ShoppingBag,
  Heart,
  Moon,
  Sun,
  UserRound,
  Plus,
  Search,
  Package,
  LogOut,
  LayoutGrid,
  MessageCircle,
} from "lucide-react";

import { useShop } from "../store/useShop";
import { useAuth } from "../store/useAuth";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function Layout({ children }) {
  const navigate = useNavigate();

  const { theme, toggleTheme, cart, wishlist } = useShop();

  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);

  const [unreadCount, setUnreadCount] = useState(0);

  const userId = String(user?._id || user?.id || "");

  // ========================================
  // THEME
  // ========================================

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  // ========================================
  // LOAD UNREAD MESSAGE COUNT
  // ========================================

  const loadUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/messages/unread-count`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        // The endpoint will be added next.
        return;
      }

      const data = await response.json();

      setUnreadCount(
        Math.max(0, Number(data.unreadCount) || 0)
      );
    } catch (error) {
      console.error(
        "Unable to load unread messages:",
        error.message
      );
    }
  }, [userId]);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // ========================================
  // REAL-TIME NOTIFICATIONS
  // ========================================

  useEffect(() => {
    if (!userId) return;

    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      loadUnreadCount();
    });

    socket.on("message:new", () => {
      loadUnreadCount();
    });

    socket.on("conversation:read", () => {
      loadUnreadCount();
    });

    socket.on("conversation:updated", () => {
      loadUnreadCount();
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [userId, loadUnreadCount]);

  // Refresh count when the tab becomes active.
  useEffect(() => {
    if (!userId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadUnreadCount();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [userId, loadUnreadCount]);

  // ========================================
  // LOGOUT
  // ========================================

  async function handleLogout() {
    try {
      await logout();
      setUnreadCount(0);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // ========================================
  // UNREAD BADGE
  // ========================================

  const unreadLabel =
    unreadCount > 99 ? "99+" : unreadCount;

  const unreadBadge = unreadCount > 0 && (
    <span
      aria-label={`${unreadCount} unread messages`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 19,
        height: 19,
        padding: "0 5px",
        borderRadius: 999,
        background: "#a78bfa",
        color: "#fff",
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {unreadLabel}
    </span>
  );

  return (
    <>
      {/* DESKTOP HEADER */}

      <header className="header">
        <div className="header-inner">

          {/* LOGO */}

          <Link className="brand" to="/home">
            <span className="brand-icon">✿</span>
            campus<span>mart</span>
            <small>✦</small>
          </Link>

          {/* DESKTOP NAVIGATION */}

          <nav className="nav">
            <NavLink to="/home">
              Explore
            </NavLink>

            <NavLink to="/sell">
              Sell an item
            </NavLink>

            <NavLink to="/my-listings">
              My Listings
            </NavLink>

            <NavLink to="/orders">
              My orders
            </NavLink>

            <NavLink
              to="/messages"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              Messages
              {unreadBadge}
            </NavLink>
          </nav>

          {/* HEADER ACTIONS */}

          <div className="header-actions">

            {/* DARK MODE */}

            <button
              type="button"
              className="icon-button"
              title="Toggle theme"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === "light" ? (
                <Moon size={19} />
              ) : (
                <Sun size={19} />
              )}
            </button>

            {/* MESSAGES */}

            <Link
              className="icon-button"
              title={
                unreadCount > 0
                  ? `${unreadCount} unread messages`
                  : "Messages"
              }
              aria-label={
                unreadCount > 0
                  ? `Messages, ${unreadCount} unread`
                  : "Messages"
              }
              to="/messages"
              style={{
                position: "relative",
              }}
            >
              <MessageCircle size={19} />

              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -7,
                    minWidth: 17,
                    height: 17,
                    padding: "0 4px",
                    borderRadius: 999,
                    background: "#a78bfa",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--card, #fff)",
                  }}
                >
                  {unreadLabel}
                </span>
              )}
            </Link>

            {/* WISHLIST */}

            <Link
              className="icon-button"
              title="Wishlist"
              aria-label="Wishlist"
              to="/wishlist"
            >
              <Heart size={19} />

              {wishlist.length > 0 && (
                <i>{wishlist.length}</i>
              )}
            </Link>

            {/* CART */}

            <Link
              className="icon-button"
              title="Cart"
              aria-label="Cart"
              to="/cart"
            >
              <ShoppingBag size={19} />

              {cart.length > 0 && (
                <i>{cart.length}</i>
              )}
            </Link>

            {/* USER PROFILE */}

            <div
              className="profile-pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <UserRound size={17} />

              <span>
                {user?.name || "Student"}
              </span>
            </div>

            {/* LOGOUT */}

            {user && (
              <button
                type="button"
                className="icon-button"
                title="Sign out"
                aria-label="Sign out"
                onClick={handleLogout}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN PAGE */}

      <main>{children}</main>

      {/* FOOTER */}

      <footer>
        <div className="container footer-inner">
          <div>
            <b>✿ campusmart</b>

            <p>
              Pre-loved finds, new beginnings.
              Made for campus life.
            </p>
          </div>

          <span>
            Student-to-student marketplace ·
            No real payments yet
          </span>
        </div>
      </footer>

      {/* MOBILE NAVIGATION */}

      <nav className="mobile-nav">

        <NavLink to="/home">
          <Search size={20} />
          Explore
        </NavLink>

        <NavLink to="/wishlist">
          <Heart size={20} />
          Saved
        </NavLink>

        <NavLink to="/sell">
          <Plus size={20} />
          Sell
        </NavLink>

        <NavLink
          to="/messages"
          style={{
            position: "relative",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "inline-flex",
            }}
          >
            <MessageCircle size={20} />

            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -9,
                  right: -13,
                  minWidth: 17,
                  height: 17,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "#a78bfa",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadLabel}
              </span>
            )}
          </span>
          Messages
        </NavLink>

        <NavLink to="/my-listings">
          <LayoutGrid size={20} />
          Listings
        </NavLink>

        <NavLink to="/orders">
          <Package size={20} />
          Orders
        </NavLink>

        <NavLink to="/cart">
          <ShoppingBag size={20} />
          Cart
        </NavLink>

      </nav>
    </>
  );
}
