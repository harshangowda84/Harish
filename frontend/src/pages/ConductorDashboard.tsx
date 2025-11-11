import React, { useState } from "react";

// Helper function to format date as DD-MM-YYYY
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

type Props = {
  onLogout?: () => void;
};

interface PassInfo {
  valid: boolean;
  id?: number;
  type?: "student" | "passenger";
  passengerName?: string;
  passType?: string;
  passNumber?: string;
  validUntil?: string;
  status?: string;
  message?: string;
  photoPath?: string | null;
  renewed?: boolean;
  rfidUid?: string;
}

export default function ConductorDashboard({ onLogout }: Props) {
  const [scanning, setScanning] = useState(false);
  const [passInfo, setPassInfo] = useState<PassInfo | null>(null);
  const [lastScanTime, setLastScanTime] = useState<string>("");
  const [showRenewing, setShowRenewing] = useState(false);

  const scanCard = async () => {
    setScanning(true);
    setPassInfo(null);
    setShowRenewing(false);

    try {
      const response = await fetch("http://localhost:4000/api/conductor/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      setPassInfo(data);
      setLastScanTime(new Date().toLocaleTimeString());

      // If pass was renewed, show renewing status for 1 second
      if (data.renewed && data.status === "renewing") {
        setShowRenewing(true);
        setTimeout(() => {
          setShowRenewing(false);
          // Update status to active
          setPassInfo(prev => prev ? { ...prev, status: "active" } : null);
        }, 1000);
      }

      // If pass was just activated, show activation status for 1 second
      if (data.activated && data.status === "activated") {
        setShowRenewing(true);
        setTimeout(() => {
          setShowRenewing(false);
          // Update status to active
          setPassInfo(prev => prev ? { ...prev, status: "active" } : null);
        }, 1000);
      }
    } catch (error) {
      setPassInfo({
        valid: false,
        message: "Failed to scan card. Please try again.",
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "2rem", fontWeight: "700", margin: "0 0 8px 0" }}>
            🚌 Conductor Panel
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: 0 }}>
            Tap RFID card to validate bus pass
          </p>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              backdropFilter: "blur(10px)"
            }}
          >
            Logout
          </button>
        )}
      </div>

      {/* Main Card */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "hidden"
      }}>
        {/* Scan Button Section */}
        <div style={{
          padding: "60px 40px",
          textAlign: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
        }}>
          <div style={{
            width: "120px",
            height: "120px",
            margin: "0 auto 30px",
            background: scanning ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" : "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "4rem",
            animation: scanning ? "pulse 1.5s infinite" : "none",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
          }}>
            {scanning ? "📡" : "💳"}
          </div>

          <button
            onClick={scanCard}
            disabled={scanning}
            style={{
              padding: "20px 50px",
              fontSize: "1.3rem",
              fontWeight: "700",
              background: scanning 
                ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" 
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              cursor: scanning ? "not-allowed" : "pointer",
              boxShadow: "0 8px 20px rgba(102,126,234,0.4)",
              transition: "all 0.3s ease",
              minWidth: "280px"
            }}
            onMouseOver={(e) => {
              if (!scanning) {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(102,126,234,0.5)";
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(102,126,234,0.4)";
            }}
          >
            {scanning ? "⏳ Scanning..." : "🎫 Scan Card"}
          </button>

          {scanning && (
            <p style={{
              marginTop: "20px",
              color: "#667eea",
              fontSize: "1.1rem",
              fontWeight: "600",
              animation: "fadeIn 0.5s ease"
            }}>
              📱 Place card near EM-18 reader...
            </p>
          )}
        </div>

        {/* Result Section */}
        {passInfo && (
          <div style={{
            padding: "40px",
            background: passInfo.valid ? "#ecfdf5" : "#fef2f2",
            borderTop: `4px solid ${passInfo.valid ? "#10b981" : "#ef4444"}`,
            animation: "slideIn 0.4s ease"
          }}>
            {/* Special Renewing Status */}
            {showRenewing && passInfo.status === "renewing" && (
              <div style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "#fff",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
                textAlign: "center",
                animation: "pulse 0.8s ease-in-out 3",
                boxShadow: "0 8px 24px rgba(59, 130, 246, 0.4)"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔄</div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "1.3rem", fontWeight: "700" }}>
                  Pass Renewing...
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  Please wait while we activate your renewed pass
                </p>
              </div>
            )}

            {/* Special Activation Status */}
            {showRenewing && passInfo.status === "activated" && (
              <div style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
                textAlign: "center",
                animation: "pulse 0.8s ease-in-out 3",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>✅</div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "1.3rem", fontWeight: "700" }}>
                  Pass Activated!
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  Your pass is now active and ready to use
                </p>
              </div>
            )}

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: passInfo.valid ? "#10b981" : "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                flexShrink: 0
              }}>
                {passInfo.valid ? "✅" : "❌"}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  margin: "0 0 8px 0",
                  fontSize: "2rem",
                  color: passInfo.valid ? "#065f46" : "#991b1b",
                  fontWeight: "700"
                }}>
                  {passInfo.valid ? "Valid Pass ✓" : "Invalid Pass ✗"}
                </h2>
                <p style={{
                  margin: 0,
                  color: passInfo.valid ? "#047857" : "#dc2626",
                  fontSize: "1.1rem",
                  fontWeight: "500"
                }}>
                  {passInfo.message || (passInfo.valid ? "Passenger can board" : "Passenger cannot board")}
                </p>
              </div>
            </div>

            {/* Pass Details - Show for both valid and expired passes */}
            <div style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "30px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
            }}>
              {/* Photo Display */}
              {passInfo.photoPath && (
                <div style={{
                  marginBottom: "30px",
                  textAlign: "center"
                }}>
                  <div style={{
                    width: "150px",
                    height: "150px",
                    margin: "0 auto",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: `4px solid ${passInfo.valid ? "#10b981" : "#ef4444"}`,
                    boxShadow: `0 8px 20px ${passInfo.valid ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                  }}>
                    <img
                      src={`http://localhost:4000/uploads/${passInfo.photoPath}`}
                      alt="Passenger Photo"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div style={{
                    marginTop: "12px",
                    fontSize: "0.9rem",
                    color: "#6b7280",
                    fontWeight: "600"
                  }}>
                    📸 {passInfo.type === "student" ? "Student" : "Passenger"} Photo
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                <div>
                  <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "4px", fontWeight: "600" }}>
                    Passenger Name
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#1f2937" }}>
                    {passInfo.passengerName || "N/A"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "4px", fontWeight: "600" }}>
                    Pass Type
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#1f2937" }}>
                    {passInfo.passType || "N/A"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "4px", fontWeight: "600" }}>
                    Pass Number
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#1f2937" }}>
                    {passInfo.passNumber || "N/A"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "4px", fontWeight: "600" }}>
                    Card Number (UID)
                  </div>
                  <div style={{ 
                    fontSize: "1.1rem", 
                    fontWeight: "700", 
                    color: "#1f2937",
                    fontFamily: "monospace",
                    letterSpacing: "0.5px"
                  }}>
                    {passInfo.rfidUid || "N/A"}
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "4px", fontWeight: "600" }}>
                    Valid Until
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#1f2937" }}>
                    {formatDate(passInfo.validUntil)}
                  </div>
                </div>
              </div>
            </div>

            {lastScanTime && (
              <div style={{
                marginTop: "20px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "0.9rem"
              }}>
                Last scanned at {lastScanTime}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
