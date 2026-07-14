import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Activity, CalendarDays, Flame, Trophy } from "lucide-react";
import {
  buildProgressDashboard,
  type DashboardPeriod,
  type ProgressDashboardModel
} from "../domain/dashboard";
import { areaLabel } from "../domain/labels";
import type { AppState } from "../domain/model";

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: "7d", label: "7 dni" },
  { key: "30d", label: "30 dni" },
  { key: "90d", label: "3 miesiące" },
  { key: "365d", label: "Rok" }
];

export function ProgressDashboard(props: { state: AppState; today: string }) {
  const [period, setPeriod] = useState<DashboardPeriod>("7d");
  const model = useMemo(
    () => buildProgressDashboard(props.state, props.today, period),
    [period, props.state, props.today]
  );
  const hasHistory = model.summary.activeDays > 0;

  return (
    <section className="screen">
      <div className="screen-header dashboard-header">
        <div>
          <p className="eyebrow">Postępy</p>
          <h2>Dashboard postępów</h2>
          <p className="muted">{model.range.start} - {model.range.end}</p>
        </div>
        <div className="dashboard-periods" aria-label="Zakres dashboardu">
          {PERIODS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={period === option.key ? "period-tab active" : "period-tab"}
              onClick={() => setPeriod(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-summary">
        <Metric
          icon={<Activity size={20} />}
          label="Wykonanie planu"
          value={model.summary.planCompletionPercent === null ? "Brak danych" : `${model.summary.planCompletionPercent}%`}
        />
        <Metric icon={<CalendarDays size={20} />} label="Aktywne dni" value={`${model.summary.activeDays}`} />
        <Metric icon={<Trophy size={20} />} label="Zdobyte XP" value={`${model.summary.totalXp}`} />
        <Metric icon={<Flame size={20} />} label="Aktualna seria" value={`${model.summary.currentStreak} dni`} />
      </div>

      {!hasHistory ? (
        <section className="panel dashboard-empty">
          <h3>Za mało danych</h3>
          <p>Brak danych o ukończonych zadaniach lub check-inach w tym okresie.</p>
        </section>
      ) : (
        <>
          <TrendChart points={model.trend} granularity={model.trendGranularity} />
          <AreaBalance rows={model.areas} />
          <section className="panel manual-summary">
            <h3>Aktywność ręczna</h3>
            <p>{model.manual.completed} wykonanych zadań, {model.manual.totalXp} XP.</p>
          </section>
          {model.goals.length > 0 ? <GoalProgress rows={model.goals} /> : null}
          <Insights insights={model.insights} recommendation={model.recommendation} />
        </>
      )}
    </section>
  );
}

function GoalProgress(props: { rows: ProgressDashboardModel["goals"] }) {
  return (
    <section className="panel">
      <h3>Postęp celów</h3>
      <div className="dashboard-area-list">
        {props.rows.map((row) => (
          <div className="dashboard-area-row goal-progress-row" key={row.goalId}>
            <strong>{row.title}</strong>
            <div className="stat-bar"><span style={{ width: `${row.planned > 0 ? Math.min(100, Math.round((row.completed / row.planned) * 100)) : 0}%` }} /></div>
            <span>{row.completed}/{row.planned} kroków</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric(props: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="panel dashboard-metric">
      <span>{props.icon} {props.label}</span>
      <strong>{props.value}</strong>
    </article>
  );
}

function TrendChart(props: {
  points: ProgressDashboardModel["trend"];
  granularity: ProgressDashboardModel["trendGranularity"];
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>Trend wykonania</h3>
        <span>{props.granularity === "day" ? "Dziennie" : "Tygodniowo"}</span>
      </div>
      <div
        className="dashboard-trend"
        role="img"
        aria-label="Procent wykonania planu w kolejnych okresach"
        style={{ "--trend-count": Math.max(1, props.points.length) } as CSSProperties}
      >
        {props.points.map((point) => (
          <div className="dashboard-trend-column" key={point.localDate}>
            <span className="dashboard-trend-value">{point.percent ?? "-"}%</span>
            <div className="dashboard-trend-track">
              <div
                className="dashboard-trend-bar"
                style={{ height: `${Math.max(2, point.percent ?? 0)}%` }}
                title={`${point.localDate}: ${point.percent ?? "brak danych"}%`}
              />
            </div>
            <small>{formatDateLabel(point.localDate)}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function AreaBalance(props: { rows: ProgressDashboardModel["areas"] }) {
  return (
    <section className="panel">
      <h3>Bilans obszarów</h3>
      <div className="dashboard-area-list">
        {props.rows.map((row) => (
          <div className="dashboard-area-row" key={row.stat}>
            <strong>{areaLabel(row.stat)}</strong>
            <div className="stat-bar">
              <span style={{ width: `${row.completionPercent ?? 0}%` }} />
            </div>
            <span>
              {row.completed}/{row.planned}
              {row.completionPercent === null ? " · brak danych" : ` · ${row.completionPercent}%`}
              {row.completed > 0 ? ` · udział ${row.completionSharePercent}%` : ""}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Insights(props: {
  insights: ProgressDashboardModel["insights"];
  recommendation: ProgressDashboardModel["recommendation"];
}) {
  return (
    <section className="panel">
      <h3>Wnioski</h3>
      <div className="insight-list">
        {props.insights.map((insight) => (
          <article className="insight-row" key={insight.id}>
            <div>
              <strong>{insight.title}</strong>
              <p>{insight.body}</p>
            </div>
          </article>
        ))}
        {props.recommendation ? (
          <article className="insight-row recommendation-row">
            <div>
              <strong>{props.recommendation.title}</strong>
              <p>{props.recommendation.body}</p>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function formatDateLabel(localDate: string): string {
  return localDate.slice(5);
}
