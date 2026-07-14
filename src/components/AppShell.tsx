import { BarChart3, Beaker, Database, ListChecks, Repeat2, Shield, SlidersHorizontal, Sparkles, Target } from "lucide-react";
import type { ReactNode } from "react";
import type { ViewKey } from "../App";
import { APP_VERSION } from "../version";

type NavItem = {
  key: ViewKey;
  label: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { key: "today", label: "Dzisiejsze zadania", icon: <ListChecks size={18} /> },
  { key: "goals", label: "Cele", icon: <Target size={18} /> },
  { key: "experiment", label: "Eksperyment", icon: <Beaker size={18} /> },
  { key: "habits", label: "Habity", icon: <Repeat2 size={18} /> },
  { key: "quests", label: "Własne zadania", icon: <Sparkles size={18} /> },
  { key: "character", label: "Profil", icon: <Shield size={18} /> },
  { key: "review", label: "Postępy", icon: <BarChart3 size={18} /> },
  { key: "settings", label: "Ustawienia", icon: <SlidersHorizontal size={18} /> },
  { key: "data", label: "Dane", icon: <Database size={18} /> }
];

export function AppShell(props: {
  currentView: ViewKey;
  onViewChange: (view: ViewKey) => void;
  children: ReactNode;
  storageAlert?: string;
  onOpenData?: () => void;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">LQ</div>
          <div>
            <h1>LifeQuest</h1>
            <p>Arkusz Rozwoju Osobistego</p>
          </div>
        </div>
        <nav className="nav" aria-label="Główna nawigacja">
          {NAV_ITEMS.map((item) => (
            <button
              className={item.key === props.currentView ? "nav-button active" : "nav-button"}
              key={item.key}
              onClick={() => props.onViewChange(item.key)}
              type="button"
              aria-label={item.label}
              aria-current={item.key === props.currentView ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">LifeQuest v{APP_VERSION}</div>
      </aside>
      <main className="main">
        {props.storageAlert ? (
          <div className="storage-alert" role="alert">
            <span>{props.storageAlert}</span>
            <button type="button" onClick={props.onOpenData}>Przejdź do danych</button>
          </div>
        ) : null}
        {props.children}
      </main>
    </div>
  );
}
