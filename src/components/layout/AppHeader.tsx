import { Activity, LayoutDashboard, Moon, Ruler, Scale, Sun, TableProperties, TrendingUp, UserRound } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type DashboardView = "overview" | "trends" | "results";

interface AppHeaderProps {
  view: DashboardView;
  onViewChange: (view: DashboardView) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const navItems: { id: DashboardView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "results", label: "Results", icon: TableProperties },
];

export function AppHeader({ view, onViewChange, isDark, onToggleTheme }: AppHeaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <header className="app-header">
      <div className="header-main">
        <a href="#overview" className="brand-lockup" onClick={() => onViewChange("overview")} aria-label="HealthTrack home">
          <motion.span
            className="brand-mark"
            whileHover={reduceMotion ? undefined : { rotate: -5, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
          ><Activity size={19} strokeWidth={2.2} /></motion.span>
          <span>
            <span className="brand-name">HealthTrack</span>
            <span className="brand-caption">PERSONAL BLOOD REPORT ANALYTICS</span>
          </span>
        </a>

        <div className="header-tools">
          <div className="profile-summary" aria-label="Profile summary">
            <span className="profile-item"><UserRound size={14} /> <span>Male · 37 years 5 months</span></span>
            <span className="profile-item"><Ruler size={14} /> <span>184 cm</span></span>
            <span className="profile-item"><Scale size={14} /> <span>95 kg</span></span>
          </div>
          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDark ? "light" : "dark"}
                initial={reduceMotion ? false : { opacity: 0, rotate: -35, scale: 0.82 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, rotate: 35, scale: 0.82 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                className="theme-glyph"
              >{isDark ? <Sun size={17} /> : <Moon size={17} />}</motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <div className="header-bottom">
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${view === id ? "nav-item-active" : ""}`}
              onClick={() => onViewChange(id)}
              aria-current={view === id ? "page" : undefined}
            >
              {view === id && (
                <motion.span
                  layoutId="healthtrack-nav-indicator"
                  className="nav-active-surface"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <Icon size={16} strokeWidth={1.9} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="latest-report-indicator">
          <span className="live-dot" aria-hidden="true" />
          Latest report <strong>9 Oct 2026</strong>
        </div>
      </div>
    </header>
  );
}
