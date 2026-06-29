import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface AdminLoginFormProps {
  title?: string;
  description?: string;
  currentEmail?: string;
}

export default function AdminLoginForm({
  title = "Admin CMS",
  description = "Sign in with an admin account.",
  currentEmail,
}: AdminLoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@voya.ai");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const err = await login(normalizedEmail, password);

    if (err) {
      setError(err === "Invalid credentials" ? "ელფოსტა ან პაროლი არასწორია" : err);
      setSubmitting(false);
      return;
    }

    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-6">{description}</p>

        {currentEmail && currentEmail !== "admin@voya.ai" && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
            ახლა შესული ხარ: <strong>{currentEmail}</strong>
            <br />
            Admin: <strong>admin@voya.ai</strong> / <strong>Admin1234</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            autoComplete="username"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="admin@voya.ai"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Admin1234"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-xs text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In as Admin"}
          </button>
        </form>

        <p className="text-[11px] text-gray-400 mt-4 text-center">
          admin@voya.ai · Admin1234 (A დიდი, 1234)
        </p>
      </div>
    </div>
  );
}
