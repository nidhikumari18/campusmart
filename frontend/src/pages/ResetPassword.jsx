
import React, { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { LockKeyhole, ArrowRight } from "lucide-react";

const API = "http://localhost:5000/api/auth";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/reset-password/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reset password"
        );
      }

      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cm-auth-simple">
      <div className="cm-auth-simple-card">
        <div className="cm-auth-simple-icon">
          <LockKeyhole size={30} />
        </div>

        <span className="cm-form-eyebrow">
          CAMPUSMART SECURITY
        </span>

        <h1>Create a new password</h1>

        <p>
          Choose a secure password with at least
          8 characters.
        </p>

        <form onSubmit={submit} className="cm-auth-form">
          <div className="cm-field">
            <label htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </div>

          <div className="cm-field">
            <label htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="cm-auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="cm-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update password"}
            <ArrowRight size={17} />
          </button>
        </form>

        <Link to="/login" className="cm-auth-back">
          Back to Sign In
        </Link>
      </div>
    </main>
  );
}
