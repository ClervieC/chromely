import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PenTool } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, pseudo);
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
        <h2>Créer un compte</h2>
        <p className="form-hint-positive">
          Le premier compte créé sur cette installation devient automatiquement
          administrateur.
        </p>
        <label className="field">
          <span className="field-label">Pseudo</span>
          <input
            className="input"
            required
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            autoFocus
          />
        </label>
        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Mot de passe</span>
          <input
            className="input"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="field-hint">8 caractères minimum</span>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer mon compte"}
        </button>
        <p className="auth-switch">
          Déjà un compte ? <Link to="/connexion">Connecte-toi</Link>
        </p>
      </form>
    </div>
  );
}
