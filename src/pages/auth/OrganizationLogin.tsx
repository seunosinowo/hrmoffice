import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import bcrypt from "bcryptjs";

export default function OrganizationLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("email", normalizedEmail)
        .single();
      if (orgError || !org) {
        setError("Organization not found.");
        setLoading(false);
        return;
      }
      if (!bcrypt.compareSync(password, org.password_hash)) {
        setError("Invalid password.");
        setLoading(false);
        return;
      }
      localStorage.setItem("orgEmail", normalizedEmail);
      navigate("/organization/dashboard");
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Organization Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-900 dark:text-white">Email</label>
        <input
          type="email"
          className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-900 dark:text-white">Password</label>
        <input
          type="password"
          className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
} 