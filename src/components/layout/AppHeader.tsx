import { Activity, LayoutDashboard, Moon, Sun, TableProperties, TrendingUp } from "lucide-react";

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
  return (
    <header className="app-header">
      <div className="header-main">
        <a href="#overview" className="brand-lockup" onClick={() => onViewChange("overview")} aria-label="HealthTrack home">
          <span className="brand-mark"><Activity size={19} strokeWidth={2.2} /></span>
          <span>
            <span className="brand-name">HealthTrack</span>
            <span className="brand-caption">PERSONAL BLOOD REPORT ANALYTICS</span>
          </span>
        </a>

        <div className="header-tools">
          <div className="profile-summary" aria-label="Profile summary">
            <span className="profile-item">Male <i /> 37 years 5 months</span>
            <span className="profile-item">184 cm <i /> 95 kg</span>
          </div>
          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
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
              <Icon size={16} strokeWidth={1.9} />
              {label}
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
