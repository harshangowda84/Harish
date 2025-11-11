import React, { useEffect, useState } from "react";

// Helper function to format date as DD-MM-YYYY
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

interface Reg {
  id: number;
  studentName?: string;
  passengerName?: string;
  studentId?: string;
  email?: string;
  passType?: string;
  age?: number;
  phoneNumber?: string;
  address?: string;
  idType?: string;
  idNumber?: string;
  status: string;
  declineReason?: string;
  type?: string;
  documents?: string;
  photoPath?: string;
  photoVerified?: boolean;
}

type Props = {
  onLogout?: () => void;
};

export default function AdminDashboard({ onLogout }: Props) {
  const [tab, setTab] = useState<"college" | "passenger" | "approved" | "cardmgmt">("college");
  const [collegeItems, setCollegeItems] = useState<Reg[]>([]);
  const [passengerItems, setPassengerItems] = useState<Reg[]>([]);
  const [approvedStudents, setApprovedStudents] = useState<Reg[]>([]);
  const [approvedPassengers, setApprovedPassengers] = useState<Reg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<Reg | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState<{ uniquePassId: string; rfidUid: string } | null>(null);
  const [approveError, setApproveError] = useState<{ message: string; details?: string } | null>(null);
  const [approveProgress, setApproveProgress] = useState<number>(0); // 0-100
  const [approveStage, setApproveStage] = useState<string>(""); // Current stage description
  const [duplicateCard, setDuplicateCard] = useState<{ isStudent: boolean; name: string; type: string; expiryDate: Date } | null>(null);
  const [duplicateCardOverride, setDuplicateCardOverride] = useState(false);

  // Card Management states
  const [scanning, setScanning] = useState(false);
  const [scannedCard, setScannedCard] = useState<any>(null);
  const [expiring, setExpiring] = useState(false);
  const [erasing, setErasing] = useState(false);
  
  // Real-time status update state
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const token = localStorage.getItem("sbp_token");
    if (!token) {
      setError("Not logged in");
      return;
    }

    setLoading(true);
    // Clear previous data before fetching new data
    setCollegeItems([]);
    setPassengerItems([]);
    setApprovedStudents([]);
    setApprovedPassengers([]);

    // Fetch pending and approved registrations
    Promise.all([
      fetch("http://localhost:4000/api/admin/registrations?status=pending&type=student", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch("http://localhost:4000/api/admin/registrations?status=pending&type=passenger", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch("http://localhost:4000/api/admin/approved-passes", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json())
    ])
      .then(([studentData, passengerData, approvedData]) => {
        if (studentData.items) setCollegeItems(studentData.items);
        if (passengerData.items) setPassengerItems(passengerData.items);
        if (approvedData.students) setApprovedStudents(approvedData.students);
        if (approvedData.passengers) setApprovedPassengers(approvedData.passengers);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load registrations");
        setLoading(false);
      });
  }, [tab]);
  
  // Auto-refresh status every 30 seconds for real-time updates
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  const approve = (id: number) => {
    setApproving(id);
    setApproveProgress(0);
    setApproveStage("Initializing...");
    
    const token = localStorage.getItem("sbp_token");
    
    const endpoint = tab === "college" 
      ? `http://localhost:4000/api/admin/registrations/${id}/approve`
      : `http://localhost:4000/api/admin/passenger-registrations/${id}/approve`;

    // Store for potential override
    (window as any).__pendingPassId = id;
    (window as any).__pendingPassType = tab === "college" ? "student" : "passenger";

    // Simulate progress stages for reading RFID card UID
    const progressIntervals = [
      { progress: 15, stage: "📋 Loading registration...", delay: 200 },
      { progress: 30, stage: "🔑 Generating unique pass ID...", delay: 600 },
      { progress: 45, stage: "� Waiting for RFID card tap...", delay: 900 },
      { progress: 65, stage: "📖 Reading card UID from EM-18...", delay: 1200 },
      { progress: 85, stage: "✅ Card UID captured!", delay: 1800 },
      { progress: 95, stage: "💾 Saving to database...", delay: 2200 },
    ];

    progressIntervals.forEach((interval) => {
      setTimeout(() => {
        setApproveProgress(interval.progress);
        setApproveStage(interval.stage);
      }, interval.delay);
    });

    fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ simulate: false, force: duplicateCardOverride })
    })
      .then((r) => r.json())
      .then((json) => {
        // Handle duplicate card error
        if (json.error === 'CARD_ALREADY_HAS_VALID_PASS' && json.shouldPromptOverride) {
          setApproveProgress(0);
          setApproveStage("");
          setApproving(null);
          setDuplicateCard({
            isStudent: json.existingPass.isStudent,
            name: json.existingPass.name,
            type: json.existingPass.type,
            expiryDate: new Date(json.existingPass.expiryDate)
          });
          setDuplicateCardOverride(false);
          return;
        }
        
        if (json.busPass || json.registration) {
          // Show 100% completion
          setApproveProgress(100);
          setApproveStage("✅ Pass created successfully!");
          
          // Show success with unique ID
          setApproveSuccess({
            uniquePassId: json.uniquePassId || "N/A",
            rfidUid: json.rfidUid || "N/A"
          });
          
          // Clear duplicate card state
          setDuplicateCard(null);
          setDuplicateCardOverride(false);
          
          if (tab === "college") {
            setCollegeItems((s) => s.filter((it) => it.id !== id));
          } else {
            setPassengerItems((s) => s.filter((it) => it.id !== id));
          }
          
          // Auto-close modal after success
          setTimeout(() => {
            setApproving(null);
            setApproveProgress(0);
            setApproveStage("");
          }, 1500);
        } else {
          setApproveProgress(0);
          setApproveStage("");
          setApproveError({
            message: json.error || "Failed to approve registration",
            details: json.details
          });
          setApproving(null);
        }
      })
      .catch((e) => {
        setApproveProgress(0);
        setApproveStage("");
        setApproveError({
          message: "Network error: " + String(e),
          details: String(e)
        });
        setApproving(null);
      });
  };

  const decline = async () => {
    if (!selectedPassenger || !declineReason.trim()) {
      alert("Please enter a decline reason");
      return;
    }

    setApproving(selectedPassenger.id);
    const token = localStorage.getItem("sbp_token");

    try {
      const response = await fetch(
        `http://localhost:4000/api/admin/passenger-registrations/${selectedPassenger.id}/decline`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ reason: declineReason })
        }
      );

      const json = await response.json();
      if (json.registration) {
        setPassengerItems((s) => s.filter((it) => it.id !== selectedPassenger.id));
        setIsDeclineOpen(false);
        setSelectedPassenger(null);
        setDeclineReason("");
      } else {
        alert("Error: " + JSON.stringify(json));
      }
    } catch (e) {
      alert(String(e));
    } finally {
      setApproving(null);
    }
  };

  // Generate / write pass to card for an approved registration
  const generatePass = (id: number, type: "student" | "passenger") => {
    setApproving(id);
    setApproveProgress(0);
    setApproveStage("Initializing...");

    const token = localStorage.getItem("sbp_token");
    const endpoint = type === "student"
      ? `http://localhost:4000/api/admin/registrations/${id}/approve`
      : `http://localhost:4000/api/admin/passenger-registrations/${id}/approve`;

    // Progress simulation
    const progressIntervals = [
      { progress: 10, stage: "📋 Preparing pass...", delay: 200 },
      { progress: 30, stage: "🔑 Preparing card write...", delay: 600 },
      { progress: 55, stage: "📖 Waiting for RFID card tap...", delay: 1000 },
      { progress: 75, stage: "🔍 Reading card UID...", delay: 1600 },
      { progress: 90, stage: "💾 Writing pass to card...", delay: 2200 }
    ];

    progressIntervals.forEach((interval) => {
      setTimeout(() => {
        setApproveProgress(interval.progress);
        setApproveStage(interval.stage);
      }, interval.delay);
    });

    fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ simulate: false })
    })
      .then(async (r) => {
        if (r.status === 409) {
          const json = await r.json();
          // Show duplicate card modal
          setApproveProgress(0);
          setApproveStage("");
          setDuplicateCard({
            isStudent: json.existingPass?.isStudent,
            name: json.existingPass?.name,
            type: json.existingPass?.type,
            expiryDate: new Date(json.existingPass?.expiryDate)
          });
          setDuplicateCardOverride(false);
          (window as any).__pendingPassId = id;
          (window as any).__pendingPassType = type;
          setApproving(null);
          return;
        }

        const json = await r.json();
        if (json.registration || json.busPass) {
          setApproveProgress(100);
          setApproveStage("✅ Pass written to card!");
          setApproveSuccess({ uniquePassId: json.uniquePassId || "N/A", rfidUid: json.rfidUid || "N/A" });
          
          // Auto-close on success
          setTimeout(() => {
            setApproving(null);
            setApproveProgress(0);
            setApproveStage("");
          }, 1500);
        } else {
          setApproveProgress(0);
          setApproveStage("");
          setApproveError({ message: json.error || "Failed to generate pass", details: json.details });
          setApproving(null);
        }
      })
      .catch((e) => {
        setApproveProgress(0);
        setApproveStage("");
        setApproveError({ message: "Network error: " + String(e), details: String(e) });
        setApproving(null);
      });
  };

  const deletePass = (id: number, type: "student" | "passenger") => {
    if (!confirm("Hide this pass from dashboard?")) return;
    
    setDeleting(id);
    const token = localStorage.getItem("sbp_token");
    const endpoint = type === "student" 
      ? `http://localhost:4000/api/admin/student-passes/${id}/hide`
      : `http://localhost:4000/api/admin/passenger-passes/${id}/hide`;

    fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          if (type === "student") {
            setApprovedStudents(s => s.filter(it => it.id !== id));
          } else {
            setApprovedPassengers(s => s.filter(it => it.id !== id));
          }
        } else {
          alert("Error: " + JSON.stringify(json));
        }
      })
      .catch(e => alert(String(e)))
      .finally(() => setDeleting(null));
  };
  
  // Card Management Functions
  const scanCard = async () => {
    setScanning(true);
    setScannedCard(null);

    try {
      const response = await fetch("http://localhost:4000/api/conductor/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      setScannedCard(data);
    } catch (error) {
      setScannedCard({
        valid: false,
        message: "Failed to scan card. Please try again.",
      });
    } finally {
      setScanning(false);
    }
  };

  const expireCard = async () => {
    if (!scannedCard || !scannedCard.id || !scannedCard.type) {
      alert("Cannot expire pass - missing information");
      return;
    }

    if (!window.confirm(`Are you sure you want to expire this ${scannedCard.type} pass for ${scannedCard.passengerName}?`)) {
      return;
    }

    setExpiring(true);
    try {
      const token = localStorage.getItem("sbp_token");
      const response = await fetch("http://localhost:4000/api/conductor/expire-pass", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: scannedCard.id,
          type: scannedCard.type
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert("✅ Pass expired successfully! Scan card again to verify.");
        setScannedCard(null);
      } else {
        alert("Error: " + (data.error || "Could not expire pass"));
      }
    } catch (error) {
      alert("Error: " + String(error));
    } finally {
      setExpiring(false);
    }
  };

  const eraseCard = async () => {
    if (!scannedCard || !scannedCard.id || !scannedCard.type) {
      alert("Cannot erase card - missing information");
      return;
    }

    if (!window.confirm(`⚠️ WARNING: This will ERASE the card data for ${scannedCard.passengerName}!\n\nThis action will:\n- Remove RFID UID from the database\n- Allow the card to be reassigned\n- NOT delete the pass record\n\nAre you absolutely sure?`)) {
      return;
    }

    setErasing(true);
    try {
      const token = localStorage.getItem("sbp_token");
      const endpoint = scannedCard.type === "student" 
        ? `http://localhost:4000/api/admin/erase-card/student/${scannedCard.id}`
        : `http://localhost:4000/api/admin/erase-card/passenger/${scannedCard.id}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert("✅ Card erased successfully! The card can now be reassigned.");
        setScannedCard(null);
      } else {
        alert("Error: " + (data.error || "Could not erase card"));
      }
    } catch (error) {
      alert("Error: " + String(error));
    } finally {
      setErasing(false);
    }
  };

  const getItems = () => {
    if (tab === "college") return collegeItems;
    if (tab === "passenger") return passengerItems;
    if (tab === "approved") {
      return [...approvedStudents.map(s => ({ ...s, type: "student" })), 
              ...approvedPassengers.map(p => ({ ...p, type: "passenger" }))];
    }
    return [];
  };

  const items = getItems();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
        paddingBottom: "20px",
        borderBottom: "2px solid rgba(11,17,32,0.06)"
      }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "2rem", color: "#0b1220" }}>Admin Dashboard</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem" }}>Review and approve student bus pass registrations</p>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              padding: "10px 20px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
              transition: "all 0.3s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
          >
            Logout
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div style={{
          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          color: "#fff",
          padding: "28px",
          borderRadius: "14px",
          boxShadow: "0 8px 20px rgba(59,130,246,0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          transition: "all 0.3s ease",
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.1)"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 28px rgba(59,130,246,0.3)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(59,130,246,0.2)";
        }}
        >
          <div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, fontWeight: "500" }}>College Students</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>Pending Approval</div>
            <div style={{ fontSize: "3rem", fontWeight: "800", marginTop: "12px" }}>{collegeItems.length}</div>
          </div>
          <div style={{ fontSize: "3rem", opacity: 0.3 }}>🏢</div>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "#fff",
          padding: "28px",
          borderRadius: "14px",
          boxShadow: "0 8px 20px rgba(16,185,129,0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          transition: "all 0.3s ease",
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.1)"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 28px rgba(16,185,129,0.3)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(16,185,129,0.2)";
        }}
        >
          <div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, fontWeight: "500" }}>Passenger Passes</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>Pending Approval</div>
            <div style={{ fontSize: "3rem", fontWeight: "800", marginTop: "12px" }}>{passengerItems.length}</div>
          </div>
          <div style={{ fontSize: "3rem", opacity: 0.3 }}>🎫</div>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
          color: "#fff",
          padding: "28px",
          borderRadius: "14px",
          boxShadow: "0 8px 20px rgba(139,92,246,0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          transition: "all 0.3s ease",
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.1)"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 12px 28px rgba(139,92,246,0.3)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(139,92,246,0.2)";
        }}
        >
          <div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, fontWeight: "500" }}>Approved Passes</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.8, marginTop: "4px" }}>Total Active</div>
            <div style={{ fontSize: "3rem", fontWeight: "800", marginTop: "12px" }}>{approvedStudents.length + approvedPassengers.length}</div>
          </div>
          <div style={{ fontSize: "3rem", opacity: 0.3 }}>✅</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: "24px",
        padding: "6px",
        background: "#f3f4f6",
        borderRadius: "12px",
        flexWrap: "wrap",
        width: "fit-content"
      }}>
        <button
          onClick={() => setTab("college")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: tab === "college" ? "#fff" : "transparent",
            color: tab === "college" ? "#3b82f6" : "#6b7280",
            fontSize: "0.95rem",
            fontWeight: tab === "college" ? "700" : "500",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: tab === "college" ? "0 2px 8px rgba(59,130,246,0.15)" : "none"
          }}
          onMouseOver={(e) => {
            if (tab !== "college") {
              e.currentTarget.style.background = "rgba(59,130,246,0.08)";
              e.currentTarget.style.color = "#3b82f6";
            }
          }}
          onMouseOut={(e) => {
            if (tab !== "college") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }
          }}
        >
          🏢 College Students
          {collegeItems.length > 0 && (
            <span style={{
              background: "#3b82f6",
              color: "#fff",
              borderRadius: "10px",
              padding: "2px 6px",
              fontSize: "0.7rem",
              fontWeight: "700",
              minWidth: "20px",
              textAlign: "center"
            }}>
              {collegeItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("passenger")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: tab === "passenger" ? "#fff" : "transparent",
            color: tab === "passenger" ? "#10b981" : "#6b7280",
            fontSize: "0.95rem",
            fontWeight: tab === "passenger" ? "700" : "500",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: tab === "passenger" ? "0 2px 8px rgba(16,185,129,0.15)" : "none"
          }}
          onMouseOver={(e) => {
            if (tab !== "passenger") {
              e.currentTarget.style.background = "rgba(16,185,129,0.08)";
              e.currentTarget.style.color = "#10b981";
            }
          }}
          onMouseOut={(e) => {
            if (tab !== "passenger") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }
          }}
        >
          🎫 Passengers
          {passengerItems.length > 0 && (
            <span style={{
              background: "#10b981",
              color: "#fff",
              borderRadius: "10px",
              padding: "2px 6px",
              fontSize: "0.7rem",
              fontWeight: "700",
              minWidth: "20px",
              textAlign: "center"
            }}>
              {passengerItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("approved")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: tab === "approved" ? "#fff" : "transparent",
            color: tab === "approved" ? "#8b5cf6" : "#6b7280",
            fontSize: "0.95rem",
            fontWeight: tab === "approved" ? "700" : "500",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: tab === "approved" ? "0 2px 8px rgba(139,92,246,0.15)" : "none"
          }}
          onMouseOver={(e) => {
            if (tab !== "approved") {
              e.currentTarget.style.background = "rgba(139,92,246,0.08)";
              e.currentTarget.style.color = "#8b5cf6";
            }
          }}
          onMouseOut={(e) => {
            if (tab !== "approved") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }
          }}
        >
          ✅ Approved Passes
          {(approvedStudents.length + approvedPassengers.length) > 0 && (
            <span style={{
              background: "#8b5cf6",
              color: "#fff",
              borderRadius: "10px",
              padding: "2px 6px",
              fontSize: "0.7rem",
              fontWeight: "700",
              minWidth: "20px",
              textAlign: "center"
            }}>
              {approvedStudents.length + approvedPassengers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("cardmgmt")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: tab === "cardmgmt" ? "#fff" : "transparent",
            color: tab === "cardmgmt" ? "#ef4444" : "#6b7280",
            fontSize: "0.95rem",
            fontWeight: tab === "cardmgmt" ? "700" : "500",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: tab === "cardmgmt" ? "0 2px 8px rgba(239,68,68,0.15)" : "none"
          }}
          onMouseOver={(e) => {
            if (tab !== "cardmgmt") {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.color = "#ef4444";
            }
          }}
          onMouseOut={(e) => {
            if (tab !== "cardmgmt") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }
          }}
        >
          🔧 Card Management
        </button>
      </div>
      
      {/* Real-time Status Indicator */}
      {tab === "approved" && (
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
      )}

      {error && (
        <div style={{
          background: "#fee2e2",
          color: "#991b1b",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #fca5a5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>⚠️ {typeof error === 'string' ? error : 'An error occurred'}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#991b1b",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0",
              lineHeight: "1"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.05)",
        overflowX: "auto"
      }}>
        {loading && tab !== "cardmgmt" && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⏳</div>
            <div>Loading registrations...</div>
          </div>
        )}

        {/* Card Management Tab */}
        {tab === "cardmgmt" && (
          <div>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", color: "#0b1220" }}>
              🔧 Card Management - Scan & Manage RFID Cards
            </h3>

            {/* Scan Section */}
            <div style={{
              padding: "40px",
              textAlign: "center",
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              borderRadius: "12px",
              marginBottom: "24px"
            }}>
              <div style={{
                width: "100px",
                height: "100px",
                margin: "0 auto 24px",
                background: scanning ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                animation: scanning ? "pulse 1.5s infinite" : "none",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
              }}>
                {scanning ? "📡" : "💳"}
              </div>

              <button
                onClick={scanCard}
                disabled={scanning}
                style={{
                  padding: "16px 40px",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  background: scanning 
                    ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" 
                    : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: scanning ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 16px rgba(239,68,68,0.4)",
                  transition: "all 0.3s ease",
                  minWidth: "240px"
                }}
              >
                {scanning ? "⏳ Scanning..." : "🎫 Scan Card"}
              </button>

              {scanning && (
                <p style={{
                  marginTop: "16px",
                  color: "#ef4444",
                  fontSize: "1rem",
                  fontWeight: "600"
                }}>
                  📱 Place card near EM-18 reader...
                </p>
              )}
            </div>

            {/* Scanned Card Info */}
            {scannedCard && (
              <div style={{
                padding: "32px",
                background: scannedCard.valid ? "#ecfdf5" : "#fef2f2",
                borderTop: `4px solid ${scannedCard.valid ? "#10b981" : "#ef4444"}`,
                borderRadius: "12px",
                marginBottom: "24px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "24px"
                }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: scannedCard.valid ? "#10b981" : "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem"
                  }}>
                    {scannedCard.valid ? "✅" : "❌"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: "0 0 4px 0",
                      fontSize: "1.5rem",
                      color: scannedCard.valid ? "#065f46" : "#991b1b",
                      fontWeight: "700"
                    }}>
                      {scannedCard.valid ? "Valid Pass Found" : "Invalid/No Pass"}
                    </h3>
                    <p style={{
                      margin: 0,
                      color: scannedCard.valid ? "#047857" : "#dc2626",
                      fontSize: "0.95rem"
                    }}>
                      {scannedCard.message}
                    </p>
                  </div>
                </div>

                {/* Pass Details - Show for both valid and expired passes */}
                <div>
                  {/* Photo */}
                  {scannedCard.photoPath && (
                    <div style={{ textAlign: "center", marginBottom: "24px" }}>
                      <div style={{
                        width: "120px",
                        height: "120px",
                        margin: "0 auto",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: `3px solid ${scannedCard.valid ? "#10b981" : "#ef4444"}`,
                        boxShadow: `0 6px 16px ${scannedCard.valid ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                      }}>
                        <img
                          src={`http://localhost:4000/uploads/${scannedCard.photoPath}`}
                          alt="Photo"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                          onError={(e) => e.currentTarget.style.display = "none"}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pass Details */}
                  {scannedCard.passengerName && (
                    <div style={{
                      background: "#fff",
                      borderRadius: "10px",
                      padding: "24px",
                      marginBottom: "24px"
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "4px" }}>Name</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1f2937" }}>
                            {scannedCard.passengerName}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "4px" }}>Pass Type</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1f2937" }}>
                            {scannedCard.passType}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "4px" }}>Pass Number</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1f2937" }}>
                            {scannedCard.passNumber}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "4px" }}>Card Number (UID)</div>
                          <div style={{ 
                            fontSize: "1rem", 
                            fontWeight: "700", 
                            color: "#1f2937",
                            fontFamily: "monospace",
                            letterSpacing: "0.5px"
                          }}>
                            {scannedCard.rfidUid || "N/A"}
                          </div>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "4px" }}>Valid Until</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1f2937" }}>
                            {formatDate(scannedCard.validUntil)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Only show if pass has details */}
                  {scannedCard.passengerName && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <button
                          onClick={expireCard}
                          disabled={expiring}
                          style={{
                            padding: "14px 20px",
                            background: expiring ? "#fcd34d" : "#f59e0b",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: expiring ? "not-allowed" : "pointer",
                            fontWeight: "700",
                            fontSize: "1rem",
                            transition: "all 0.3s ease"
                          }}
                        >
                          {expiring ? "⏳ Expiring..." : "⏰ Expire Pass"}
                        </button>

                        <button
                          onClick={eraseCard}
                          disabled={erasing}
                          style={{
                            padding: "14px 20px",
                            background: erasing ? "#fca5a5" : "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: erasing ? "not-allowed" : "pointer",
                            fontWeight: "700",
                            fontSize: "1rem",
                            transition: "all 0.3s ease"
                          }}
                        >
                          {erasing ? "⏳ Erasing..." : "🗑️ Erase Card"}
                        </button>
                      </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && items.length === 0 && tab !== "cardmgmt" && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>✨</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "500" }}>No pending approvals</div>
            <div style={{ fontSize: "0.9rem", marginTop: "8px" }}>All registrations have been reviewed!</div>
          </div>
        )}

        {!loading && items.length > 0 && tab !== "cardmgmt" && (
          <div>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", color: "#0b1220" }}>
              {tab === "college" ? "📋 College Students Pending Approval" : tab === "passenger" ? "🎫 Passenger Pass Requests" : tab === "approved" ? "📦 Approved Passes" : "📦 Hidden Passes"}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.95rem"
              }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>ID</th>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>
                      {tab === "college" ? "Student Name" : tab === "passenger" ? "Passenger Name" : "Name"}
                    </th>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>
                      {tab === "college" ? "Student ID" : tab === "passenger" ? "Email/Contact" : "Type"}
                    </th>
                    {(tab === "passenger" || tab === "approved") && <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>Pass Type</th>}
                    {tab === "approved" && <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#0b1220" }}>Status</th>}
                    <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#0b1220" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    // Calculate status for approved passes (real-time with lastUpdate trigger)
                    const now = lastUpdate;
                    const isExpired = tab === "approved" && (it as any).passValidity && new Date((it as any).passValidity) < now;
                    const isDeleted = tab === "approved" && !(it as any).rfidUid;
                    const statusText = isDeleted ? "Deleted" : isExpired ? "Expired" : "Active";
                    const statusColor = isDeleted ? "#ef4444" : isExpired ? "#f59e0b" : "#10b981";
                    const statusBg = isDeleted ? "#fef2f2" : isExpired ? "#fffbeb" : "#f0fdf4";
                    
                    return (
                    <tr key={it.id} style={{
                      borderBottom: "1px solid #e5e7eb",
                      background: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                      transition: "background 0.2s ease"
                    }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#f0f4ff")}
                      onMouseOut={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f9fafb")}
                    >
                      <td style={{ padding: "14px", color: "#0b1220", fontWeight: "600" }}>{it.id}</td>
                      <td style={{ padding: "14px", color: "#0b1220", fontWeight: "500" }}>
                        {tab === "college" ? it.studentName : tab === "passenger" ? it.passengerName : (it as any).type === "student" ? (it as any).studentName : it.passengerName}
                      </td>
                      <td style={{ padding: "14px", color: "#0b1220", fontFamily: "monospace" }}>
                        {tab === "college" ? it.studentId : tab === "passenger" ? (it as any).email || "N/A" : (it as any).type === "student" ? it.studentId : ((it as any).email || "N/A")}
                      </td>
                      {(tab === "passenger" || tab === "approved") && (
                        <td style={{ padding: "14px", color: "#0b1220" }}>
                          {tab === "approved" ? (it as any).type === "student" ? "STUDENT" : (it.passType || "monthly").toUpperCase() : (it.passType || "monthly").toUpperCase()}
                        </td>
                      )}
                      {tab === "approved" && (
                        <td style={{ padding: "14px", textAlign: "center" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            background: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusColor}30`
                          }}>
                            {isDeleted ? "🗑️" : isExpired ? "⏰" : "✅"} {statusText}
                          </span>
                        </td>
                      )}
                      <td style={{ padding: "14px", textAlign: "center", width: "200px", minWidth: "200px" }}>
                        {tab === "college" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                            <button
                              onClick={() => setSelectedPassenger(it)}
                              style={{
                                width: "100%",
                                padding: "8px 16px",
                                background: "#3b82f6",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                transition: "all 0.3s ease",
                                marginBottom: "0px"
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = "none";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              👁️ View Details
                            </button>
                            <button
                              onClick={() => approve(it.id)}
                              disabled={approving === it.id}
                              style={{
                                width: "100%",
                                padding: "8px 16px",
                                background: approving === it.id ? "#d1d5db" : "linear-gradient(90deg, #10b981, #059669)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: approving === it.id ? "not-allowed" : "pointer",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                transition: "all 0.3s ease"
                              }}
                              onMouseOver={(e) => {
                                if (approving !== it.id) {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.3)";
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = "none";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              {approving === it.id ? "⏳ Approving..." : "✅ Approve"}
                            </button>
                            {approving === it.id && (
                              <div style={{ width: "100%" }}>
                                {/* Progress bar */}
                                <div style={{
                                  width: "100%",
                                  height: "6px",
                                  background: "#e5e7eb",
                                  borderRadius: "3px",
                                  overflow: "hidden",
                                  marginBottom: "6px"
                                }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${approveProgress}%`,
                                    background: "linear-gradient(90deg, #10b981, #059669)",
                                    transition: "width 0.3s ease",
                                    borderRadius: "3px"
                                  }} />
                                </div>
                                {/* Progress text */}
                                <div style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                  textAlign: "left",
                                  lineHeight: "1.4"
                                }}>
                                  <div>{approveStage}</div>
                                  <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "2px" }}>
                                    {approveProgress}%
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : tab === "passenger" ? (
                          <button
                            onClick={() => setSelectedPassenger(it)}
                            style={{
                              width: "100%",
                              padding: "8px 16px",
                              background: "#3b82f6",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                              fontWeight: "600",
                              transition: "all 0.3s ease"
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            👁️ View Details
                          </button>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                            <button
                              onClick={() => generatePass(it.id, (it as any).type || "passenger")}
                              disabled={approving === it.id}
                              style={{
                                width: "100%",
                                padding: "8px 16px",
                                background: approving === it.id ? "#d1d5db" : "linear-gradient(90deg, #f59e0b, #d97706)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: approving === it.id ? "not-allowed" : "pointer",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                transition: "all 0.3s ease"
                              }}
                              onMouseOver={(e) => {
                                if (approving !== it.id) {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(245,158,11,0.3)";
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = "none";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              {approving === it.id ? "⏳ Generating..." : "🎫 Generate Pass"}
                            </button>
                            {approving === it.id && (
                              <div style={{ width: "100%" }}>
                                {/* Progress bar */}
                                <div style={{
                                  width: "100%",
                                  height: "6px",
                                  background: "#e5e7eb",
                                  borderRadius: "3px",
                                  overflow: "hidden",
                                  marginBottom: "6px"
                                }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${approveProgress}%`,
                                    background: "linear-gradient(90deg, #f59e0b, #d97706)",
                                    transition: "width 0.3s ease",
                                    borderRadius: "3px"
                                  }} />
                                </div>
                                {/* Progress text */}
                                <div style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                  textAlign: "left",
                                  lineHeight: "1.4"
                                }}>
                                  <div>{approveStage}</div>
                                  <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "2px" }}>
                                    {approveProgress}%
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Passenger Details Modal */}
      {selectedPassenger && !approveSuccess && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 25px rgba(0,0,0,0.2)"
          }}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "24px",
              borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#0b1220" }}>🎫 Passenger Details</h2>
              <button
                onClick={() => {
                  setSelectedPassenger(null);
                  setIsDeclineOpen(false);
                  setDeclineReason("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6b7280"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "24px" }}>
              {!isDeclineOpen ? (
                <>
                  {/* Personal Information */}
                  <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "#0b1220", fontWeight: "600" }}>
                      📋 {(selectedPassenger as any).studentName ? "Student" : "Personal"} Information
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                          Full Name
                        </label>
                        <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                          {(selectedPassenger as any).studentName || selectedPassenger.passengerName}
                        </div>
                      </div>
                      {(selectedPassenger as any).studentId && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                            Student ID
                          </label>
                          <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                            {(selectedPassenger as any).studentId}
                          </div>
                        </div>
                      )}
                      {(selectedPassenger as any).course && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                            Course
                          </label>
                          <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                            {(selectedPassenger as any).course}
                          </div>
                        </div>
                      )}
                      {selectedPassenger.age && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                            Age
                          </label>
                          <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                            {selectedPassenger.age} years
                          </div>
                        </div>
                      )}
                      {selectedPassenger.phoneNumber && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                            Phone Number
                          </label>
                          <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                            {selectedPassenger.phoneNumber}
                          </div>
                        </div>
                      )}
                      {selectedPassenger.email && (
                        <div>
                          <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                            Email
                          </label>
                          <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                            {selectedPassenger.email}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address - only for passengers */}
                  {selectedPassenger.address && (
                    <div style={{ marginBottom: "24px" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                        Address
                      </label>
                      <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500", whiteSpace: "pre-wrap" }}>
                        {selectedPassenger.address}
                      </div>
                    </div>
                  )}

                  {/* Government ID - only for passengers */}
                  {(selectedPassenger as any).idType && (
                    <div style={{ marginBottom: "24px", padding: "16px", background: "#f0fdf4", borderRadius: "8px", borderLeft: "4px solid #10b981" }}>
                      <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#0b1220", fontWeight: "600" }}>
                      🆔 Government ID
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                          ID Type
                        </label>
                        <div style={{ fontSize: "0.9rem", color: "#0b1220", fontWeight: "500" }}>
                          {selectedPassenger.idType?.toUpperCase() || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                          ID Number
                        </label>
                        <div style={{ fontSize: "0.9rem", color: "#0b1220", fontWeight: "500", fontFamily: "monospace" }}>
                          {selectedPassenger.idNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Pass Type - only for passengers */}
                  {selectedPassenger.passType && (
                    <div style={{ marginBottom: "24px", padding: "16px", background: "#eff6ff", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                        🎫 Requested Pass Type
                      </label>
                      <div style={{ fontSize: "1rem", color: "#0b1220", fontWeight: "600" }}>
                        {selectedPassenger.passType?.toUpperCase() || "MONTHLY"}
                      </div>
                    </div>
                  )}

                  {/* Document Verification Section */}
                  <div style={{ marginBottom: "24px", padding: "16px", background: "#fef3c7", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#92400e", fontWeight: "600" }}>
                      📄 Documents & Photo Verification
                    </h3>
                    
                    {/* Documents */}
                    {selectedPassenger.documents && (
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#92400e", marginBottom: "8px", fontWeight: "500" }}>
                          📎 Uploaded Documents
                        </label>
                        <div style={{ background: "#fff", padding: "12px", borderRadius: "6px", fontSize: "0.9rem" }}>
                          {(() => {
                            try {
                              const docs = JSON.parse(selectedPassenger.documents);
                              return docs.length > 0 ? (
                                <ul style={{ margin: "0", paddingLeft: "20px" }}>
                                  {docs.map((doc: string, idx: number) => (
                                    <li key={idx} style={{ color: "#1f2937", marginBottom: "4px" }}>
                                      <a href={`http://localhost:4000/uploads/${doc}`} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>
                                        📄 View Document {idx + 1}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div style={{ color: "#6b7280" }}>No documents uploaded</div>
                              );
                            } catch {
                              return <div style={{ color: "#6b7280" }}>No documents available</div>;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {/* Photo */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", color: "#92400e", marginBottom: "8px", fontWeight: "500" }}>
                        📸 Verification Photo
                      </label>
                      <div style={{ background: "#fff", padding: "12px", borderRadius: "6px", textAlign: "center" }}>
                        {(selectedPassenger as any).photoPath ? (
                          <div>
                            <img 
                              src={`http://localhost:4000/uploads/${(selectedPassenger as any).photoPath}`} 
                              alt="Passenger photo" 
                              style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
                            />
                          </div>
                        ) : (
                          <div style={{ color: "#6b7280" }}>No photo uploaded</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                    <button
                      onClick={() => {
                        approve(selectedPassenger.id);
                        setSelectedPassenger(null);
                      }}
                      disabled={approving === selectedPassenger.id}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: approving === selectedPassenger.id ? "#d1d5db" : "linear-gradient(90deg, #10b981, #059669)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: approving === selectedPassenger.id ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        transition: "all 0.3s ease"
                      }}
                      onMouseOver={(e) => {
                        if (approving !== selectedPassenger.id) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.3)";
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {approving === selectedPassenger.id ? "⏳ Approving..." : "✅ Approve"}
                    </button>
                    <button
                      onClick={() => setIsDeclineOpen(true)}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        transition: "all 0.3s ease"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#dc2626";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#ef4444";
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      ❌ Decline
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Decline Form */}
                  <div>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", color: "#0b1220", fontWeight: "600" }}>
                      📝 Reason for Decline
                    </h3>
                    <p style={{ color: "#6b7280", margin: "0 0 12px 0", fontSize: "0.9rem" }}>
                      Please provide a clear reason so the passenger can resubmit with corrections
                    </p>
                    <textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="e.g., ID number doesn't match documents, Address incomplete, etc."
                      rows={5}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "0.95rem",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        resize: "vertical"
                      }}
                    />
                    
                    {/* Decline Buttons */}
                    <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                      <button
                        onClick={() => {
                          setIsDeclineOpen(false);
                          setDeclineReason("");
                        }}
                        style={{
                          flex: 1,
                          padding: "12px",
                          background: "transparent",
                          border: "2px solid #e5e7eb",
                          color: "#0b1220",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "0.95rem",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#f9fafb";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={decline}
                        disabled={approving === selectedPassenger.id || !declineReason.trim()}
                        style={{
                          flex: 1,
                          padding: "12px",
                          background: approving === selectedPassenger.id || !declineReason.trim() ? "#d1d5db" : "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          cursor: approving === selectedPassenger.id || !declineReason.trim() ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          fontSize: "0.95rem",
                          transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                          if (approving !== selectedPassenger.id && declineReason.trim()) {
                            e.currentTarget.style.background = "#dc2626";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.3)";
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = approving === selectedPassenger.id || !declineReason.trim() ? "#d1d5db" : "#ef4444";
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {approving === selectedPassenger.id ? "⏳ Declining..." : "✅ Confirm Decline"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Success Modal */}
      {/* Progress Modal - Shows while approving */}
      {approving !== null && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            maxWidth: "420px",
            width: "90%",
            boxShadow: "0 20px 25px rgba(0,0,0,0.3)",
            overflow: "hidden"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #3b82f6, #1e40af)",
              padding: "28px 24px",
              color: "#fff",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "12px", animation: "spin 1s linear infinite" }}>⏳</div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "1.3rem", fontWeight: "600" }}>Processing Pass Request</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: "0.9rem" }}>Writing data to RFID card...</p>
            </div>

            <div style={{ padding: "28px 24px" }}>
              {/* Large progress bar */}
              <div style={{
                width: "100%",
                height: "10px",
                background: "#e5e7eb",
                borderRadius: "5px",
                overflow: "hidden",
                marginBottom: "16px"
              }}>
                <div style={{
                  height: "100%",
                  width: `${approveProgress}%`,
                  background: "linear-gradient(90deg, #3b82f6, #1e40af)",
                  transition: "width 0.4s ease",
                  borderRadius: "5px",
                  boxShadow: "0 0 10px rgba(59,130,246,0.5)"
                }} />
              </div>

              {/* Stage description */}
              <div style={{
                textAlign: "center",
                marginBottom: "16px"
              }}>
                <div style={{
                  fontSize: "0.95rem",
                  color: "#1f2937",
                  fontWeight: "500",
                  lineHeight: "1.5"
                }}>
                  {approveStage}
                </div>
                <div style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  color: "#3b82f6",
                  marginTop: "8px"
                }}>
                  {approveProgress}%
                </div>
              </div>

              {/* Sub-steps */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                fontSize: "0.75rem",
                color: "#6b7280"
              }}>
                <div style={{ padding: "8px", background: approveProgress >= 15 ? "#dbeafe" : "#f3f4f6", borderRadius: "4px" }}>
                  {approveProgress >= 15 ? "✅" : "⏳"} Loading
                </div>
                <div style={{ padding: "8px", background: approveProgress >= 30 ? "#dbeafe" : "#f3f4f6", borderRadius: "4px" }}>
                  {approveProgress >= 30 ? "✅" : "⏳"} ID Gen
                </div>
                <div style={{ padding: "8px", background: approveProgress >= 45 ? "#dbeafe" : "#f3f4f6", borderRadius: "4px" }}>
                  {approveProgress >= 45 ? "✅" : "⏳"} Payload
                </div>
                <div style={{ padding: "8px", background: approveProgress >= 65 ? "#dbeafe" : "#f3f4f6", borderRadius: "4px" }}>
                  {approveProgress >= 65 ? "✅" : "⏳"} Write Card
                </div>
                <div style={{ padding: "8px", background: approveProgress >= 85 ? "#dbeafe" : "#f3f4f6", borderRadius: "4px" }}>
                  {approveProgress >= 85 ? "✅" : "⏳"} Verify
                </div>
                <div style={{ padding: "8px", background: approveProgress >= 95 ? "#dbeafe" : "#f3f4f6", borderRadius: "4px" }}>
                  {approveProgress >= 95 ? "✅" : "⏳"} Save
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {approveSuccess && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 20px 25px rgba(0,0,0,0.2)",
            overflow: "hidden"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              padding: "24px",
              color: "#fff",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✅</div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "1.5rem" }}>Pass Approved!</h2>
              <p style={{ margin: 0, opacity: 0.9 }}>RFID card data written successfully</p>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "8px", fontWeight: "600" }}>
                  🆔 Unique Pass ID (for app login)
                </label>
                <div style={{
                  padding: "12px",
                  background: "#f3f4f6",
                  border: "2px solid #10b981",
                  borderRadius: "8px",
                  fontFamily: "monospace",
                  fontSize: "1.1rem",
                  color: "#0b1220",
                  fontWeight: "600",
                  wordBreak: "break-all",
                  textAlign: "center"
                }}>
                  {approveSuccess.uniquePassId}
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "8px", fontWeight: "600" }}>
                  📱 RFID UID (card identifier)
                </label>
                <div style={{
                  padding: "12px",
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontFamily: "monospace",
                  fontSize: "0.95rem",
                  color: "#0b1220",
                  wordBreak: "break-all",
                  textAlign: "center"
                }}>
                  {approveSuccess.rfidUid}
                </div>
              </div>

              <p style={{
                color: "#6b7280",
                fontSize: "0.9rem",
                margin: "16px 0",
                padding: "12px",
                background: "#f0fdf4",
                borderRadius: "8px",
                borderLeft: "3px solid #10b981"
              }}>
                ℹ️ The passenger can use the <strong>Unique Pass ID</strong> to login to the mobile app and view their pass information.
              </p>

              <button
                onClick={() => {
                  setApproveSuccess(null);
                  setSelectedPassenger(null);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#059669";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#10b981";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                ✅ Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {approveError && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 20px 25px rgba(0,0,0,0.2)",
            overflow: "hidden"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              padding: "24px",
              color: "#fff",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>❌</div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "1.5rem" }}>Error</h2>
              <p style={{ margin: 0, opacity: 0.9 }}>Failed to generate pass</p>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{
                padding: "16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                marginBottom: "16px",
                color: "#991b1b"
              }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>
                  {approveError.message}
                </p>
                {approveError.details && (
                  <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>
                    ({approveError.details})
                  </p>
                )}
              </div>

              <div style={{
                padding: "12px",
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: "8px",
                marginBottom: "16px",
                color: "#78350f",
                fontSize: "0.9rem",
                lineHeight: "1.5"
              }}>
                <strong>💡 Troubleshooting:</strong>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                  <li>Ensure EM-18 reader is connected to COM5</li>
                  <li>Place the RFID card within 5-8cm of the reader</li>
                  <li>Make sure Prisma Studio is closed (uses same port)</li>
                  <li>Check that blue light appears and beep sounds on card tap</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setApproveError(null);
                  setApproving(null);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#ef4444";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Card Modal */}
      {duplicateCard && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 20px 25px rgba(0,0,0,0.2)",
            overflow: "hidden"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #f59e0b, #dc2626)",
              padding: "24px",
              color: "#fff",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "1.5rem" }}>Card Already Has Active Pass</h2>
              <p style={{ margin: 0, opacity: 0.9 }}>This RFID card is registered with another user</p>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{
                padding: "16px",
                background: duplicateCard.isStudent ? "#fef3c7" : "#dbeafe",
                border: `1px solid ${duplicateCard.isStudent ? "#fcd34d" : "#93c5fd"}`,
                borderRadius: "8px",
                marginBottom: "20px",
                color: duplicateCard.isStudent ? "#78350f" : "#1e40af"
              }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>
                  Current Owner: <strong>{duplicateCard.name}</strong>
                </p>
                <p style={{ margin: "0 0 4px 0", fontSize: "0.9rem" }}>
                  Type: {duplicateCard.type === 'student' ? 'Student Monthly' : (duplicateCard.type || 'Monthly')}
                </p>
                <p style={{ margin: "0 0 4px 0", fontSize: "0.9rem" }}>
                  Expires: {formatDate(duplicateCard.expiryDate.toISOString())}
                </p>
                <p style={{ margin: "0", fontSize: "0.85rem", opacity: 0.8 }}>
                  Status: <strong>ACTIVE</strong>
                </p>
              </div>

              <div style={{
                padding: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                marginBottom: "20px",
                color: "#991b1b",
                fontSize: "0.9rem"
              }}>
                💡 <strong>What will happen?</strong>
                <p style={{ margin: "6px 0 0 0" }}>
                  If you continue, the old pass will be replaced with the new one. The previous owner will no longer be able to use this card.
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setDuplicateCard(null);
                    setApproving(null);
                    setApproveProgress(0);
                    setApproveStage("");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#6b7280",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#4b5563";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#6b7280";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={() => {
                    // Retry with force=true
                    setDuplicateCard(null);
                    const pendingId = (window as any).__pendingPassId;
                    const pendingType = (window as any).__pendingPassType;
                    
                    if (pendingId && pendingType) {
                      const token = localStorage.getItem("sbp_token");
                      const endpoint = pendingType === "student"
                        ? `http://localhost:4000/api/admin/registrations/${pendingId}/approve`
                        : `http://localhost:4000/api/admin/passenger-registrations/${pendingId}/approve`;

                      fetch(endpoint, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ simulate: false, force: true })
                      })
                        .then(r => r.json())
                        .then(json => {
                          if (json.registration || json.busPass) {
                            setApproveProgress(100);
                            setApproveStage("✅ Pass updated successfully!");
                            setApproveSuccess({
                              uniquePassId: json.uniquePassId || "N/A",
                              rfidUid: json.rfidUid || "N/A"
                            });
                            
                            if (pendingType === "student") {
                              setApprovedStudents((s) => s.filter((it) => it.id !== pendingId));
                            } else {
                              setApprovedPassengers((s) => s.filter((it) => it.id !== pendingId));
                            }
                          } else {
                            setApproveError({
                              message: json.error || "Failed to override pass",
                              details: json.details
                            });
                          }
                        })
                        .catch(e => {
                          setApproveError({
                            message: "Network error: " + String(e),
                            details: String(e)
                          });
                        })
                        .finally(() => {
                          setApproving(null);
                          setApproveProgress(0);
                          setApproveStage("");
                        });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#059669";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#10b981";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  ✅ Continue - Overwrite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
