import React, { useState, useEffect } from "react";
import CollegeLogin from "./pages/CollegeLogin";
import PassengerLogin from "./pages/PassengerLogin";
import AdminLogin from "./pages/AdminLogin";
import CollegeDashboard from "./pages/CollegeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PassengerDashboard from "./pages/PassengerDashboard";

export default function App() {
  const [page, setPage] = useState<
    "home" | "college" | "passenger" | "admin" | "college-dashboard" | "admin-dashboard" | "passenger-dashboard"
  >("home");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for existing session on app load
  useEffect(() => {
    const token = localStorage.getItem("sbp_token");
    const role = localStorage.getItem("sbp_role");

    if (token && role) {
      // User is already logged in, redirect to their dashboard
      setIsLoggedIn(true);
      if (role === "college") {
        setPage("college-dashboard");
      } else if (role === "admin") {
        setPage("admin-dashboard");
      } else if (role === "passenger") {
        setPage("passenger-dashboard");
      }
    }
    
    setIsInitialized(true);
  }, []);

  const handleLoginSuccess = () => {
    const role = localStorage.getItem("sbp_role");
    setIsLoggedIn(true);
    if (role === "college") {
      setPage("college-dashboard");
    } else if (role === "admin") {
      setPage("admin-dashboard");
    } else if (role === "passenger") {
      setPage("passenger-dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sbp_token");
    localStorage.removeItem("sbp_role");
    setIsLoggedIn(false);
    setPage("home");
  };

  const goDashboard = () => {
    const role = localStorage.getItem("sbp_role");
    if (role === "college") setPage("college-dashboard");
    else if (role === "admin") setPage("admin-dashboard");
    else alert("Please login first and ensure role is set");
  };

  return (
    <div className="app-root">
      <header className="site-header">
        <div className="brand">
          <h1>BMTC Smart Bus Pass</h1>
          <p className="tag">Seamless bus pass management system</p>
        </div>
        <nav className="top-nav">
          <button onClick={() => setPage("home")} className="nav-link">Home</button>
          
          {!isLoggedIn ? (
            <>
              <button 
                onClick={() => setPage("college")} 
                className="nav-link"
                style={{ 
                  background: "rgba(59,130,246,0.1)",
                  color: "#3b82f6"
                }}
              >
                🏢 College
              </button>
              <button 
                onClick={() => setPage("passenger")} 
                className="nav-link"
                style={{ 
                  background: "rgba(16,185,129,0.1)",
                  color: "#10b981"
                }}
              >
                🎫 Passenger
              </button>
              <button 
                onClick={() => setPage("admin")} 
                className="nav-link"
                style={{ 
                  background: "rgba(245,158,11,0.1)",
                  color: "#f59e0b"
                }}
              >
                👨‍💼 Admin
              </button>
              <button onClick={goDashboard} className="nav-primary">Dashboard</button>
            </>
          ) : (
            <>
              <button 
                onClick={goDashboard} 
                className="nav-primary"
                style={{
                  background: "linear-gradient(90deg, #10b981, #059669)",
                  fontWeight: "600"
                }}
              >
                📊 Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="nav-link"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  fontWeight: "600"
                }}
              >
                🚪 Logout
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="site-main">
        {page === "home" && (
          <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: "60px", paddingTop: "40px" }}>
            {/* Hero Section */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "40px",
              alignItems: "center",
              textAlign: "center"
            }}>
              {/* Content */}
              <div>
                <div style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  marginBottom: "24px",
                  animation: "fadeIn 0.6s ease-out"
                }}>
                  ✨ Smart Campus Solution
                </div>

                <h1 style={{
                  fontSize: "2.8rem",
                  fontWeight: "700",
                  margin: "0 0 20px 0",
                  color: "#0b1220",
                  lineHeight: "1.2",
                  animation: "slideUp 0.6s ease-out 0.1s backwards"
                }}>
                  Unified Bus Pass Management
                </h1>

                <p style={{
                  fontSize: "1.05rem",
                  color: "#6b7280",
                  margin: "0 0 32px 0",
                  lineHeight: "1.6",
                  maxWidth: "600px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  animation: "slideUp 0.6s ease-out 0.2s backwards"
                }}>
                  For colleges managing students and passengers purchasing individual passes. Secure registration, quick approval, and instant RFID activation.
                </p>

                {/* Three CTA Buttons */}
                <div style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  animation: "slideUp 0.6s ease-out 0.3s backwards"
                }}>
                  <button
                    onClick={() => setPage("college")}
                    style={{
                      padding: "12px 24px",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      border: "none",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 20px rgba(59,130,246,0.3)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    🏢 College Login
                  </button>
                  <button
                    onClick={() => setPage("passenger")}
                    style={{
                      padding: "12px 24px",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      border: "2px solid #10b981",
                      borderRadius: "8px",
                      background: "transparent",
                      color: "#10b981",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f0fdf4";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    🎫 Passenger Login
                  </button>
                  <button
                    onClick={() => setPage("admin")}
                    style={{
                      padding: "12px 24px",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      border: "2px solid #f59e0b",
                      borderRadius: "8px",
                      background: "transparent",
                      color: "#f59e0b",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#fffbeb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    👨‍💼 Admin Login
                  </button>
                </div>
              </div>

              {/* Small Bus Illustration */}
              <div style={{
                animation: "slideUp 0.6s ease-out 0.4s backwards"
              }}>
                <svg style={{ width: "120px", height: "80px", marginBottom: "0" }} viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
                  {/* Bus body */}
                  <rect x="60" y="50" width="180" height="70" rx="8" fill="#3b82f6" />
                  {/* Windows */}
                  <rect x="75" y="60" width="30" height="25" rx="3" fill="#2563eb" opacity="0.7" />
                  <rect x="115" y="60" width="30" height="25" rx="3" fill="#2563eb" opacity="0.7" />
                  <rect x="155" y="60" width="30" height="25" rx="3" fill="#2563eb" opacity="0.7" />
                  <rect x="195" y="60" width="30" height="25" rx="3" fill="#2563eb" opacity="0.7" />
                  {/* Door */}
                  <rect x="230" y="60" width="6" height="35" fill="#1e40af" />
                  {/* Front */}
                  <rect x="50" y="60" width="10" height="35" fill="#1e40af" />
                  {/* Wheels */}
                  <circle cx="90" cy="125" r="8" fill="#1f2937" />
                  <circle cx="210" cy="125" r="8" fill="#1f2937" />
                  {/* Headlights */}
                  <circle cx="55" cy="72" r="3" fill="#fbbf24" />
                  <circle cx="55" cy="82" r="3" fill="#fbbf24" />
                </svg>
                <div style={{ fontSize: "0.9rem", color: "#6b7280", marginTop: "8px" }}>🚌 Streamlined & Fast</div>
              </div>
            </div>

            {/* Features Section */}
            <div style={{
              paddingTop: "40px",
              borderTop: "2px solid rgba(0,0,0,0.05)"
            }}>
              <div style={{ textAlign: "center", marginBottom: "48px" }}>
                <h2 style={{
                  fontSize: "2.25rem",
                  fontWeight: "700",
                  color: "#0b1220",
                  margin: "0 0 12px 0"
                }}>
                  Powerful Features
                </h2>
                <p style={{
                  fontSize: "1.05rem",
                  color: "#6b7280",
                  margin: 0
                }}>
                  Everything you need to manage student bus passes efficiently
                </p>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px"
              }}>
                {[
                  {
                    icon: "🏢",
                    title: "College Management",
                    desc: "Colleges register students in bulk or individually for bus passes"
                  },
                  {
                    icon: "🎫",
                    title: "Passenger Passes",
                    desc: "Individual passengers purchase day, weekly, or monthly passes online"
                  },
                  {
                    icon: "✅",
                    title: "Smart Approval",
                    desc: "Admin dashboard reviews and approves all registrations quickly"
                  },
                  {
                    icon: "�",
                    title: "Secure Authentication",
                    desc: "Role-based access with JWT token security for all users"
                  },
                  {
                    icon: "�",
                    title: "RFID Integration",
                    desc: "Write data directly to RFID cards with EM-18 reader support"
                  },
                  {
                    icon: "⚡",
                    title: "Instant Activation",
                    desc: "Approved passes are instantly ready to write to RFID cards"
                  }
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#fff",
                      padding: "32px",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      border: "1px solid rgba(0,0,0,0.05)",
                      transition: "all 0.3s ease",
                      cursor: "default",
                      animation: `slideUp 0.6s ease-out ${0.1 * (idx + 1)}s backwards`
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                    }}
                  >
                    <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{feature.icon}</div>
                    <h3 style={{
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      color: "#0b1220",
                      margin: "0 0 8px 0"
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      color: "#6b7280",
                      margin: 0,
                      fontSize: "0.95rem",
                      lineHeight: "1.5"
                    }}>
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Section */}
            <div style={{
              background: "linear-gradient(135deg, #f0f4ff, #f8f4ff)",
              padding: "60px 40px",
              borderRadius: "20px",
              marginTop: "20px"
            }}>
              <div style={{ textAlign: "center", marginBottom: "48px" }}>
                <h2 style={{
                  fontSize: "2.25rem",
                  fontWeight: "700",
                  color: "#0b1220",
                  margin: "0 0 12px 0"
                }}>
                  How It Works
                </h2>
                <p style={{
                  fontSize: "1.05rem",
                  color: "#6b7280",
                  margin: 0
                }}>
                  Two pathways: Students through colleges, or direct passenger purchases
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "32px" }}>
                {/* College Students Workflow */}
                <div>
                  <h3 style={{
                    fontSize: "1.15rem",
                    fontWeight: "700",
                    color: "#3b82f6",
                    margin: "0 0 20px 0",
                    textAlign: "center"
                  }}>
                    🏢 College Students
                  </h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "16px"
                  }}>
                    {[
                      { step: "1", title: "Register", desc: "College registers students via form or bulk CSV" },
                      { step: "2", title: "Submit", desc: "Applications sent to BMTC admin" },
                      { step: "3", title: "Approve", desc: "Admin reviews and approves registrations" },
                      { step: "4", title: "Activate", desc: "Pass written to RFID card" }
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        background: "#fff",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "40px",
                          height: "40px",
                          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                          color: "#fff",
                          fontSize: "1.1rem",
                          fontWeight: "700",
                          borderRadius: "50%",
                          flexShrink: 0
                        }}>
                          {item.step}
                        </div>
                        <div>
                          <div style={{
                            fontSize: "0.95rem",
                            fontWeight: "700",
                            color: "#0b1220",
                            margin: 0
                          }}>
                            {item.title}
                          </div>
                          <div style={{
                            color: "#6b7280",
                            margin: "4px 0 0 0",
                            fontSize: "0.85rem"
                          }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passenger Workflow */}
                <div>
                  <h3 style={{
                    fontSize: "1.15rem",
                    fontWeight: "700",
                    color: "#10b981",
                    margin: "0 0 20px 0",
                    textAlign: "center"
                  }}>
                    🎫 Individual Passengers
                  </h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "16px"
                  }}>
                    {[
                      { step: "1", title: "Choose Pass", desc: "Select day, weekly, or monthly pass" },
                      { step: "2", title: "Upload Proof", desc: "Submit identity verification documents" },
                      { step: "3", title: "Review", desc: "Admin verifies documents within 24 hours" },
                      { step: "4", title: "Active", desc: "Pass activated and ready to use" }
                    ].map((item, idx) => (
                      <div key={idx} style={{
                        background: "#fff",
                        padding: "16px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "40px",
                          height: "40px",
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          color: "#fff",
                          fontSize: "1.1rem",
                          fontWeight: "700",
                          borderRadius: "50%",
                          flexShrink: 0
                        }}>
                          {item.step}
                        </div>
                        <div>
                          <div style={{
                            fontSize: "0.95rem",
                            fontWeight: "700",
                            color: "#0b1220",
                            margin: 0
                          }}>
                            {item.title}
                          </div>
                          <div style={{
                            color: "#6b7280",
                            margin: "4px 0 0 0",
                            fontSize: "0.85rem"
                          }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#fff",
              padding: "60px 40px",
              borderRadius: "20px",
              textAlign: "center",
              marginTop: "20px"
            }}>
              <h2 style={{
                fontSize: "2rem",
                fontWeight: "700",
                margin: "0 0 16px 0"
              }}>
                Ready to Get Started?
              </h2>
              <p style={{
                fontSize: "1.05rem",
                margin: "0 0 32px 0",
                opacity: 0.95
              }}>
                Join our streamlined bus pass system today
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => setPage("college")}
                  style={{
                    padding: "14px 30px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "10px",
                    background: "#fff",
                    color: "#3b82f6",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  College Login
                </button>
                <button
                  onClick={() => setPage("passenger")}
                  style={{
                    padding: "14px 30px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    border: "2px solid #fff",
                    borderRadius: "10px",
                    background: "transparent",
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  Passenger Login
                </button>
              </div>
            </div>
          </section>
        )}

        {page === "college" && <CollegeLogin onLoginSuccess={handleLoginSuccess} onBack={() => setPage("home")} />}
        {page === "passenger" && <PassengerLogin onLoginSuccess={handleLoginSuccess} onBack={() => setPage("home")} />}
        {page === "admin" && <AdminLogin onLoginSuccess={handleLoginSuccess} onBack={() => setPage("home")} />}
        {page === "college-dashboard" && <CollegeDashboard onLogout={handleLogout} />}
        {page === "admin-dashboard" && <AdminDashboard onLogout={handleLogout} />}
        {page === "passenger-dashboard" && <PassengerDashboard onLogout={handleLogout} />}
      </main>

      <footer className="site-footer">
        <div>© {new Date().getFullYear()} BMTC Smart Bus Pass</div>
        <div className="muted">Built for demo & college projects — change secrets before production.</div>
      </footer>

      
    </div>
  );
}
