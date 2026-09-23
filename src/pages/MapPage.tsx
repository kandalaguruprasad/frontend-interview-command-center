import { QUEST_LEVELS } from '../data';
import { WorldBoard } from '../components/WorldBoard';
import { useStore } from '../state/store';

export function MapPage() {
  const { state } = useStore();
  const zonesCleared = QUEST_LEVELS.filter((l) => state.quest.bossPassed[l.id]).length;

  return (
    <div className="saas-page">
      <header className="saas-page-head">
        <div>
          <h1 className="saas-title">Map</h1>
          <p className="saas-desc">
            {zonesCleared} of 10 zones cleared. Tap an open zone to focus.
          </p>
        </div>
      </header>
      <section className="saas-block">
        <WorldBoard />
      </section>
    </div>
  );
}
