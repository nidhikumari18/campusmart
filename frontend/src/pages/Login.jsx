
import React, { useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { useAuth } from "../store/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuth((state) => state.login);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form);

      const destination =
        location.state?.from || "/";

      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container auth-page">
      <form
        className="form-card auth-card"
        onSubmit={submit}
      >
        <span className="eyebrow">
          ✦ WELCOME BACK TO CAMPUSMART
        </span>

        <h1>Hi again! ♡</h1>

        <p className="muted">
          Log in to continue your campus shopping journey.
        </p>

        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}

        <label>
          Email address
          <input
            type="email"
            name="email"
            placeholder="you@college.ac.in"
            value={form.email}
            onChange={update}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={update}
            required
            autoComplete="current-password"
          />
        </label>

        <button
          className="btn btn-primary full"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Logging in..." : "Log in"}
          <ArrowRight size={17} />
        </button>

        <p className="auth-switch">
          New to CampusMart?{" "}
          <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
