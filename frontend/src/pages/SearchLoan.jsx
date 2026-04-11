import { useState } from "react";
import api from "../axiosConfig";
import { useNavigate } from "react-router-dom";
import "../styles/gl.css";

const statusBadge = (status) => {
  if (!status) return null;
  const map = {
    active: "gl-badge-active",
    closed: "gl-badge-closed",
    renewed: "gl-badge-renewed",
  };
  return <span className={`gl-badge ${map[status] || "gl-badge-active"}`}>{status}</span>;
};

function SearchLoan() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const token = sessionStorage.getItem("token");
      const res = await api.get(
        `http://localhost:5032/api/loans/search?query=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data);
    } catch {
      setResults([]);
    }
    setLoading(false);
    setSearched(true);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSearch(); };

  return (
    <div className="gl-page">
      <div className="gl-page-inner">

        <div className="gl-header">
          <div>
            <div className="gl-title">Search loan</div>
            <div className="gl-subtitle">Find by name, phone or loan number</div>
          </div>
        </div>

        {/* Search bar */}
        <div className="gl-search" style={{ marginBottom: 20 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 14, flexShrink: 0, color: "var(--txt3)" }}>
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Enter name, phone or loan no."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="gl-search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="gl-loading" style={{ minHeight: 160 }}>
            <span className="gl-spinner" />
            Searching…
          </div>
        )}

        {/* Results */}
        {!loading && searched && results.length === 0 && (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--txt3)",
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ margin: "0 auto 12px" }}>
              <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 21l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 14h8M14 10v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--txt2)" }}>No loans found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try a different name, phone or loan number</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="gl-gap-8">
            <div style={{ fontSize: 12, color: "var(--txt2)", marginBottom: 4 }}>
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </div>

            {results.map(loan => (
              <div
                key={loan.id}
                className="gl-card"
                style={{
                  cursor: "pointer",
                  transition: "box-shadow .15s, transform .1s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "16px 20px",
                }}
                onClick={() => navigate(`/loan/${loan.id}`)}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "center", flex: 1, minWidth: 0 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "var(--navy)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 500, color: "#fff",
                    flexShrink: 0,
                  }}>
                    {loan.customer_name?.slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--txt1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {loan.customer_name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--txt2)", marginTop: 1 }}>
                      {loan.loan_number}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--txt1)", fontVariantNumeric: "tabular-nums" }}>
                    ₹{Number(loan.loan_amount).toLocaleString("en-IN")}
                  </div>
                  {statusBadge(loan.status)}
                </div>

                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--txt3)", flexShrink: 0 }}>
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default SearchLoan;
