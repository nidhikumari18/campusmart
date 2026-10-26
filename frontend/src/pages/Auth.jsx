
import React, { useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  ShoppingBag,
  BookOpen,
  Headphones,
  Laptop,
} from "lucide-react";

import { useAuth } from "../store/useAuth";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);

  const [mode, setMode] = useState(
    location.pathname === "/signup" ? "signup" : "login"
  );

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    college: "",
    password: "",
    confirmPassword: "",
  });

  const update = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const changeMode = (next) => {
    setMode(next);
    setError("");
    setShowPassword(false);

    navigate(next === "signup" ? "/signup" : "/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      mode === "signup" &&
      form.password !== form.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await login({
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          college: form.college.trim(),
          password: form.password,
        });
      }

      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cm-auth">
      {/* LEFT VISUAL PANEL */}

      <section className="cm-auth-visual">
        <div className="cm-auth-brand">
          <div className="cm-brand-mark">
            <ShoppingBag size={22} strokeWidth={2.2} />
          </div>
          <span>campusmart.</span>
        </div>

        <div className="cm-visual-content">
          <span className="cm-visual-label">
            THE STUDENT MARKETPLACE
          </span>

          <h1>
            Your campus.
            <br />
            Your marketplace.
          </h1>

          <p>
            Discover great finds, sell what you no
            longer need, and connect with students
            across your campus.
          </p>

          <div className="cm-art-scene">
            <div className="cm-art-glow" />
            <div className="cm-art-orbit cm-orbit-one" />
            <div className="cm-art-orbit cm-orbit-two" />

            <div className="cm-art-card cm-card-books">
              <div className="cm-art-icon cm-icon-books">
                <BookOpen size={43} strokeWidth={1.7} />
              </div>
              <span>Books</span>
            </div>

            <div className="cm-art-card cm-card-tech">
              <div className="cm-art-icon cm-icon-tech">
                <Laptop size={47} strokeWidth={1.6} />
              </div>
              <span>Electronics</span>
            </div>

            <div className="cm-art-card cm-card-audio">
              <div className="cm-art-icon cm-icon-audio">
                <Headphones size={43} strokeWidth={1.7} />
              </div>
              <span>Accessories</span>
            </div>

            <div className="cm-art-center">
              <div className="cm-art-bag">
                <ShoppingBag size={88} strokeWidth={1.25} />
              </div>
              <span>CampusMart</span>
            </div>

            <div className="cm-art-platform" />
          </div>
        </div>

        <div className="cm-visual-footer">
          <ShieldCheck size={17} />
          Built for student communities
        </div>
      </section>

      {/* RIGHT AUTHENTICATION PANEL */}

      <section className="cm-auth-panel">
        <div className="cm-auth-form-wrap">
          <div className="cm-mobile-brand">
            <ShoppingBag size={23} />
            campusmart.
          </div>

          <span className="cm-form-eyebrow">
            {mode === "login"
              ? "WELCOME BACK"
              : "JOIN THE COMMUNITY"}
          </span>

          <h2>
            {mode === "login"
              ? "Sign in to CampusMart"
              : "Create your account"}
          </h2>

          <p className="cm-form-subtitle">
            {mode === "login"
              ? "Access your marketplace and discover what's new."
              : "Start buying and selling within your student community."}
          </p>

          {/* SIGN IN / SIGN UP TABS */}

          <div className="cm-auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => changeMode("login")}
            >
              Sign In
            </button>

            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => changeMode("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* AUTH FORM */}

          <form
            className="cm-auth-form"
            onSubmit={handleSubmit}
          >
            {mode === "signup" && (
              <div className="cm-field">
                <label htmlFor="cm-name">
                  Full name
                </label>

                <input
                  id="cm-name"
                  name="name"
                  value={form.name}
                  onChange={update}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  maxLength={80}
                />
              </div>
            )}

            {/* ANY EMAIL ADDRESS */}

            <div className="cm-field">
              <label htmlFor="cm-email">
                Email address
              </label>

              <input
                id="cm-email"
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            {/* COLLEGE NAME OPTIONAL */}

            {mode === "signup" && (
              <div className="cm-field">
                <label htmlFor="cm-college">
                  College name (optional)
                </label>

                <input
                  id="cm-college"
                  name="college"
                  value={form.college}
                  onChange={update}
                  placeholder="Enter your college name"
                  maxLength={120}
                />
              </div>
            )}

            {/* PASSWORD */}

            <div className="cm-field">
              <label htmlFor="cm-password">
                Password
              </label>

              <div className="cm-password-field">
                <input
                  id="cm-password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  name="password"
                  value={form.password}
                  onChange={update}
                  placeholder="Enter your password"
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={
                    mode === "signup" ? 8 : undefined
                  }
                  maxLength={128}
                  required
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* FORGOT PASSWORD */}

            {mode === "login" && (
              <div className="cm-forgot-link">
                <Link to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            )}

            {/* CONFIRM PASSWORD */}

            {mode === "signup" && (
              <div className="cm-field">
                <label htmlFor="cm-confirm">
                  Confirm password
                </label>

                <input
                  id="cm-confirm"
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={update}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            {/* ERROR MESSAGE */}

            {error && (
              <p className="cm-auth-error" role="alert">
                {error}
              </p>
            )}

            {/* SUBMIT BUTTON */}

            <button
              className="cm-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}

              <ArrowRight size={19} />
            </button>
          </form>

          {/* SWITCH AUTH MODE */}

          <p className="cm-auth-switch">
            {mode === "login"
              ? "New to CampusMart?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() =>
                changeMode(
                  mode === "login" ? "signup" : "login"
                )
              }
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>

          <p className="cm-auth-note">
            Secure sign-in for the CampusMart community.
            Use any valid email address to create your account.
          </p>
        </div>
      </section>
    </main>
  );
}
