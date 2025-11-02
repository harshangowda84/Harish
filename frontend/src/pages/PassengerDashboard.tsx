import React, { useState } from "react";

type Props = {
  onLogout: () => void;
};

export default function PassengerDashboard({ onLogout }: Props) {
  const [step, setStep] = useState<"select" | "upload" | "success">("select");
  const [selectedPass, setSelectedPass] = useState<"day" | "weekly" | "monthly" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const passTypes = [
    {
      type: "day" as const,
      name: "Day Pass",
      price: "₹50",
      desc: "Valid for 24 hours from activation",
      icon: "🌅",
      benefits: ["Unlimited trips in 24 hours", "Valid from 4 AM to 3:59 AM next day"]
    },
    {
      type: "weekly" as const,
      name: "Weekly Pass",
      price: "₹250",
      desc: "Valid for 7 days",
      icon: "📅",
      benefits: ["Unlimited trips for 7 days", "Renewable every Sunday"]
    },
    {
      type: "monthly" as const,
      name: "Monthly Pass",
      price: "₹800",
      desc: "Valid for 30 days",
      icon: "📆",
      benefits: ["Unlimited trips for 30 days", "Most economical option"]
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + documents.length > 3) {
      setUploadError("Maximum 3 documents allowed");
      return;
    }
    setDocuments([...documents, ...files]);
    setUploadError("");
  };

  const removeDocument = (idx: number) => {
    setDocuments(documents.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!selectedPass) {
      setUploadError("Please select a pass type");
      return;
    }
    if (documents.length === 0) {
      setUploadError("Please upload at least one document");
      return;
    }

    setSubmitting(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("passType", selectedPass);
      formData.append("passName", passTypes.find(p => p.type === selectedPass)?.name || "");
      formData.append("status", "pending");
      
      documents.forEach((doc, idx) => {
        formData.append(`document_${idx}`, doc);
      });

      const response = await fetch("http://localhost:4000/api/passenger/register", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("sbp_token")}`
        },
        body: formData
      });

      const json = await response.json();
      if (response.ok) {
        setStep("success");
        setSelectedPass(null);
        setDocuments([]);
      } else {
        setUploadError(json.error || "Failed to submit pass request");
      }
    } catch (err) {
      console.error(err);
      setUploadError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "#fff",
        borderBottom: "1px solid rgba(0,0,0,0.05)"
      }}>
        <div>
          <h2 style={{ margin: "0", fontSize: "1.5rem", color: "#0b1220" }}>🎫 Passenger Dashboard</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.9rem" }}>Select and apply for bus passes</p>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: "10px 20px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#dc2626";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#ef4444";
            e.currentTarget.style.transform = "none";
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        {step === "select" && (
          <div>
            <div style={{ marginBottom: "40px" }}>
              <h3 style={{ fontSize: "1.5rem", color: "#0b1220", margin: "0 0 12px 0" }}>
                Choose Your Pass Type
              </h3>
              <p style={{ color: "#6b7280", margin: 0 }}>
                Select the pass that best suits your travel needs
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              marginBottom: "40px"
            }}>
              {passTypes.map((pass) => (
                <div
                  key={pass.type}
                  onClick={() => {
                    setSelectedPass(pass.type);
                    setStep("upload");
                  }}
                  style={{
                    background: "#fff",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "28px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    transform: selectedPass === pass.type ? "scale(1.02)" : "scale(1)"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#10b981";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(16,185,129,0.15)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = selectedPass === pass.type ? "scale(1.02)" : "scale(1)";
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{pass.icon}</div>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", color: "#0b1220" }}>
                    {pass.name}
                  </h4>
                  <div style={{
                    fontSize: "1.75rem",
                    fontWeight: "700",
                    color: "#10b981",
                    marginBottom: "8px"
                  }}>
                    {pass.price}
                  </div>
                  <p style={{ color: "#6b7280", margin: "0 0 16px 0", fontSize: "0.95rem" }}>
                    {pass.desc}
                  </p>
                  <ul style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0
                  }}>
                    {pass.benefits.map((benefit, idx) => (
                      <li key={idx} style={{
                        color: "#6b7280",
                        fontSize: "0.9rem",
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px"
                      }}>
                        <span style={{ color: "#10b981", fontWeight: "700" }}>✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              padding: "24px",
              borderRadius: "12px",
              borderLeft: "4px solid #10b981"
            }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#0b1220", fontSize: "1rem" }}>
                📋 How It Works
              </h4>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem", lineHeight: "1.6" }}>
                1. Select your desired pass type above<br/>
                2. Upload your identity proof (Aadhar, PAN, or ID card)<br/>
                3. Submit your request for admin approval<br/>
                4. Once approved, your pass will be activated within 24 hours
              </p>
            </div>
          </div>
        )}

        {step === "upload" && selectedPass && (
          <div>
            <button
              onClick={() => setStep("select")}
              style={{
                background: "transparent",
                border: "none",
                color: "#10b981",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "600",
                marginBottom: "24px",
                padding: 0,
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.7";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              ← Back to Pass Selection
            </button>

            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ fontSize: "1.5rem", color: "#0b1220", margin: "0 0 12px 0" }}>
                  Upload Documents
                </h3>
                <p style={{ color: "#6b7280", margin: 0 }}>
                  Submit proof for your {passTypes.find(p => p.type === selectedPass)?.name}
                </p>
              </div>

              {/* File Upload Area */}
              <div style={{
                background: "#fff",
                border: "2px dashed #10b981",
                borderRadius: "12px",
                padding: "40px 20px",
                textAlign: "center",
                marginBottom: "24px",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f0fdf4";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#fff";
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{
                    display: "none"
                  }}
                  id="file-input"
                  disabled={documents.length >= 3}
                />
                <label
                  htmlFor="file-input"
                  style={{
                    cursor: documents.length >= 3 ? "not-allowed" : "pointer",
                    display: "block"
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📄</div>
                  <h4 style={{ margin: "0 0 4px 0", color: "#0b1220" }}>Click to upload or drag and drop</h4>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "0.9rem" }}>
                    JPG, PNG, PDF up to 5MB each
                  </p>
                </label>
              </div>

              {/* Uploaded Files */}
              {documents.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#0b1220", marginBottom: "12px" }}>
                    Uploaded Files ({documents.length}/3)
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {documents.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#f9fafb",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                          <span style={{ fontSize: "1.1rem" }}>
                            {doc.type.includes("pdf") ? "📕" : "🖼️"}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontSize: "0.9rem",
                              fontWeight: "500",
                              color: "#0b1220",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}>
                              {doc.name}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeDocument(idx)}
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            color: "#dc2626",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            transition: "all 0.2s ease"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#fecaca";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#fee2e2";
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "24px",
                  fontSize: "0.9rem"
                }}>
                  ⚠️ {uploadError}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setStep("select")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "transparent",
                    border: "2px solid #10b981",
                    color: "#10b981",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#f0fdf4";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || documents.length === 0}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: submitting || documents.length === 0 ? "#d1d5db" : "linear-gradient(90deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: submitting || documents.length === 0 ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    if (!submitting && documents.length > 0) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 16px rgba(16,185,129,0.3)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {submitting ? "⏳ Submitting..." : "✅ Submit Application"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center", paddingTop: "40px" }}>
            <div style={{
              background: "#f0fdf4",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              margin: "0 auto 24px"
            }}>
              ✅
            </div>
            <h3 style={{ fontSize: "1.5rem", color: "#0b1220", margin: "0 0 12px 0" }}>
              Application Submitted!
            </h3>
            <p style={{ color: "#6b7280", margin: "0 0 32px 0", lineHeight: "1.6" }}>
              Your {selectedPass ? passTypes.find(p => p.type === selectedPass)?.name : "pass"} application has been submitted successfully.
              <br/><br/>
              The admin team will review your documents and your pass will be activated within 24 hours. You'll receive a notification once approved.
            </p>
            <button
              onClick={() => {
                setStep("select");
                setSelectedPass(null);
              }}
              style={{
                padding: "12px 32px",
                background: "linear-gradient(90deg, #10b981, #059669)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(16,185,129,0.3)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Apply for Another Pass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
