import Layout from "../components/Layout";
import { useState } from "react";
import { setStoredUser } from "../utils/auth";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("Creating your account...");
    try {
      const res = await fetch("http://localhost:5001/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setStoredUser(data.user);
        setMsg("Account created!");
        window.location.href = "/";
      } else {
        setMsg(data.message || "Failed to create account");
      }
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Create an Account</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Username</label>
          <input
            className="w-full border p-2 mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. ash_ketchum"
          />
          <label className="block mb-2">Password</label>
          <input
            type="password"
            className="w-full border p-2 mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <button className="bg-blue-600 text-white py-2 px-4 rounded w-full">
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600">
            Sign in
          </a>
          .
        </p>
        {msg && <div className="mt-4 text-sm">{msg}</div>}
      </div>
    </Layout>
  );
}
