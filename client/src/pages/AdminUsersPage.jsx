import { useEffect, useState } from "react";
import { Users, ShieldCheck, User } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { Spinner } from "../components/ui.jsx";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState(null);

  async function load() {
    const data = await api.getUsers();
    setUsers(data.users);
  }

  useEffect(() => { load(); }, []);

  async function handleToggleRole(u) {
    const newRole = u.role === "admin" ? "user" : "admin";
    try {
      await api.setUserRole(u.id, newRole);
      toast.success(`${u.pseudo} est maintenant ${newRole === "admin" ? "administrateur" : "membre"}`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (users === null)
    return <div className="full-page-loader"><Spinner /></div>;

  const admins = users.filter((u) => u.role === "admin");
  const members = users.filter((u) => u.role !== "admin");

  return (
    <div className="view">
      <div className="page-header" style={{ "--page-color": "#154B4A" }}>
        <div className="page-header-inner">
          <div className="page-header-text">
            <h1 className="display page-header-title">Utilisateurs</h1>
            <p className="page-header-sub">
              Gère les accès et les rôles des membres de la communauté.
            </p>
          </div>
          <span className="page-header-count">{users.length}</span>
        </div>
      </div>

      {admins.length > 0 && (
        <div className="dash-panel">
          <h3 className="dash-panel-title" style={{ color: "#154B4A" }}>Administrateurs</h3>
          <div className="user-list">
            {admins.map((u) => (
              <UserRow
                key={u.id}
                u={u}
                isSelf={u.id === currentUser.id}
                onToggle={() => handleToggleRole(u)}
              />
            ))}
          </div>
        </div>
      )}

      {members.length > 0 && (
        <div className="dash-panel">
          <h3 className="dash-panel-title">Membres</h3>
          <div className="user-list">
            {members.map((u) => (
              <UserRow
                key={u.id}
                u={u}
                isSelf={u.id === currentUser.id}
                onToggle={() => handleToggleRole(u)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({ u, isSelf, onToggle }) {
  const isAdmin = u.role === "admin";
  const initials = u.pseudo.slice(0, 2).toUpperCase();
  const color = isAdmin ? "#154B4A" : "#4B5A60";
  return (
    <div className="user-row">
      <div className="user-avatar" style={{ background: color }}>
        {initials}
      </div>
      <div className="user-info">
        <div className="user-pseudo">
          {u.pseudo}
          {isSelf && <span className="user-self-badge">vous</span>}
        </div>
        <div className="user-email">{u.email}</div>
      </div>
      <div className="user-role-badge" style={{ color, background: `${color}18` }}>
        {isAdmin ? <ShieldCheck size={13} /> : <User size={13} />}
        {isAdmin ? "Admin" : "Membre"}
      </div>
      {!isSelf && (
        <button type="button" className="btn btn-ghost btn-small" onClick={onToggle}>
          {isAdmin ? "Retirer admin" : "Passer admin"}
        </button>
      )}
    </div>
  );
}
