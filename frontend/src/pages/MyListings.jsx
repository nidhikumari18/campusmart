
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Package,
  CheckCircle2,
  Clock3,
  ShoppingBag,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";

import { useShop, productImage } from "../store/useShop";
import { useAuth } from "../store/useAuth";

const STATUSES = ["Available", "Reserved", "Sold"];

const statusColors = {
  Available: {
    bg: "#e7f8ef",
    color: "#19794a",
  },
  Reserved: {
    bg: "#fff1d9",
    color: "#9b650d",
  },
  Sold: {
    bg: "#f0e8fa",
    color: "#7854a3",
  },
};

export default function MyListings() {
  const user = useAuth((state) => state.user);

  const products = useShop((state) => state.products);
  const loadProducts = useShop((state) => state.loadProducts);
  const deleteProduct = useShop((state) => state.deleteProduct);
  const updateProductStatus = useShop(
    (state) => state.updateProductStatus
  );
  const productsLoading = useShop(
    (state) => state.productsLoading
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts().catch((err) => {
      setError(err.message);
    });
  }, [loadProducts]);

  const myProducts = useMemo(() => {
    const userId = String(user?._id || user?.id || "");

    if (!userId) return [];

    return products.filter((product) => {
      const sellerId = String(product.sellerId || "");
      return sellerId === userId;
    });
  }, [products, user]);

  const stats = useMemo(() => {
    return {
      total: myProducts.length,
      available: myProducts.filter(
        (product) =>
          (product.status || "Available") === "Available"
      ).length,
      reserved: myProducts.filter(
        (product) => product.status === "Reserved"
      ).length,
      sold: myProducts.filter(
        (product) => product.status === "Sold"
      ).length,
    };
  }, [myProducts]);

  const visibleProducts = useMemo(() => {
    return myProducts.filter((product) => {
      const matchesSearch = `${product.title} ${
        product.category || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        (product.status || "Available") === filter;

      return matchesSearch && matchesFilter;
    });
  }, [myProducts, search, filter]);

  async function handleStatusChange(product, newStatus) {
    if (newStatus === (product.status || "Available")) {
      return;
    }

    setBusyId(product.id);
    setMessage("");
    setError("");

    try {
      await updateProductStatus(product.id, newStatus);
      setMessage(
        `"${product.title}" marked as ${newStatus}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.title}" permanently?`
    );

    if (!confirmed) return;

    setBusyId(product.id);
    setMessage("");
    setError("");

    try {
      await deleteProduct(product.id);
      setMessage("Listing deleted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRefresh() {
    setMessage("");
    setError("");

    try {
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="listings-page">
      <div className="container">
        <div className="listings-top">
          <div>
            <div className="listings-eyebrow">
              ✦ YOUR LITTLE SHOP
            </div>

            <h1>
              My <span>Listings</span> ✿
            </h1>

            <p>
              Manage your campus finds, update their
              availability, and keep your shop organized.
            </p>
          </div>

          <Link to="/sell" className="listings-add">
            <Plus size={18} />
            List an item
          </Link>
        </div>

        {/* STATISTICS */}

        <div className="listings-stats">
          <div className="listings-stat">
            <Package size={21} />
            <strong>{stats.total}</strong>
            <span>Total listings</span>
          </div>

          <div className="listings-stat">
            <CheckCircle2 size={21} />
            <strong>{stats.available}</strong>
            <span>Available</span>
          </div>

          <div className="listings-stat">
            <Clock3 size={21} />
            <strong>{stats.reserved}</strong>
            <span>Reserved</span>
          </div>

          <div className="listings-stat">
            <ShoppingBag size={21} />
            <strong>{stats.sold}</strong>
            <span>Sold</span>
          </div>
        </div>

        {/* NOTIFICATIONS */}

        {message && (
          <div className="listings-notice success">
            {message}
          </div>
        )}

        {error && (
          <div className="listings-notice error">
            {error}
          </div>
        )}

        {/* SEARCH AND FILTER */}

        <div className="listings-toolbar">
          <div className="listings-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search your listings..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="listings-filters">
            {["All", ...STATUSES].map((status) => (
              <button
                key={status}
                type="button"
                className={
                  filter === status ? "selected" : ""
                }
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="listings-refresh"
            onClick={handleRefresh}
            disabled={productsLoading}
            title="Refresh listings"
          >
            <RefreshCw
              size={18}
              className={
                productsLoading ? "spin" : ""
              }
            />
          </button>
        </div>

        {/* PRODUCT GRID */}

        {productsLoading && myProducts.length === 0 ? (
          <div className="listings-empty">
            <RefreshCw size={30} />
            <h3>Loading your listings...</h3>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="listings-empty">
            <LayoutGrid size={35} />
            <h3>
              {myProducts.length === 0
                ? "Your selling journey starts here!"
                : "No matching listings"}
            </h3>

            <p>
              {myProducts.length === 0
                ? "List something you no longer need and give it a new home."
                : "Try a different search or status filter."}
            </p>

            {myProducts.length === 0 && (
              <Link to="/sell" className="listings-add">
                <Plus size={17} />
                Create your first listing
              </Link>
            )}
          </div>
        ) : (
          <div className="listings-grid">
            {visibleProducts.map((product) => {
              const status =
                product.status || "Available";

              const colors = statusColors[status] ||
                statusColors.Available;

              return (
                <article
                  key={product.id}
                  className="listings-card"
                >
                  <div className="listings-image">
                    {productImage(product) ? (
                      <img
                        src={productImage(product)}
                        alt={product.title}
                      />
                    ) : (
                      <div className="listings-placeholder">
                        <Package size={38} />
                      </div>
                    )}

                    <span
                      className="listings-status"
                      style={{
                        background: colors.bg,
                        color: colors.color,
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="listings-card-body">
                    <div className="listings-category">
                      {product.category}
                    </div>

                    <h3>{product.title}</h3>

                    <div className="listings-price">
                      ₹{Number(product.price).toLocaleString("en-IN")}

                      {product.original &&
                        product.original > product.price && (
                          <del>
                            ₹{Number(
                              product.original
                            ).toLocaleString("en-IN")}
                          </del>
                        )}
                    </div>

                    <label className="listings-status-label">
                      Availability
                    </label>

                    <select
                      className="listings-select"
                      value={status}
                      disabled={busyId === product.id}
                      onChange={(event) =>
                        handleStatusChange(
                          product,
                          event.target.value
                        )
                      }
                    >
                      {STATUSES.map((option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      ))}
                    </select>

                    <div className="listings-actions">
                      <Link
                        to={`/product/${product.id}`}
                        className="listings-action"
                      >
                        <ExternalLink size={16} />
                        View
                      </Link>

                      <Link
                        to={`/product/${product.id}/edit`}
                        className="listings-action"
                      >
                        <Pencil size={16} />
                        Edit
                      </Link>

                      <button
                        type="button"
                        className="listings-action delete"
                        disabled={busyId === product.id}
                        onClick={() =>
                          handleDelete(product)
                        }
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .listings-page {
          padding: 44px 0 90px;
          color: var(--text, #292337);
        }

        .listings-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 30px;
        }

        .listings-eyebrow {
          color: #9a78bd;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }

        .listings-top h1 {
          font-size: clamp(30px, 4vw, 44px);
          margin: 0 0 12px;
          letter-spacing: -1px;
        }

        .listings-top h1 span {
          color: #a782d2;
        }

        .listings-top p {
          color: var(--muted, #888194);
          max-width: 520px;
          line-height: 1.7;
        }

        .listings-add {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 13px 19px;
          border-radius: 15px;
          background: #a782d2;
          color: white;
          text-decoration: none;
          font-weight: 700;
          white-space: nowrap;
          transition: transform .2s, background .2s;
        }

        .listings-add:hover {
          background: #936bc4;
          transform: translateY(-2px);
        }

        .listings-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 28px;
        }

        .listings-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          padding: 23px;
          border: 1px solid var(--border, #ece5f4);
          border-radius: 20px;
          background: var(--card, #fff);
        }

        .listings-stat svg {
          color: #a782d2;
        }

        .listings-stat strong {
          font-size: 29px;
        }

        .listings-stat span {
          font-size: 13px;
          color: var(--muted, #888194);
        }

        .listings-notice {
          padding: 13px 17px;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .listings-notice.success {
          background: #e9f8ef;
          color: #247a4b;
        }

        .listings-notice.error {
          background: #fff0f0;
          color: #b33b45;
        }

        .listings-toolbar {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .listings-search {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 180px;
          padding: 12px 15px;
          background: var(--card, #fff);
          border: 1px solid var(--border, #ece5f4);
          border-radius: 13px;
        }

        .listings-search svg {
          color: #a782d2;
          flex-shrink: 0;
        }

        .listings-search input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: inherit;
          font: inherit;
        }

        .listings-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .listings-filters button,
        .listings-refresh {
          padding: 11px 14px;
          border: 1px solid var(--border, #ece5f4);
          border-radius: 12px;
          background: var(--card, #fff);
          color: inherit;
          cursor: pointer;
          font: inherit;
        }

        .listings-filters button.selected {
          background: #a782d2;
          color: white;
          border-color: #a782d2;
        }

        .listings-refresh {
          display: flex;
          align-items: center;
        }

        .listings-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .listings-card {
          overflow: hidden;
          border-radius: 21px;
          background: var(--card, #fff);
          border: 1px solid var(--border, #ece5f4);
          transition: transform .2s;
        }

        .listings-card:hover {
          transform: translateY(-3px);
        }

        .listings-image {
          position: relative;
          height: 210px;
          background: #f0eaf7;
        }

        .listings-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .listings-placeholder {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: #a782d2;
        }

        .listings-status {
          position: absolute;
          top: 14px;
          left: 14px;
          padding: 7px 12px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 800;
        }

        .listings-card-body {
          padding: 20px;
        }

        .listings-category {
          color: #a782d2;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .listings-card h3 {
          font-size: 18px;
          margin: 9px 0;
          line-height: 1.4;
        }

        .listings-price {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 21px;
          font-weight: 800;
          margin-bottom: 19px;
        }

        .listings-price del {
          color: var(--muted, #999);
          font-size: 13px;
          font-weight: 400;
        }

        .listings-status-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--muted, #888194);
        }

        .listings-select {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--border, #e6dbee);
          background: var(--card, #fff);
          color: inherit;
          font: inherit;
          cursor: pointer;
          outline-color: #a782d2;
        }

        .listings-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 18px;
        }

        .listings-action {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 5px;
          padding: 10px 6px;
          border: 1px solid var(--border, #e6dbee);
          border-radius: 11px;
          background: transparent;
          color: inherit;
          text-decoration: none;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .listings-action:hover {
          background: rgba(167, 130, 210, .12);
        }

        .listings-action.delete {
          color: #c35a70;
        }

        .listings-action:disabled,
        .listings-select:disabled {
          opacity: .55;
          cursor: wait;
        }

        .listings-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 13px;
          padding: 75px 20px;
          border: 1px dashed #cdb8e5;
          border-radius: 23px;
          color: #a782d2;
        }

        .listings-empty h3 {
          color: var(--text, #292337);
          margin: 0;
        }

        .listings-empty p {
          color: var(--muted, #888194);
          margin: 0 0 12px;
        }

        .spin {
          animation: listings-spin 1s linear infinite;
        }

        @keyframes listings-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 950px) {
          .listings-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .listings-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .listings-page {
            padding-top: 25px;
          }

          .listings-top {
            align-items: flex-start;
            flex-direction: column;
          }

          .listings-grid {
            grid-template-columns: 1fr;
          }

          .listings-toolbar {
            align-items: stretch;
          }

          .listings-search {
            flex-basis: 100%;
          }

          .listings-stat {
            padding: 17px;
          }
        }
      `}</style>
    </div>
  );
}
