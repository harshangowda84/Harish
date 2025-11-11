import React, { useState, useEffect } from "react";

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
  onLogout: () => void;
};

type PassengerRegistration = {
  id: number;
  passengerName: string;
  email: string;
  age: number;
  phoneNumber: string;
  address: string;
  idType: string;
  idNumber: string;
  passType: string;
  passName: string;
  status: "pending" | "approved" | "declined";
  declineReason?: string;
  documents: string;
  createdAt: string;
  updatedAt: string;
  uniquePassId?: string;
  rfidUid?: string;
  passValidity?: string;
  renewalRequested?: boolean;
};

export default function PassengerDashboard({ onLogout }: Props) {
  const [step, setStep] = useState<"select" | "details" | "documents" | "success">("select");
  const [selectedPass, setSelectedPass] = useState<"day" | "weekly" | "monthly" | null>(null);
  const [reapplyingId, setReapplyingId] = useState<number | null>(null);
  const [previousApplications, setPreviousApplications] = useState<PassengerRegistration[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [formData, setFormData] = useState({
    passengerName: "",
    age: "",
    phoneNumber: "",
    address: "",
    idType: "aadhar",
    idNumber: ""
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [renewing, setRenewing] = useState<number | null>(null);
  
  // Real-time status update state
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch previous applications on component mount
  useEffect(() => {
    fetchApplications();
  }, []);
  
  // Auto-refresh status every 30 seconds for real-time updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchApplications = async () => {
    setLoadingApplications(true);
    try {
      const response = await fetch("http://localhost:4000/api/passenger/my-requests", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("sbp_token")}`
        }
      });
      const json = await response.json();
      if (response.ok && json.registrations) {
        setPreviousApplications(json.registrations);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoadingApplications(false);
    }
  };

  const renewPass = async (id: number) => {
    setRenewing(id);
    try {
      const response = await fetch(`http://localhost:4000/api/passenger/renew/${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("sbp_token")}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        alert("✅ " + data.message);
        // Refresh applications to show updated status
        fetchApplications();
      } else {
        alert("❌ Error: " + (data.error || "Failed to renew pass"));
      }
    } catch (err) {
      alert("❌ Error renewing pass: " + String(err));
    } finally {
      setRenewing(null);
    }
  };

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

  const idTypes = [
    { value: "aadhar", label: "Aadhar Card" },
    { value: "pan", label: "PAN Card" },
    { value: "dl", label: "Driving License" },
    { value: "passport", label: "Passport" }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.passengerName.trim()) return "Name is required";
    if (!/^[a-zA-Z\s]+$/.test(formData.passengerName)) return "Name can only contain alphabets and spaces";
    if (!formData.age || parseInt(formData.age) < 5 || parseInt(formData.age) > 200) return "Age must be between 5 and 200 years";
    if (!/^\d+$/.test(formData.age)) return "Age can only contain digits";
    if (formData.age.length > 3) return "Age cannot exceed 3 digits (max 200)";
    if (!formData.phoneNumber.trim()) return "Phone number is required";
    if (!/^\d{10}$/.test(formData.phoneNumber)) return "Phone number must be exactly 10 digits";
    if (!/^\d+$/.test(formData.phoneNumber)) return "Phone number can only contain digits";
    if (!formData.address.trim()) return "Address is required";
    if (!formData.idNumber.trim()) return "ID number is required";
    return "";
  };

  // Check if user has an active pass of the given type
  const hasActivePass = (passType: string) => {
    const now = new Date();
    return previousApplications.some(app => {
      // Match pass type (day, weekly, monthly)
      const appPassType = app.passType?.toLowerCase().trim() || "";
      const checkType = passType.toLowerCase().trim();
      
      // Check if approved and has valid RFID
      if (app.status !== "approved" || !app.rfidUid) {
        return false;
      }
      
      // Check if pass type matches exactly (not just contains)
      // appPassType might be "day" or "DAY" in database
      if (appPassType !== checkType) {
        return false;
      }
      
      // Check if pass is still valid
      if (app.passValidity) {
        return new Date(app.passValidity) > now;
      }
      
      return false;
    });
  };

  // Get active pass details for a specific type
  const getActivePassInfo = (passType: string) => {
    const now = new Date();
    return previousApplications.find(app => {
      const appPassType = app.passType?.toLowerCase().trim() || "";
      const checkType = passType.toLowerCase().trim();
      
      return app.status === "approved" && 
             app.rfidUid &&
             appPassType === checkType && 
             app.passValidity && 
             new Date(app.passValidity) > now;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (documents.length >= 1) {
      setError("Only 1 document allowed. Please remove the previous document first.");
      return;
    }
    if (files.length > 0) {
      setDocuments([files[0]]);
      setError("");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const photoFile = files[0];
      setPhoto(photoFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(photoFile);
      setError("");
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const removeDocument = (idx: number) => {
    setDocuments(documents.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formDataObj = new FormData();
      formDataObj.append("passengerName", formData.passengerName);
      formDataObj.append("age", formData.age);
      formDataObj.append("phoneNumber", formData.phoneNumber);
      formDataObj.append("address", formData.address);
      formDataObj.append("idType", formData.idType);
      formDataObj.append("idNumber", formData.idNumber);
      formDataObj.append("passType", selectedPass || "monthly");
      formDataObj.append("passName", passTypes.find(p => p.type === selectedPass)?.name || "Pass");

      // Log what's being sent
      console.log("Submitting with:", {
        passengerName: formData.passengerName,
        age: formData.age,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        idType: formData.idType,
        idNumber: formData.idNumber,
        passType: selectedPass,
        documentsCount: documents.length,
        reapplyingId: reapplyingId
      });

      documents.forEach((doc) => {
        formDataObj.append("documents", doc);
      });

      // Add photo if available
      if (photo) {
        formDataObj.append("photo", photo);
      }

      // If reapplying, use the update endpoint, otherwise use register
      const endpoint = reapplyingId 
        ? `http://localhost:4000/api/passenger/register/${reapplyingId}`
        : "http://localhost:4000/api/passenger/register";

      const response = await fetch(endpoint, {
        method: reapplyingId ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("sbp_token")}`
        },
        body: formDataObj
      });

      const json = await response.json();
      console.log("Response:", json);
      if (response.ok) {
        setStep("success");
        setSelectedPass(null);
        setReapplyingId(null);
        setFormData({ passengerName: "", age: "", phoneNumber: "", address: "", idType: "aadhar", idNumber: "" });
        setDocuments([]);
        // Refresh applications list
        fetchApplications();
      } else {
        setError(json.error || "Failed to submit application");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
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
        <div style={{ display: "flex", gap: "12px" }}>
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
              {passTypes.map((pass) => {
                const isActive = hasActivePass(pass.type);
                const activePassInfo = getActivePassInfo(pass.type);
                
                return (
                  <div
                    key={pass.type}
                    onClick={() => {
                      if (!isActive) {
                        setSelectedPass(pass.type);
                        setStep("details");
                      }
                    }}
                    style={{
                      background: isActive ? "#f3f4f6" : "#fff",
                      border: isActive ? "2px solid #d1d5db" : "2px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "28px",
                      cursor: isActive ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      transform: selectedPass === pass.type ? "scale(1.02)" : "scale(1)",
                      opacity: isActive ? 0.6 : 1,
                      position: "relative"
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = "#10b981";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(16,185,129,0.15)";
                        e.currentTarget.style.transform = "translateY(-4px)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = selectedPass === pass.type ? "scale(1.02)" : "scale(1)";
                      }
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "#10b981",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "600"
                      }}>
                        ✅ ACTIVE
                      </div>
                    )}
                    
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{pass.icon}</div>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", color: isActive ? "#9ca3af" : "#0b1220" }}>
                      {pass.name}
                    </h4>
                    <div style={{
                      fontSize: "1.75rem",
                      fontWeight: "700",
                      color: isActive ? "#9ca3af" : "#10b981",
                      marginBottom: "8px"
                    }}>
                      {pass.price}
                    </div>
                    <p style={{ color: isActive ? "#9ca3af" : "#6b7280", margin: "0 0 16px 0", fontSize: "0.95rem" }}>
                      {pass.desc}
                    </p>

                    {isActive && activePassInfo && (
                      <div style={{
                        background: "#dcfce7",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        marginBottom: "12px",
                        border: "1px solid #10b981"
                      }}>
                        <p style={{ margin: "0", fontSize: "0.8rem", color: "#059669", fontWeight: "600" }}>
                          Valid until: {formatDate(activePassInfo.passValidity)}
                        </p>
                      </div>
                    )}

                    <ul style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0
                    }}>
                      {pass.benefits.map((benefit, idx) => (
                        <li key={idx} style={{
                          color: isActive ? "#9ca3af" : "#6b7280",
                          fontSize: "0.9rem",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px"
                        }}>
                          <span style={{ color: isActive ? "#9ca3af" : "#10b981", fontWeight: "700" }}>✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    {isActive && (
                      <div style={{
                        marginTop: "16px",
                        textAlign: "center"
                      }}>
                        <p style={{ 
                          margin: "0", 
                          fontSize: "0.85rem", 
                          color: "#7c2d12", 
                          fontWeight: "600",
                          background: "#fed7aa",
                          padding: "8px 12px",
                          borderRadius: "6px"
                        }}>
                          You already have an active {pass.name}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
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
                1. Select your desired pass type<br/>
                2. Fill in your personal details<br/>
                3. Upload your ID proof (optional but recommended)<br/>
                4. Submit for admin approval<br/>
                5. Once approved, your pass will be activated
              </p>
            </div>
          </div>
        )}

        {step === "details" && selectedPass && (
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
                  Personal Information
                </h3>
                <p style={{ color: "#6b7280", margin: 0 }}>
                  Please fill in your details for the {passTypes.find(p => p.type === selectedPass)?.name}
                </p>
              </div>

              <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                {/* Name */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0b1220", marginBottom: "8px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="passengerName"
                    value={formData.passengerName}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[a-zA-Z\s]*$/.test(value) || value === "") {
                        handleInputChange(e);
                      }
                    }}
                    placeholder="Enter your full name (alphabets only)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                {/* Age */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0b1220", marginBottom: "8px" }}>
                    Age * (5-200 years)
                  </label>
                  <input
                    type="text"
                    name="age"
                    value={formData.age}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits and max 3 digits
                      if ((/^\d*$/.test(value) || value === "") && value.length <= 3) {
                        handleInputChange(e);
                      }
                    }}
                    maxLength={3}
                    placeholder="Enter your age (5-200, max 3 digits)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                {/* Phone Number */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0b1220", marginBottom: "8px" }}>
                    Phone Number * (10 digits)
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value) && value.length <= 10) {
                        handleInputChange(e);
                      }
                    }}
                    placeholder="10 digit mobile number"
                    maxLength={10}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                {/* Address */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0b1220", marginBottom: "8px" }}>
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your residential address"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* ID Type */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0b1220", marginBottom: "8px" }}>
                    Government ID Type *
                  </label>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                  >
                    {idTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* ID Number */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "#0b1220", marginBottom: "8px" }}>
                    {formData.idType === "aadhar" ? "Aadhar Number" :
                     formData.idType === "pan" ? "PAN Number" :
                     formData.idType === "dl" ? "License Number" :
                     "Passport Number"} *
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    placeholder={`Enter your ${idTypes.find(t => t.value === formData.idType)?.label}`}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                    fontSize: "0.9rem"
                  }}>
                    ⚠️ {error}
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
                    onClick={() => {
                      const validationError = validateForm();
                      if (!validationError) {
                        setStep("documents");
                      } else {
                        setError(validationError);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
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
                    Continue to Documents
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "documents" && selectedPass && (
          <div>
            <button
              onClick={() => setStep("details")}
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
              ← Back to Personal Details
            </button>

            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ fontSize: "1.5rem", color: "#0b1220", margin: "0 0 12px 0" }}>
                  Upload ID Proof
                </h3>
                <p style={{ color: "#6b7280", margin: 0 }}>
                  Upload your ID documents (optional but recommended for faster approval)
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
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{
                    display: "none"
                  }}
                  id="file-input"
                  disabled={documents.length >= 1}
                />
                <label
                  htmlFor="file-input"
                  style={{
                    cursor: documents.length >= 1 ? "not-allowed" : "pointer",
                    display: "block"
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📄</div>
                  <h4 style={{ margin: "0 0 4px 0", color: "#0b1220" }}>Click to upload {formData.idType === "aadhar" ? "Aadhar Card" : formData.idType === "pan" ? "PAN Card" : formData.idType === "dl" ? "Driving License" : "Passport"}</h4>
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "0.9rem" }}>
                    JPG, PNG, PDF up to 5MB (Only 1 document matching your ID type)
                  </p>
                </label>
              </div>

              {/* Uploaded Files */}
              {documents.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#0b1220", marginBottom: "12px" }}>
                    Uploaded Document (1/1)
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
              {error && (
                <div style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "24px",
                  fontSize: "0.9rem"
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Info Box */}
              <div style={{
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                padding: "16px",
                borderRadius: "8px",
                borderLeft: "4px solid #f59e0b",
                marginBottom: "24px",
                fontSize: "0.9rem",
                color: "#78350f"
              }}>
                📝 Document upload is optional. You can submit without uploading, but uploading helps with faster verification.
              </div>

              {/* Photo Upload Section */}
              <div style={{ marginBottom: "32px", paddingTop: "32px", borderTop: "2px solid #e5e7eb" }}>
                <h3 style={{ fontSize: "1.2rem", color: "#0b1220", margin: "0 0 12px 0" }}>
                  📸 Upload Your Photo
                </h3>
                <p style={{ color: "#6b7280", margin: "0 0 20px 0", fontSize: "0.9rem" }}>
                  Upload a clear passport-style photo (will be verified by admin and shown to conductor)
                </p>

                {!photo ? (
                  <div
                    style={{
                      background: "#eff6ff",
                      border: "2px dashed #3b82f6",
                      borderRadius: "12px",
                      padding: "40px 20px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#dbeafe";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#eff6ff";
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: "none" }}
                      id="photo-input"
                    />
                    <label
                      htmlFor="photo-input"
                      style={{
                        cursor: "pointer",
                        display: "block"
                      }}
                    >
                      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎥</div>
                      <h4 style={{ margin: "0 0 4px 0", color: "#0b1220" }}>Click to upload photo</h4>
                      <p style={{ color: "#6b7280", margin: 0, fontSize: "0.9rem" }}>
                        JPG, PNG up to 5MB (Passport style recommended)
                      </p>
                    </label>
                  </div>
                ) : (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{
                      background: "#f9fafb",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      gap: "12px",
                      alignItems: "center"
                    }}>
                      <img
                        src={photoPreview || ""}
                        alt="Photo preview"
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "6px",
                          objectFit: "cover"
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: "500", color: "#0b1220" }}>
                          {photo?.name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                          {(photo?.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <button
                        onClick={removePhoto}
                        style={{
                          background: "#fee2e2",
                          border: "none",
                          color: "#dc2626",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "600"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <div style={{
                  background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                  padding: "12px",
                  borderRadius: "8px",
                  borderLeft: "4px solid #3b82f6",
                  marginTop: "12px",
                  fontSize: "0.85rem",
                  color: "#1e40af"
                }}>
                  ℹ️ Photo is required for identity verification during conductor checks at bus door.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setStep("details")}
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
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: submitting ? "#d1d5db" : "linear-gradient(90deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    if (!submitting) {
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
              The admin team will review your information. Your pass will be activated within 24 hours. You'll receive a notification once approved.
            </p>
            <button
              onClick={() => {
                setStep("select");
                setSelectedPass(null);
                fetchApplications();
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
              Done
            </button>
          </div>
        )}
      </div>

      {/* Applications List - Show on main screen */}
      {step === "select" && previousApplications.length > 0 && (
        <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "1.3rem", color: "#0b1220", margin: "0 0 12px 0" }}>
              📋 Your Previous Applications
            </h3>
            <p style={{ color: "#6b7280", margin: 0 }}>
              Track the status of your bus pass applications
            </p>
          </div>
          
          {/* Real-time Status Indicator */}
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "16px",
            fontSize: "0.85rem",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ fontSize: "1rem" }}>🔄</span>
            <span>Pass status updates automatically every 30 seconds</span>
            <span style={{ marginLeft: "auto", fontSize: "0.8rem", opacity: 0.8 }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {previousApplications
              .filter((app, index, arr) => {
                // Show only the latest application for each pass type
                // Check if this is the last one with the same passType
                const lastIndexWithSamePass = arr.findIndex((a, i) => 
                  a.passType === app.passType && arr.slice(i).findIndex(x => x.passType === app.passType) === 0
                );
                // Actually, let's show only declined ones + the latest pending/approved of each type
                // Group by passType and show only the most recent of each
                const isLatestOfType = !arr.slice(index + 1).some(a => a.passType === app.passType);
                return isLatestOfType;
              })
              .map((app) => {
                // Check if pass is expired (real-time with lastUpdate trigger)
                const now = lastUpdate;
                const isExpired = app.status === "approved" && app.passValidity && new Date(app.passValidity) < now;
                
                // Check if pass has been deleted (rfidUid removed by admin)
                const isDeleted = app.status === "approved" && !app.rfidUid;
                
                const statusColor = (isDeleted || isExpired) ? "#ef4444" : (app.status === "approved" ? "#10b981" : app.status === "declined" ? "#ef4444" : "#f59e0b");
                const statusBg = (isDeleted || isExpired) ? "#fef2f2" : (app.status === "approved" ? "#f0fdf4" : app.status === "declined" ? "#fef2f2" : "#fffbeb");
                const statusIcon = (isDeleted || isExpired) ? "⏰" : (app.status === "approved" ? "✅" : app.status === "declined" ? "❌" : "⏳");
                const statusText = isDeleted ? "Deleted" : (isExpired ? "Expired" : (app.status.charAt(0).toUpperCase() + app.status.slice(1)));

                return (
                  <div
                    key={app.id}
                    style={{
                      background: "#fff",
                      border: `2px solid ${statusColor}`,
                      borderRadius: "12px",
                      padding: "20px",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = `0 4px 12px ${statusColor}20`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                          <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#0b1220" }}>
                            {app.passName || "Bus Pass"}
                          </h4>
                          <span style={{
                            background: statusBg,
                            color: statusColor,
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}>
                            {statusIcon} {statusText}
                          </span>
                        </div>
                        <p style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: "0.9rem" }}>
                          <strong>Name:</strong> {app.passengerName}
                        </p>
                        <p style={{ color: "#6b7280", margin: "0 0 8px 0", fontSize: "0.9rem" }}>
                          <strong>Applied:</strong> {formatDate(app.createdAt)}
                        </p>
                        
                        {/* Show expiry/deleted warning */}
                        {(isExpired || isDeleted) && (
                          <div style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "12px",
                            marginTop: "12px",
                            color: "#dc2626"
                          }}>
                            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", marginBottom: "4px" }}>
                              {isDeleted ? "❌ Pass Deleted" : "⏰ Pass Expired"}
                            </p>
                            <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem" }}>
                              {isDeleted 
                                ? "Your pass has been deleted by the administrator. Please contact support or apply for a new pass."
                                : `This pass expired on ${formatDate(app.passValidity)}.`
                              }
                            </p>
                            
                            {!isDeleted && (
                              <>
                                {app.renewalRequested ? (
                                  // Show pending renewal message
                                  <div style={{
                                    padding: "10px 20px",
                                    background: "#3b82f6",
                                    color: "#fff",
                                    borderRadius: "6px",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                    textAlign: "center"
                                  }}>
                                    ⏳ Renewal Pending - Tap Card at Conductor Panel
                                  </div>
                                ) : (
                                  // Show renew button only for expired (not deleted) passes
                                  <button
                                    onClick={() => renewPass(app.id)}
                                    disabled={renewing === app.id}
                                    style={{
                                      padding: "10px 20px",
                                      background: renewing === app.id ? "#fbbf24" : "#f59e0b",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: renewing === app.id ? "not-allowed" : "pointer",
                                      fontWeight: "600",
                                      fontSize: "0.9rem",
                                      width: "100%",
                                      transition: "all 0.3s ease"
                                    }}
                                    onMouseOver={(e) => {
                                      if (renewing !== app.id) {
                                        e.currentTarget.style.background = "#d97706";
                                      }
                                    }}
                                    onMouseOut={(e) => {
                                      if (renewing !== app.id) {
                                        e.currentTarget.style.background = "#f59e0b";
                                      }
                                    }}
                                  >
                                    {renewing === app.id ? "⏳ Renewing..." : "🔄 Renew Pass (Tap Card to Activate)"}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        
                        {app.declineReason && (
                          <div style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "12px",
                            marginTop: "12px",
                            color: "#dc2626"
                          }}>
                            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", marginBottom: "4px" }}>
                              Decline Reason:
                            </p>
                            <p style={{ margin: 0, fontSize: "0.85rem" }}>
                              {app.declineReason}
                            </p>
                          </div>
                        )}
                        {app.status === "approved" && app.uniquePassId && !isExpired && !isDeleted && (
                          <div style={{
                            background: "#f0fdf4",
                            border: "2px solid #10b981",
                            borderRadius: "8px",
                            padding: "12px",
                            marginTop: "12px",
                            color: "#166534"
                          }}>
                            <p style={{ margin: "0 0 8px 0", fontSize: "0.9rem", fontWeight: "600", color: "#059669" }}>
                              ✅ Your Pass is Ready!
                            </p>
                            <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem" }}>
                              <strong>🆔 Unique Pass ID:</strong>
                            </p>
                            <div style={{
                              background: "#fff",
                              padding: "8px",
                              borderRadius: "6px",
                              fontFamily: "monospace",
                              fontSize: "0.9rem",
                              textAlign: "center",
                              color: "#0b1220",
                              fontWeight: "600",
                              userSelect: "all"
                            }}>
                              {app.uniquePassId}
                            </div>
                            <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", color: "#6b7280" }}>
                              Use this ID to login to the mobile app
                            </p>
                            {app.rfidUid && (
                              <>
                                <p style={{ margin: "12px 0 4px 0", fontSize: "0.85rem" }}>
                                  <strong>💳 Card Number (UID):</strong>
                                </p>
                                <div style={{
                                  background: "#fff",
                                  padding: "8px",
                                  borderRadius: "6px",
                                  fontFamily: "monospace",
                                  fontSize: "0.85rem",
                                  textAlign: "center",
                                  color: "#0b1220",
                                  fontWeight: "600",
                                  userSelect: "all",
                                  letterSpacing: "0.5px"
                                }}>
                                  {app.rfidUid}
                                </div>
                                <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
                                  📱 Your RFID card identifier
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Application Details */}
                    <div style={{
                      background: "#f9fafb",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "0.85rem",
                      color: "#6b7280",
                      marginBottom: "12px"
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <span style={{ fontWeight: "600" }}>Age:</span> {app.age}
                        </div>
                        <div>
                          <span style={{ fontWeight: "600" }}>Phone:</span> {app.phoneNumber}
                        </div>
                        <div>
                          <span style={{ fontWeight: "600" }}>ID Type:</span> {app.idType}
                        </div>
                        <div>
                          <span style={{ fontWeight: "600" }}>ID Number:</span> {app.idNumber}
                        </div>
                      </div>
                    </div>

                    {app.status === "declined" && (
                      <button
                        onClick={() => {
                          setReapplyingId(app.id);
                          setStep("details");
                          setSelectedPass((app.passType as any) || "monthly");
                          setFormData({
                            passengerName: app.passengerName,
                            age: app.age.toString(),
                            phoneNumber: app.phoneNumber,
                            address: app.address,
                            idType: app.idType,
                            idNumber: app.idNumber
                          });
                        }}
                        style={{
                          padding: "10px 16px",
                          background: "#3b82f6",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "0.9rem",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#2563eb";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "#3b82f6";
                        }}
                      >
                        📝 Reapply with Corrected Info
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
