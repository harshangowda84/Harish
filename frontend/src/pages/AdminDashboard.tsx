import React, { useEffect, useState } from "react";

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
}

type Props = {
  onLogout?: () => void;
};

export default function AdminDashboard({ onLogout }: Props) {
  const [tab, setTab] = useState<"college" | "passenger" | "approved">("college");
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
  const [approveProgress, setApproveProgress] = useState<number>(0); // 0-100
  const [approveStage, setApproveStage] = useState<string>(""); // Current stage description

  useEffect(() => {
    const token = localStorage.getItem("sbp_token");
    if (!token) {
      setError("Not logged in");
      return;
    }

    setLoading(true);

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
  }, []);

  const approve = (id: number) => {
    setApproving(id);
    setApproveProgress(0);
    setApproveStage("Initializing...");
    
    const token = localStorage.getItem("sbp_token");
    
    const endpoint = tab === "college" 
      ? `http://localhost:4000/api/admin/registrations/${id}/approve`
      : `http://localhost:4000/api/admin/passenger-registrations/${id}/approve`;

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
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ simulate: false })
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.busPass || json.registration) {
          // Show 100% completion
          setApproveProgress(100);
          setApproveStage("✅ Pass created successfully!");
          
          // Show success with unique ID
          setApproveSuccess({
            uniquePassId: json.uniquePassId || "N/A",
            rfidUid: json.rfidUid || "N/A"
          });
          
          if (tab === "college") {
            setCollegeItems((s) => s.filter((it) => it.id !== id));
          } else {
            setPassengerItems((s) => s.filter((it) => it.id !== id));
          }
        } else {
          setApproveProgress(0);
          setApproveStage("");
          alert("Error: " + JSON.stringify(json));
        }
      })
      .catch((e) => {
        setApproveProgress(0);
        setApproveStage("");
        alert(String(e));
      })
      .finally(() => {
        setTimeout(() => {
          setApproving(null);
          setApproveProgress(0);
          setApproveStage("");
        }, 2000);
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <div style={{
          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          color: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(59,130,246,0.15)"
        }}>
          <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>🏢 College Students Pending</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", marginTop: "8px" }}>{collegeItems.length}</div>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(16,185,129,0.15)"
        }}>
          <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>🎫 Passenger Pass Requests</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", marginTop: "8px" }}>{passengerItems.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "2px solid #e5e7eb" }}>
        <button
          onClick={() => setTab("college")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            color: tab === "college" ? "#3b82f6" : "#6b7280",
            fontSize: "1rem",
            fontWeight: tab === "college" ? "700" : "500",
            cursor: "pointer",
            borderBottom: tab === "college" ? "3px solid #3b82f6" : "none",
            transition: "all 0.2s ease",
            marginBottom: "-2px"
          }}
        >
          🏢 College Students
        </button>
        <button
          onClick={() => setTab("passenger")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            color: tab === "passenger" ? "#10b981" : "#6b7280",
            fontSize: "1rem",
            fontWeight: tab === "passenger" ? "700" : "500",
            cursor: "pointer",
            borderBottom: tab === "passenger" ? "3px solid #10b981" : "none",
            transition: "all 0.2s ease",
            marginBottom: "-2px"
          }}
        >
          🎫 Passengers
        </button>
        <button
          onClick={() => setTab("approved")}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            color: tab === "approved" ? "#8b5cf6" : "#6b7280",
            fontSize: "1rem",
            fontWeight: tab === "approved" ? "700" : "500",
            cursor: "pointer",
            borderBottom: tab === "approved" ? "3px solid #8b5cf6" : "none",
            transition: "all 0.2s ease",
            marginBottom: "-2px"
          }}
        >
          ✅ Approved Passes
        </button>
      </div>

      {error && (
        <div style={{
          background: "#fee2e2",
          color: "#991b1b",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #fca5a5"
        }}>
          ⚠️ {error}
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
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⏳</div>
            <div>Loading registrations...</div>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>✨</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "500" }}>No pending approvals</div>
            <div style={{ fontSize: "0.9rem", marginTop: "8px" }}>All registrations have been reviewed!</div>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", color: "#0b1220" }}>
              {tab === "college" ? "📋 College Students Pending Approval" : "🎫 Passenger Pass Requests"}
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
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>{tab === "college" ? "Student Name" : "Passenger Name"}</th>
                    <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>{tab === "college" ? "Student ID" : "Email/Contact"}</th>
                    {tab === "passenger" && <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>Pass Type</th>}
                    <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#0b1220" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
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
                        {tab === "college" ? it.studentName : it.passengerName}
                      </td>
                      <td style={{ padding: "14px", color: "#0b1220", fontFamily: "monospace" }}>
                        {tab === "college" ? it.studentId : (it as any).email || "N/A"}
                      </td>
                      {tab === "passenger" && (
                        <td style={{ padding: "14px", color: "#0b1220" }}>
                          {(it.passType || "monthly").toUpperCase()}
                        </td>
                      )}
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        {tab === "college" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                            <button
                              onClick={() => approve(it.id)}
                              disabled={approving === it.id}
                              style={{
                                padding: "8px 16px",
                                background: approving === it.id ? "#d1d5db" : "linear-gradient(90deg, #10b981, #059669)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: approving === it.id ? "not-allowed" : "pointer",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                transition: "all 0.3s ease",
                                minWidth: "140px"
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
                              <div style={{ width: "100%", minWidth: "180px" }}>
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
                                  textAlign: "center",
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
                          <div style={{ display: "flex", gap: "8px", flexDirection: "column", alignItems: "center" }}>
                            <button
                              onClick={() => approve(it.id)}
                              disabled={approving === it.id}
                              style={{
                                padding: "8px 16px",
                                background: approving === it.id ? "#d1d5db" : "linear-gradient(90deg, #f59e0b, #d97706)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: approving === it.id ? "not-allowed" : "pointer",
                                fontSize: "0.9rem",
                                fontWeight: "600",
                                transition: "all 0.3s ease",
                                minWidth: "140px"
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
                              <div style={{ width: "100%", minWidth: "180px" }}>
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
                                  textAlign: "center",
                                  lineHeight: "1.4"
                                }}>
                                  <div>{approveStage}</div>
                                  <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "2px" }}>
                                    {approveProgress}%
                                  </div>
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => deletePass(it.id, (it as any).type || "student")}
                              disabled={deleting === it.id}
                              style={{
                                padding: "6px 12px",
                                background: deleting === it.id ? "#d1d5db" : "#ef4444",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: deleting === it.id ? "not-allowed" : "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                transition: "all 0.3s ease",
                                minWidth: "100px"
                              }}
                              onMouseOver={(e) => {
                                if (deleting !== it.id) {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.3)";
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = "none";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              {deleting === it.id ? "⏳ Hiding..." : "🗑️ Hide"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
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
                      📋 Personal Information
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                          Full Name
                        </label>
                        <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                          {selectedPassenger.passengerName}
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                          Age
                        </label>
                        <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                          {selectedPassenger.age} years
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                          Phone Number
                        </label>
                        <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                          {selectedPassenger.phoneNumber}
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                          Email
                        </label>
                        <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500" }}>
                          {selectedPassenger.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                      Address
                    </label>
                    <div style={{ fontSize: "0.95rem", color: "#0b1220", fontWeight: "500", whiteSpace: "pre-wrap" }}>
                      {selectedPassenger.address}
                    </div>
                  </div>

                  {/* Government ID */}
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

                  {/* Pass Type */}
                  <div style={{ marginBottom: "24px", padding: "16px", background: "#eff6ff", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", marginBottom: "4px", fontWeight: "500" }}>
                      🎫 Requested Pass Type
                    </label>
                    <div style={{ fontSize: "1rem", color: "#0b1220", fontWeight: "600" }}>
                      {selectedPassenger.passType?.toUpperCase() || "MONTHLY"}
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
    </div>
  );
}
