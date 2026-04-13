import { useState, useEffect } from "react";
import api from "../axiosConfig";
import { useNavigate, useParams } from "react-router-dom";

export default function Login() {
  const { role } = useParams();
  const isOwner = role === "owner";

  const [username, setUsername] = useState("");
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const r = sessionStorage.getItem("role");
    if (token && r) navigate(`/${r}`, { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!isOwner) {
      api.get("/api/branches")
        .then(res => setBranches(res.data))
        .catch(() => setBranches([]));
    }
  }, [isOwner]);

  const canSubmit = isOwner
    ? Boolean(username && password)
    : Boolean(username && password && branch);

  const handleLogin = async () => {
    if (!canSubmit) {
      setError(isOwner ? "Enter username and password." : "Please fill all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const body = isOwner
        ? { name: username, password }
        : { name: username, password, branch_id: branch };

      const res = await api.post("/api/auth/login", body);

      const token = res.data.token;
      sessionStorage.setItem("token", token);

      const callingName =
        res.data?.calling_name ||
        res.data?.staff_name ||
        res.data?.name ||
        username ||
        "User";

      sessionStorage.setItem("calling_name", callingName);

      const payload = JSON.parse(atob(token.split(".")[1]));
      sessionStorage.setItem("role", payload.role);
      sessionStorage.setItem("name", username);

      if (!isOwner) {
        const branchName = branches.find(b => b.id === Number(branch))?.name;
        if (branchName) sessionStorage.setItem("branch", branchName);
      }

      navigate(`/${payload.role}`, { replace: true });

    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password.");
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{`
      * { box-sizing: border-box; }

      .lr {
        min-height: 100vh;
        display: flex;
        font-family: 'DM Sans', sans-serif;
      }

      .lr-left {
        width: 420px;
        background: #1A1A1A;
        color: white;
        padding: 40px;
        display: flex;
        flex-direction: column;
      }

      .lr-brand {
        font-size: 22px;
        font-weight: bold;
        margin-bottom: 30px;
      }

      .lr-right {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        background: #fff;
      }

      .lr-form-box {
        width: 100%;
        max-width: 400px;
      }

      .lr-field {
        margin-bottom: 18px;
      }

      .lr-input-wrap {
        display: flex;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
      }

      .lr-input {
        flex: 1;
        padding: 12px;
        border: none;
        outline: none;
      }

      .lr-select {
        flex: 1;
        padding: 12px;
        border: none;
        outline: none;
      }

      .lr-pwd-toggle {
        width: 45px;
        border: none;
        background: transparent;
        cursor: pointer;
      }

      .lr-btn {
        width: 100%;
        padding: 14px;
        background: #8B0000;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }

      .lr-btn:disabled {
        opacity: 0.6;
      }

      .lr-error {
        background: #ffecec;
        color: #b00020;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 15px;
      }

      /* 🔥 RESPONSIVE */
      @media (max-width: 700px) {
        .lr {
          flex-direction: column;
        }

        .lr-left {
          width: 100%;
          padding: 20px;
        }

        .lr-right {
          padding: 20px;
        }
      }
      `}</style>

      <div className="lr">

        {/* LEFT */}
        <div className="lr-left">
          <div className="lr-brand">GoldLoan ({isOwner ? "Owner" : "Staff"})</div>
          <p>
            {isOwner
              ? "Monitor all branches and manage system."
              : "Manage loans, gold and branch data easily."}
          </p>
        </div>

        {/* RIGHT */}
        <div className="lr-right">
          <div className="lr-form-box">

            <h2>Welcome Back</h2>

            {error && <div className="lr-error">{error}</div>}

            {!isOwner && (
              <div className="lr-field">
                <label>Branch</label>
                <div className="lr-input-wrap">
                  <select
                    className="lr-select"
                    value={branch}
                    onChange={e => setBranch(Number(e.target.value))}
                  >
                    <option value="">
                      {branches.length === 0 ? "Loading..." : "Select branch"}
                    </option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="lr-field">
              <label>Username</label>
              <div className="lr-input-wrap">
                <input
                  className="lr-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={handleKey}
                />
              </div>
            </div>

            <div className="lr-field">
              <label>Password</label>
              <div className="lr-input-wrap">
                <input
                  type={showPwd ? "text" : "password"}
                  className="lr-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button
                  className="lr-pwd-toggle"
                  onClick={() => setShowPwd(p => !p)}
                >
                  👁
                </button>
              </div>
            </div>

            <button
              className="lr-btn"
              onClick={handleLogin}
              disabled={loading || !canSubmit}
            >
              {loading ? "Signing in..." : `Sign in as ${isOwner ? "Owner" : "Staff"}`}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}