import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LayoutGrid,
  Copy,
  Eye,
  AlertTriangle,
  Heart,
  Palette as PaletteIcon,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Users,
  PenTool,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "./Toast.jsx";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/stock", label: "Mon stock", icon: LayoutGrid },
  { to: "/doublons", label: "Doublons", icon: Copy },
  { to: "/comparer", label: "À comparer", icon: Eye },
  { to: "/panne", label: "En panne", icon: AlertTriangle },
  { to: "/envies", label: "Envies d'achat", icon: Heart },
  { to: "/palette", label: "Palette", icon: PaletteIcon },
  { to: "/catalogue", label: "Catalogue", icon: BookOpen },
  { to: "/propositions", label: "Mes propositions", icon: ClipboardList },
];

const ADMIN_NAV = [
  { to: "/admin/propositions", label: "Validation", icon: ShieldCheck },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function handleLogout() {
    await logout();
    toast.info("À bientôt !");
    navigate("/connexion");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <PenTool size={20} />
          <span className="display">Chromely</span>
        </div>
        <nav className="nav-list">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                "nav-item" + (isActive ? " nav-item-active" : "")
              }
            >
              <n.icon size={16} />
              <span>{n.label}</span>
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <>
              <div className="nav-section-label">Administration</div>
              {ADMIN_NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    "nav-item" + (isActive ? " nav-item-active" : "")
                  }
                >
                  <n.icon size={16} />
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">
              {(user?.pseudo || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-pseudo">{user?.pseudo}</div>
              <div className="user-role">
                {user?.role === "admin" ? "Administrateur" : "Membre"}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={handleLogout}
            title="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
