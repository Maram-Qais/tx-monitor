import { NavLink, Outlet } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import RouteErrorBoundary from "../errors/RouteErrorBoundary";


type LinkItem = { to: string; label: string; icon: React.ReactNode };

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links: LinkItem[] = useMemo(
    () => [
      { to: "/monitor", label: "Monitor", icon: <Activity size={18} className="text-current" /> },
      { to: "/analytics", label: "Analytics", icon: <BarChart3 size={18} className="text-current" /> },
    ],
    []
  );

  const isLight = theme === "light";
  const page = isLight ? "bg-white text-slate-900" : "bg-slate-950 text-slate-100";
  const sidebar = isLight ? "bg-slate-100 border-slate-200" : "bg-slate-900 border-slate-800";
  const hover = "hover:bg-black/5 dark:hover:bg-white/10";
  const active = "bg-black/10 dark:bg-white/10";
  const icon = isLight ? "text-slate-900" : "text-slate-100";
  const sub = isLight ? "text-slate-600" : "text-slate-400";

  const linkClass = (isActive: boolean) =>
    [
      "flex items-center gap-2 px-4 py-2 rounded-lg",
      "text-slate-800 dark:text-slate-200",
      hover,
      isActive ? active : "",
      collapsed ? "justify-center" : "",
    ].join(" ");

  return (
    <div className={`flex min-h-screen ${page}`}>
      <aside
        className={`hidden md:flex flex-col p-2 border-r ${sidebar} ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="relative flex flex-col items-center mb-4 px-2 pt-2">
          <div className="h-12 w-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center">
            <Activity size={22} className={icon} />
          </div>

          {!collapsed && (
            <>
              <span className="font-bold text-lg mt-2 text-center">Transaction Monitor</span>
              <span className={`text-xs ${sub}`}>Real-time dashboard</span>
            </>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={`absolute top-2 right-2 p-1 rounded ${hover}`}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight size={14} className={icon} />
            ) : (
              <ChevronLeft size={14} className={icon} />
            )}
          </button>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => linkClass(isActive)}
            >
              {l.icon}
              {!collapsed && <span>{l.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <aside className={`w-64 p-4 border-r ${sidebar}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold">Tx Monitor</div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className={`p-2 rounded ${hover}`}
                aria-label="Close menu"
              >
                <X size={18} className={icon} />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-2 px-4 py-2 rounded-lg",
                      "text-slate-800 dark:text-slate-200",
                      hover,
                      isActive ? active : "",
                    ].join(" ")
                  }
                >
                  {l.icon}
                  <span>{l.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={`md:hidden p-2 rounded ${hover}`}
              aria-label="Open menu"
            >
              <Menu size={22} className={icon} />
            </button>

            <div>
              <h1 className="text-xl font-bold">Dashboard</h1>
              <p className={`text-sm ${sub}`}>Transaction Monitor • v1</p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-full ${hover}`}
            aria-label="Toggle theme"
          >
            {isLight ? <Moon size={20} className={icon} /> : <Sun size={20} className={icon} />}
          </button>
        </div>
          <RouteErrorBoundary>
              <Outlet />
          </RouteErrorBoundary>
      </div>
    </div>
  );
}
