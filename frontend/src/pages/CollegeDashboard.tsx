import React, { useEffect, useState } from "react";

interface Reg {
  id: number;
  studentName: string;
  studentId: string;
  course?: string | null;
  status: string;
  createdAt: string;
}

type Props = {
  onLogout?: () => void;
};

export default function CollegeDashboard({ onLogout }: Props) {
  const [items, setItems] = useState<Reg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ studentName: "", studentId: "", course: "", collegeId: "1" });

  const load = () => {
    setLoading(true);
    const token = localStorage.getItem("sbp_token");
    const collegeId = form.collegeId || "1";
    fetch(`http://localhost:4000/api/college/students?collegeId=${collegeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.items) setItems(json.items);
        else {
          const errorMsg = json.message || json.error || "Failed to load students";
          setError(errorMsg);
        }
      })
      .catch((e) => setError("Network error: " + String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("sbp_token");
    fetch("http://localhost:4000/api/college/students", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.registration) {
          setForm({ studentName: "", studentId: "", course: "", collegeId: form.collegeId });
          load();
        } else {
          // Show user-friendly error message
          const errorMsg = json.message || json.error || "Failed to register student";
          setError(errorMsg);
        }
      })
      .catch((e) => setError("Network error: " + String(e)));
  };

  const uploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Bulk upload feature has been removed
    console.warn("Bulk upload feature is no longer available. Please use manual entry.");
  };

  const pendingCount = items.filter(it => it.status === "pending").length;
  const approvedCount = items.filter(it => it.status === "approved").length;

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
          <h1 style={{ margin: "0 0 4px 0", fontSize: "2rem", color: "#0b1220" }}>College Dashboard</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem" }}>Manage student registrations and RFID passes</p>
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

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <div style={{
          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          color: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(59,130,246,0.15)"
        }}>
          <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Pending Approvals</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", marginTop: "8px" }}>{pendingCount}</div>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(16,185,129,0.15)"
        }}>
          <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Approved Passes</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", marginTop: "8px" }}>{approvedCount}</div>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(245,158,11,0.15)"
        }}>
          <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Total Students</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", marginTop: "8px" }}>{items.length}</div>
        </div>
      </div>

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
          <span>⚠️ {error}</span>
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

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Manual Registration Card */}
        <div style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.15rem", color: "#0b1220" }}>� Register Student</h3>
          <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: "0.9rem" }}>Add a new student registration for bus pass approval</p>
          <form onSubmit={submit}>
            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#0b1220", marginBottom: "6px" }}>Student Name *</span>
              <input
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                required
                placeholder="John Doe"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  boxSizing: "border-box"
                }}
              />
            </label>
            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#0b1220", marginBottom: "6px" }}>Student ID *</span>
              <input
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                required
                placeholder="STU001"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  boxSizing: "border-box"
                }}
              />
            </label>
            <label style={{ display: "block", marginBottom: "16px" }}>
              <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#0b1220", marginBottom: "6px" }}>Course</span>
              <input
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                placeholder="B.Tech CSE"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  boxSizing: "border-box"
                }}
              />
            </label>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(90deg, #3b82f6, #2563eb)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "0.95rem",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
            >
              Register Student
            </button>
          </form>
        </div>
      </div>

      {/* Registrations Table */}
      <div style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.05)",
        overflowX: "auto"
      }}>
        <h3 style={{ margin: "0 0 20px 0", fontSize: "1.15rem", color: "#0b1220" }}>📋 All Registrations</h3>
        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            ⏳ Loading registrations...
          </div>
        )}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            No students registered yet. Add one to get started!
          </div>
        )}
        {!loading && items.length > 0 && (
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.95rem"
          }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>ID</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>Student ID</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>Course</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#0b1220" }}>Created</th>
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
                  <td style={{ padding: "12px", color: "#0b1220" }}>{it.id}</td>
                  <td style={{ padding: "12px", color: "#0b1220", fontWeight: "500" }}>{it.studentName}</td>
                  <td style={{ padding: "12px", color: "#0b1220", fontFamily: "monospace" }}>{it.studentId}</td>
                  <td style={{ padding: "12px", color: "#6b7280" }}>{it.course || "—"}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      background: it.status === "pending" ? "#fef3c7" : "#d1fae5",
                      color: it.status === "pending" ? "#92400e" : "#065f46"
                    }}>
                      {it.status === "pending" ? "⏳ Pending" : "✅ Approved"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: "#6b7280", fontSize: "0.85rem" }}>
                    {new Date(it.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
