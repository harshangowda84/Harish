import React, { useEffect, useState } from "react";

interface Reg {
  id: number;
  studentName?: string;
  passengerName?: string;
  studentId?: string;
  passType?: string;
  status: string;
  type?: string;
}

type Props = {
  onLogout?: () => void;
};

export default function AdminDashboard({ onLogout }: Props) {
  const [tab, setTab] = useState<"college" | "passenger">("college");
  const [collegeItems, setCollegeItems] = useState<Reg[]>([]);
  const [passengerItems, setPassengerItems] = useState<Reg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("sbp_token");
    if (!token) {
      setError("Not logged in");
      return;
    }

    setLoading(true);

    // Fetch both college and passenger registrations
    Promise.all([
      fetch("http://localhost:4000/api/admin/registrations?status=pending&type=student", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch("http://localhost:4000/api/admin/registrations?status=pending&type=passenger", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json())
    ])
      .then(([studentData, passengerData]) => {
        if (studentData.items) setCollegeItems(studentData.items);
        if (passengerData.items) setPassengerItems(passengerData.items);
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
    const token = localStorage.getItem("sbp_token");
    
    const endpoint = tab === "college" 
      ? `http://localhost:4000/api/admin/registrations/${id}/approve`
      : `http://localhost:4000/api/admin/passenger-registrations/${id}/approve`;

    fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.busPass || json.registration) {
          if (tab === "college") {
            setCollegeItems((s) => s.filter((it) => it.id !== id));
          } else {
            setPassengerItems((s) => s.filter((it) => it.id !== id));
          }
        } else {
          alert("Error: " + JSON.stringify(json));
        }
      })
      .catch((e) => alert(String(e)))
      .finally(() => setApproving(null));
  };

  const items = tab === "college" ? collegeItems : passengerItems;

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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
