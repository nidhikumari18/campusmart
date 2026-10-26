
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { useAuth } from "../store/useAuth";

export default function Signup() {
  const navigate = useNavigate();
  const register = useAuth((state) => state.register);

  const [form, setForm] = useState({
    name: "",
    email: "",
    college: "IGDTUW",
    password: "",
    confirmPassword: "",
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

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        college: form.college,
        password: form.password,
      });

      navigate("/", { replace: true });
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
          ✦ JOIN THE CAMPUS COMMUNITY
        </span>

        <h1>Create your account ✿</h1>

        <p className="muted">
          Your next campus favorite is waiting for you.
        </p>

        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}

        <label>
          Full name
          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={update}
            required
            maxLength={80}
            autoComplete="name"
          />
        </label>

        <label>
          College email
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
          College
          <input
            type="text"
            name="college"
            value={form.college}
            onChange={update}
            required
            maxLength={120}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={update}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            name="confirmPassword"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={update}
            required
            autoComplete="new-password"
          />
        </label>

        <button
          className="btn btn-primary full"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Creating account..." : "Sign up"}
          <ArrowRight size={17} />
        </button>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </p>

        <p className="disclaimer">
          Your email is not verified yet.
          Never share your password or OTP.
        </p>
      </form>
    </div>
  );
}
