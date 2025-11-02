import React, { useState } from "react";

type Props = {
  onSuccess?: () => void;
  onLoginSuccess?: () => void;
  onBack?: () => void;
};

export default function CollegeLogin({ onSuccess, onLoginSuccess, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const email = data.get("email");
    const password = data.get("password");

    fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.token) {
          localStorage.setItem("sbp_token", json.token);
          localStorage.setItem("sbp_role", json.user.role);
          if (onLoginSuccess) onLoginSuccess();
          if (onSuccess) onSuccess();
        } else {
          setError(json.error || "Login failed. Please try again.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Network error. Please check your connection.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0f4ff, #f8f4ff)",
      padding: "20px",
      position: "relative"
    }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(255, 255, 255, 0.9)",
          border: "none",
          borderRadius: "8px",
          padding: "10px 16px",
          fontSize: "0.9rem",
          fontWeight: "600",
          color: "#3b82f6",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        }}
      >
        ← Back
      </button>

      <div style={{
        width: "100%",
        maxWidth: "420px"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          color: "#fff",
          padding: "32px",
          borderRadius: "16px 16px 0 0",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(59,130,246,0.15)"
        }}>
          <div style={{
            fontSize: "2.5rem",
            marginBottom: "12px"
          }}>🏢</div>
          <h1 style={{
            fontSize: "1.8rem",
            fontWeight: "700",
            margin: "0 0 8px 0"
          }}>
            College Portal
          </h1>
          <p style={{
            margin: 0,
            opacity: 0.9,
            fontSize: "0.95rem"
          }}>
            Manage student registrations
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: "#fff",
          padding: "32px",
          borderRadius: "0 0 16px 16px",
          boxShadow: "0 10px 30px rgba(59,130,246,0.1)"
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "0.9rem",
              animation: "slideUp 0.3s ease-out"
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "600",
                color: "#0b1220",
                marginBottom: "8px"
              }}>
                📧 Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="college@smartbus.local"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "0.95rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                  outline: "none"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: "28px" }}>
              <label style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "600",
                color: "#0b1220",
                marginBottom: "8px"
              }}>
                🔐 Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "0.95rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease",
                  outline: "none"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "1rem",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                background: loading ? "#d1d5db" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(59,130,246,0.2)"
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.3)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.2)";
                }
              }}
            >
              {loading ? "⏳ Signing in..." : "🔓 Sign In"}
            </button>
          </form>

          {/* Demo Credentials */}
          <div style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid #e5e7eb",
            background: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            color: "#6b7280"
          }}>
            <div style={{ fontWeight: "600", marginBottom: "8px", color: "#374151" }}>
              📝 Demo Credentials:
            </div>
            <div>Email: <code style={{ background: "#fff", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace" }}>college@smartbus.local</code></div>
            <div>Password: <code style={{ background: "#fff", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace" }}>password</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
