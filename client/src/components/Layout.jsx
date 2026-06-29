import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  LayoutGrid,
  Copy,
  AlertTriangle,
  Heart,
  Palette as PaletteIcon,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Users,
  PenTool,
  LogOut,
  Layers,
  Moon,
  Sun,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "./Toast.jsx";
import { QuickSearch, useQuickSearch } from "./QuickSearch.jsx";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);
  return [dark, setDark];
}

const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/stock", label: "Mon stock", icon: LayoutGrid },
  { to: "/packs", label: "Mes packs", icon: Layers },
  { to: "/doublons", label: "Doublons", icon: Copy },
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
  const [dark, setDark] = useDarkMode();
  const [qsOpen, setQsOpen] = useQuickSearch();
  const [moreOpen, setMoreOpen] = useState(false);

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
            onClick={() => setDark((d) => !d)}
            title={dark ? "Mode clair" : "Mode sombre"}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
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

      {qsOpen && <QuickSearch onClose={() => setQsOpen(false)} />}

      {/* ── Bottom nav mobile ── */}
      <nav className="mobile-bottom-nav">
        {NAV.slice(0, 4).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              "mobile-nav-item" + (isActive ? " mobile-nav-item-active" : "")
            }
            onClick={() => setMoreOpen(false)}
          >
            <n.icon size={20} />
            <span>{n.label}</span>
          </NavLink>
        ))}
        <button
          className={"mobile-nav-item mobile-nav-btn" + (moreOpen ? " mobile-nav-item-active" : "")}
          onClick={() => setMoreOpen((v) => !v)}
        >
          {moreOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
          <span>Plus</span>
        </button>
      </nav>

      {/* ── Drawer "Plus" mobile ── */}
      {moreOpen && (
        <div className="mobile-more-overlay" onClick={() => setMoreOpen(false)}>
          <div className="mobile-more-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-more-grid">
              {NAV.slice(4).map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    "mobile-more-item" + (isActive ? " mobile-nav-item-active" : "")
                  }
                  onClick={() => setMoreOpen(false)}
                >
                  <n.icon size={22} />
                  <span>{n.label}</span>
                </NavLink>
              ))}
              {user?.role === "admin" && ADMIN_NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    "mobile-more-item" + (isActive ? " mobile-nav-item-active" : "")
                  }
                  onClick={() => setMoreOpen(false)}
                >
                  <n.icon size={22} />
                  <span>{n.label}</span>
                </NavLink>
              ))}
              <button
                className="mobile-more-item"
                onClick={() => { setDark((d) => !d); setMoreOpen(false); }}
              >
                {dark ? <Sun size={22} /> : <Moon size={22} />}
                <span>{dark ? "Mode clair" : "Mode sombre"}</span>
              </button>
              <button
                className="mobile-more-item mobile-more-item-danger"
                onClick={handleLogout}
              >
                <LogOut size={22} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
