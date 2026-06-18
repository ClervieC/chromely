import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { Spinner, Tag } from "../components/ui.jsx";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState(null);

  async function load() {
    const data = await api.getUsers();
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggleRole(u) {
    const newRole = u.role === "admin" ? "user" : "admin";
    try {
      await api.setUserRole(u.id, newRole);
      toast.success(
        `${u.pseudo} est maintenant ${newRole === "admin" ? "administrateur" : "membre"}`,
      );
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (users === null)
    return (
      <div className="full-page-loader">
        <Spinner />
      </div>
    );

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="display">Utilisateurs</h2>
        <p className="view-sub">
          Gère qui a accès à l'application et qui peut administrer la palette/le
          catalogue.
        </p>
      </div>
      <div className="panel">
        <div className="user-list">
          {users.map((u) => (
            <div className="user-row" key={u.id}>
              <div className="user-avatar">
                {u.pseudo.slice(0, 1).toUpperCase()}
              </div>
              <div className="user-info" style={{ flex: 1 }}>
                <div className="user-pseudo">{u.pseudo}</div>
                <div className="user-role">{u.email}</div>
              </div>
              <Tag color={u.role === "admin" ? "#154B4A" : "#4B5A60"}>
                {u.role === "admin" ? "Administrateur" : "Membre"}
              </Tag>
              {u.id !== currentUser.id && (
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => handleToggleRole(u)}
                >
                  {u.role === "admin" ? "Retirer admin" : "Passer admin"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
