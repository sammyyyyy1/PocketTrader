import Layout from "../components/Layout";
import { useState } from "react";
import { setStoredUser } from "../utils/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("Logging in...");
    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setStoredUser(data.user);
        setMsg("Login successful");
        window.location.href = "/";
      } else {
        setMsg(data.message || "Login failed");
      }
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Sign In</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Username</label>
          <input
            className="w-full border p-2 mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label className="block mb-2">Password</label>
          <input
            type="password"
            className="w-full border p-2 mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-green-500 text-white py-2 px-4 rounded">
            Sign In
          </button>
        </form>
        <p className="mt-4 text-sm">
          Need an account?{" "}
          <a href="/signup" className="text-blue-600">
            Create one
          </a>
          .
        </p>
        {msg && <div className="mt-4 text-sm">{msg}</div>}
      </div>
    </Layout>
  );
}
