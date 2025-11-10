import React, { useState } from "react";

type Props = {
  onLoginSuccess: (token: string) => void;
};

export default function ConductorLogin({ onLoginSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDirectAccess = () => {
    // For conductor, we can allow direct access without login
    // Or use a simple passcode
    setLoading(true);
    setTimeout(() => {
      onLoginSuccess("conductor-access");
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        padding: "60px 50px",
        maxWidth: "450px",
        width: "100%",
        textAlign: "center"
      }}>
        <div style={{
          width: "100px",
          height: "100px",
          margin: "0 auto 30px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "3rem",
          boxShadow: "0 10px 30px rgba(102,126,234,0.4)"
        }}>
          🚌
        </div>

        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: "#1f2937",
          margin: "0 0 12px 0"
        }}>
          Conductor Panel
        </h1>

        <p style={{
          color: "#6b7280",
          fontSize: "1.1rem",
          margin: "0 0 40px 0",
          lineHeight: "1.6"
        }}>
          Validate bus passes at entry
        </p>

        <button
          onClick={handleDirectAccess}
          disabled={loading}
          style={{
            width: "100%",
            padding: "18px 30px",
            fontSize: "1.2rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 8px 20px rgba(102,126,234,0.4)",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(102,126,234,0.5)";
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(102,126,234,0.4)";
          }}
        >
          {loading ? "⏳ Loading..." : "🎫 Access Panel"}
        </button>

        <div style={{
          marginTop: "30px",
          padding: "20px",
          background: "#f3f4f6",
          borderRadius: "12px",
          textAlign: "left"
        }}>
          <div style={{
            fontSize: "0.9rem",
            color: "#6b7280",
            marginBottom: "8px",
            fontWeight: "600"
          }}>
            📋 Instructions:
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: "20px",
            color: "#6b7280",
            fontSize: "0.9rem",
            lineHeight: "1.8"
          }}>
            <li>Ensure EM-18 reader is connected</li>
            <li>Click "Access Panel" to start</li>
            <li>Tap passenger card to validate</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
