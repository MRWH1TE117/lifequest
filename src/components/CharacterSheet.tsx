import { Flame, Shield, Star } from "lucide-react";
import type { DailyCheckIn, Profile } from "../domain/model";
import type { LifeStatScores } from "../domain/stats";
import { areaLabel } from "../domain/labels";

function calculateStreak(checkIns: DailyCheckIn[]): number {
  const dates = new Set(checkIns.map((item) => item.localDate));
  let streak = 0;
  const cursor = new Date();
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function CharacterSheet(props: {
  profile: Profile;
  level: number;
  stats: LifeStatScores;
  checkIns: DailyCheckIn[];
}) {
  const statValues = Object.entries(props.stats);
  const maxStat = Math.max(100, ...statValues.map(([, value]) => value));
  const streak = calculateStreak(props.checkIns);

  return (
    <section className="screen">
      <div className="screen-header">
        <div>
          <p className="eyebrow">Profil</p>
          <h2>{props.profile.name}</h2>
        </div>
      </div>

      <div className="hero-panel">
        <div className="avatar-frame">
          <Shield size={52} />
        </div>
        <div className="hero-stats">
          <div>
            <span>Poziom</span>
            <strong>{props.level}</strong>
          </div>
          <div>
            <span>XP razem</span>
            <strong>{props.profile.totalXp}</strong>
          </div>
          <div>
            <span>Seria check-in</span>
            <strong>{streak}</strong>
          </div>
        </div>
      </div>

      <div className="grid">
        {statValues.map(([stat, value]) => (
          <article className="panel stat-panel" key={stat}>
            <div className="stat-title">
              <span>{areaLabel(stat)}</span>
              <strong>{value}</strong>
            </div>
            <div className="stat-bar" aria-label={`${areaLabel(stat)} ${value} punktów`}>
              <span style={{ width: `${Math.min(100, Math.round((value / maxStat) * 100))}%` }} />
            </div>
          </article>
        ))}
      </div>

      <section className="panel insight-row">
        <Star size={20} />
        <p>Statystyki rosną przez wykonane zadania. Przypisuj zadania do obszaru, który realnie rozwijają.</p>
        <Flame size={20} />
      </section>
    </section>
  );
}
