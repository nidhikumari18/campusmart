
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  ShoppingBag,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send reset link."
        );
      }

      setSent(true);
    } catch (err) {
      setError(
        err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-page">
      <div className="forgot-container">
        {/* LOGO */}

        <Link to="/login" className="forgot-brand">
          <div className="forgot-brand-icon">
            <ShoppingBag size={21} />
          </div>

          <span>campusmart.</span>
        </Link>

        {/* CARD */}

        <section className="forgot-card">
          {!sent ? (
            <>
              <div className="forgot-icon">
                <LockKeyhole size={25} />
              </div>

              <h1>Forgot password?</h1>

              <p className="forgot-description">
                No worries. Enter the email address
                associated with your account and we'll
                send you a password reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="forgot-field">
                  <label htmlFor="forgot-email">
                    Email address
                  </label>

                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email address"
                    autoComplete="email"
                    required
                  />
                </div>

                {error && (
                  <div
                    className="forgot-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="forgot-button"
                  disabled={loading}
                >
                  {loading
                    ? "Sending..."
                    : "Send reset link"}

                  {!loading && (
                    <ArrowRight size={18} />
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="forgot-icon forgot-success-icon">
                <CheckCircle2 size={27} />
              </div>

              <h1>Check your email</h1>

              <p className="forgot-description">
                If an account exists for{" "}
                <strong>{email}</strong>, we'll send
                a password reset link shortly.
              </p>

              <p className="forgot-help">
                Please check your inbox and spam folder.
                The link will expire after 15 minutes.
              </p>

              <button
                type="button"
                className="forgot-button"
                onClick={() => {
                  setSent(false);
                  setError("");
                }}
              >
                Try another email
              </button>
            </>
          )}

          <Link to="/login" className="forgot-back">
            <ArrowLeft size={17} />
            Back to sign in
          </Link>
        </section>

        <p className="forgot-footer">
          © {new Date().getFullYear()} CampusMart.
          All rights reserved.
        </p>
      </div>
    </main>
  );
}
