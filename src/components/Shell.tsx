import { type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { playerRank } from '../quest/engine';
import { useStore } from '../state/store';
import { LevelUpOverlay } from './LevelUpOverlay';
import { XpPopups } from './XpPopups';

export function Shell({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const rank = playerRank(state.quest.xp || 0);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Frontend Quest
        </Link>

        <nav className="pill-nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'pill-nav-link active' : 'pill-nav-link')}>
            Overview
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => (isActive ? 'pill-nav-link active' : 'pill-nav-link')}>
            Map
          </NavLink>
        </nav>

        <div className="topbar-meta">
          <span className="topbar-chip hide-sm">{rank.title}</span>
          <span className="icon-btn" title="XP" aria-label={`${state.quest.xp || 0} XP`}>
            {state.quest.xp || 0}
          </span>
          <span className="avatar-chip" title="Streak">
            {state.meta.streak || 0}d
          </span>
        </div>
      </header>
      <main className="main main-wide">{children}</main>
      <XpPopups />
      <LevelUpOverlay />
    </div>
  );
}
