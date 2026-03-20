import { useState, useEffect } from "react";
import api from "../axiosConfig";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // ✅ Redirect if already logged in
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");

    if (token && role) {
      navigate(`/${role}`, { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await api.post(
        "http://localhost:5032/api/auth/login",
        { email, password }
      );

      const token = res.data.token;

      // ✅ Save token
      sessionStorage.setItem("token", token);

      // ✅ Decode token
      const payload = JSON.parse(atob(token.split(".")[1]));

      // ✅ SAVE ROLE HERE (IMPORTANT)
      sessionStorage.setItem("role", payload.role);

      // ✅ Navigate safely
      navigate(`/${payload.role}`, { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password"
      );
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm rounded-xl p-8 w-80">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Gold Loan System
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-2 mb-4 rounded text-sm">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}

export default Login;
