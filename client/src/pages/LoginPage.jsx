import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PenTool } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <PenTool size={22} />
          <span className="display">Chromely</span>
        </div>
        <h2>Connexion</h2>
        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </label>
        <label className="field">
          <span className="field-label">Mot de passe</span>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p className="auth-switch">
          Pas encore de compte ? <Link to="/inscription">Crée-en un</Link>
        </p>
      </form>
    </div>
  );
}
