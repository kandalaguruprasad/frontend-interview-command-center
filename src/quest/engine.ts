import {
  ACHIEVEMENTS,
  CODING_PROBLEMS,
  findCoding,
  findLab,
  findLevel,
  findTopic,
  PLAYER_RANKS,
  PROJECTS,
  QUEST_LEVELS,
} from '../data';
import { todayISO } from '../lib/dates';
import { ensureMission, getItem } from '../state/store';
import type {
  AppState,
  ContinueTarget,
  ItemStatus,
  LevelStatus,
  MissionItem,
  MissionStage,
  QuestLevel,
} from '../types';

type SetState = (updater: (s: AppState) => AppState) => void;
type PushXp = (amount: number, reason: string) => void;

export function awardXP(
  setState: SetState,
  pushXp: PushXp,
  amount: number,
  reason: string,
  key?: string,
) {
  if (!amount) return;
  setState((state) => {
    const q = state.quest;
    if (key && q.awardedKeys[key]) return state;
    const awardedKeys = key ? { ...q.awardedKeys, [key]: true } : q.awardedKeys;
    const xp = (q.xp || 0) + amount;
    const xpLog = [...(q.xpLog || []), { date: todayISO(), amount, reason }].slice(-300);
    const activityLog = [
      ...(q.activityLog || []),
      { action: key || reason, amount, at: new Date().toISOString() },
    ].slice(-500);
    const next: AppState = {
      ...state,
      quest: { ...q, xp, xpLog, activityLog, awardedKeys },
    };
    return checkAchievements(next);
  });
  pushXp(amount, reason);
}

function checkAchievements(state: AppState): AppState {
  const q = state.quest;
  const bossesPassed = Object.keys(q.bossPassed || {}).filter((k) => q.bossPassed[Number(k)]).length;
  const solvedNoHelp = CODING_PROBLEMS.filter(
    (c) => getItem(state, 'coding', c.id).codingProgress === 'solved_no_help',
  ).length;
  const checks: Record<string, boolean> = {
    first_blood: bossesPassed >= 1,
    no_notes_needed: (q.aloudTotalCount || 0) >= 10,
    clean_coder: solvedNoHelp >= 5,
    streak_keeper: (state.meta.streak || 0) >= 7,
    halfway_hero: !!q.bossPassed[6],
    daily_disciplined: false,
    quest_complete: !!q.bossPassed[10],
  };
  const have = new Set(q.achievements || []);
  const newly = ACHIEVEMENTS.filter((a) => checks[a.id] && !have.has(a.id)).map((a) => a.id);
  if (!newly.length) return state;
  return {
    ...state,
    quest: { ...q, achievements: [...(q.achievements || []), ...newly] },
  };
}

export function playerRank(xp: number) {
  let current: { min: number; title: string } = PLAYER_RANKS[0];
  let next: { min: number; title: string } | null = null;
  for (let i = 0; i < PLAYER_RANKS.length; i++) {
    if (xp >= PLAYER_RANKS[i].min) current = PLAYER_RANKS[i];
    else {
      next = PLAYER_RANKS[i];
      break;
    }
  }
  return { title: current.title, next };
}

export function missionStage(state: AppState, topicId: string): MissionStage {
  const m = state.quest.missions[`topic:${topicId}`];
  if (!m || !m.opened) return 'learn';
  if (!m.recallAttempted) return 'recall';
  if (!m.exerciseAttempted) return 'practise';
  if (!m.completedAt) return 'complete';
  return 'done';
}

export function isTopicMissionComplete(state: AppState, topicId: string) {
  return !!state.quest.missions[`topic:${topicId}`]?.completedAt;
}

export function isCodingMissionComplete(state: AppState, id: string) {
  const p = getItem(state, 'coding', id).codingProgress || 'not_viewed';
  return p === 'solved_no_help' || p === 'solved_with_hints';
}

export function isLabMissionComplete(state: AppState, id: string) {
  const s = getItem(state, 'lab', id).status;
  return s === 'confident' || s === 'mastered';
}

export function levelMissionList(level: QuestLevel): MissionItem[] {
  const list: MissionItem[] = [];
  (level.requiredTopics || []).forEach((id) => list.push({ type: 'topic', id }));
  (level.requiredCoding || []).forEach((id) => list.push({ type: 'coding', id }));
  (level.requiredLabs || []).forEach((id) => list.push({ type: 'lab', id }));
  return list;
}

export function isMissionItemComplete(state: AppState, item: MissionItem) {
  if (item.type === 'topic') return isTopicMissionComplete(state, item.id);
  if (item.type === 'coding') return isCodingMissionComplete(state, item.id);
  if (item.type === 'lab') return isLabMissionComplete(state, item.id);
  return false;
}

export function levelMissionProgress(state: AppState, level: QuestLevel) {
  const items = levelMissionList(level).map((m) => ({
    ...m,
    done: isMissionItemComplete(state, m),
  }));
  const done = items.filter((m) => m.done).length;
  return { items, done, total: items.length };
}

export function isLevelUnlocked(state: AppState, levelId: number) {
  if (levelId === 1) return true;
  return !!state.quest.bossPassed[levelId - 1];
}

export function computeReadinessScore(state: AppState) {
  let confident = 0;
  let total = 0;
  for (const level of QUEST_LEVELS) {
    for (const item of levelMissionList(level)) {
      total++;
      if (isMissionItemComplete(state, item)) confident++;
    }
  }
  const bosses = Object.values(state.quest.bossPassed || {}).filter(Boolean).length;
  const totalPct = total ? Math.round((confident / total) * 80 + (bosses / 10) * 20) : bosses * 10;
  return { total: totalPct, confident, missionTotal: total, bosses };
}

export function levelRequirementsMet(state: AppState, level: QuestLevel) {
  const prog = levelMissionProgress(state, level);
  const missionsOk = prog.total === 0 || prog.done === prog.total;
  const req = level.requirements || {};
  const readinessOk = !req.minReadiness || computeReadinessScore(state).total >= req.minReadiness;
  if (level.id === 9) {
    const allQs = PROJECTS.flatMap((p) => p.questions);
    const ok = allQs.every((q) => {
      const s = getItem(state, 'project', q.id).status;
      return s === 'confident' || s === 'mastered';
    });
    return ok;
  }
  return missionsOk && readinessOk;
}

export function levelAnyProgress(state: AppState, level: QuestLevel) {
  const prog = levelMissionProgress(state, level);
  if (prog.total > 0) {
    if (prog.done > 0) return true;
    return prog.items.some((item) => {
      if (item.type === 'topic') {
        const p = state.quest.missions[`topic:${item.id}`];
        return !!(p && (p.opened || p.recallAttempted || p.exerciseAttempted));
      }
      if (item.type === 'coding')
        return (getItem(state, 'coding', item.id).codingProgress || 'not_viewed') !== 'not_viewed';
      if (item.type === 'lab')
        return (getItem(state, 'lab', item.id).status || 'not_started') !== 'not_started';
      return false;
    });
  }
  if (level.id === 9) {
    return PROJECTS.some((p) =>
      p.questions.some((q) => getItem(state, 'project', q.id).status !== 'not_started'),
    );
  }
  if (level.id === 10) return (state.mockSessions || []).length > 0;
  return false;
}

export function bossAttemptedToday(state: AppState, levelId: number) {
  const attempts = state.quest.bossAttempts[levelId] || [];
  return attempts.some((a) => a.date === todayISO());
}

export function bestBossScore(state: AppState, levelId: number) {
  const attempts = state.quest.bossAttempts[levelId] || [];
  return attempts.reduce((m, a) => Math.max(m, a.score || 0), 0);
}

export function levelStatus(state: AppState, level: QuestLevel): LevelStatus {
  if (!isLevelUnlocked(state, level.id)) return 'locked';
  if (state.quest.bossPassed[level.id])
    return bestBossScore(state, level.id) >= 90 ? 'mastered' : 'completed';
  if (levelRequirementsMet(state, level)) return 'boss_available';
  return levelAnyProgress(state, level) ? 'in_progress' : 'available';
}

export function recordBossAttempt(
  setState: SetState,
  levelId: number,
  score: number,
  passed: boolean,
  marksLevelComplete = true,
) {
  setState((state) => {
    const attempts = [...(state.quest.bossAttempts[levelId] || [])];
    attempts.push({ date: todayISO(), score, passed, subId: null });
    const bossPassed = { ...state.quest.bossPassed };
    if (passed && marksLevelComplete) bossPassed[levelId] = true;
    return checkAchievements({
      ...state,
      quest: { ...state.quest, bossAttempts: { ...state.quest.bossAttempts, [levelId]: attempts }, bossPassed },
    });
  });
}

export function missionItemTitle(item: MissionItem) {
  if (item.type === 'topic') return findTopic(item.id)?.title || item.id;
  if (item.type === 'coding') return findCoding(item.id)?.title || item.id;
  if (item.type === 'lab') return findLab(item.id)?.title || item.id;
  return item.id;
}

export function continueQuestTarget(state: AppState): ContinueTarget | null {
  for (const level of QUEST_LEVELS) {
    if (!isLevelUnlocked(state, level.id)) continue;
    for (const item of levelMissionList(level)) {
      if (item.type !== 'topic') continue;
      const m = state.quest.missions[`topic:${item.id}`];
      if (m && m.opened && !m.completedAt) {
        return {
          label: `Continue mission: ${missionItemTitle(item)}`,
          path: `/mission/${level.id}/${item.id}`,
        };
      }
    }
  }

  for (const level of QUEST_LEVELS) {
    if (!isLevelUnlocked(state, level.id)) continue;
    if (levelStatus(state, level) === 'boss_available' && !bossAttemptedToday(state, level.id)) {
      return { label: `Boss battle: ${level.title}`, path: `/boss/${level.id}` };
    }
  }

  for (const level of QUEST_LEVELS) {
    if (!isLevelUnlocked(state, level.id)) continue;
    const prog = levelMissionProgress(state, level);
    const next = prog.items.find((i) => !i.done);
    if (next) {
      if (next.type === 'topic')
        return {
          label: `Start mission: ${missionItemTitle(next)}`,
          path: `/mission/${level.id}/${next.id}`,
        };
      if (next.type === 'coding')
        return {
          label: `Coding mission: ${missionItemTitle(next)}`,
          path: `/coding/${next.id}?level=${level.id}`,
        };
      if (next.type === 'lab')
        return {
          label: `Lab mission: ${missionItemTitle(next)}`,
          path: `/lab/${next.id}?level=${level.id}`,
        };
    }
    if (level.id === 9 && !levelRequirementsMet(state, level)) {
      return { label: 'Defend your projects', path: `/level/9` };
    }
    if (level.id === 10 && !state.quest.bossPassed[10]) {
      return { label: 'Final Interview Arena', path: `/boss/10` };
    }
  }

  return null;
}

export function markMissionOpened(setState: SetState, topicId: string) {
  setState((state) => {
    const m = ensureMission(state, topicId);
    if (m.opened) return state;
    return {
      ...state,
      quest: {
        ...state.quest,
        missions: {
          ...state.quest.missions,
          [`topic:${topicId}`]: { ...m, opened: true },
        },
      },
    };
  });
}

export function markMissionRecall(
  setState: SetState,
  pushXp: PushXp,
  topicId: string,
  passed: boolean,
) {
  setState((state) => {
    const m = ensureMission(state, topicId);
    if (m.recallAttempted) return state;
    return {
      ...state,
      quest: {
        ...state.quest,
        missions: {
          ...state.quest.missions,
          [`topic:${topicId}`]: {
            ...m,
            recallAttempted: true,
            recallPassed: passed,
          },
        },
      },
    };
  });
  const title = findTopic(topicId)?.title || topicId;
  awardXP(setState, pushXp, 10, `Recalled: ${title}`, `mission:topic:${topicId}:recall`);
}

export function markMissionPractise(setState: SetState, pushXp: PushXp, topicId: string) {
  setState((state) => {
    const m = ensureMission(state, topicId);
    if (m.exerciseAttempted) return state;
    return {
      ...state,
      quest: {
        ...state.quest,
        missions: {
          ...state.quest.missions,
          [`topic:${topicId}`]: { ...m, exerciseAttempted: true },
        },
      },
    };
  });
  const title = findTopic(topicId)?.title || topicId;
  awardXP(setState, pushXp, 15, `Practised: ${title}`, `mission:topic:${topicId}:practise`);
}

export function completeTopicMission(
  setState: SetState,
  pushXp: PushXp,
  topicId: string,
  confidenceStatus: ItemStatus,
): boolean {
  let done = false;
  setState((state) => {
    const m = ensureMission(state, topicId);
    if (!(m.opened && m.recallAttempted && m.exerciseAttempted)) return state;
    done = confidenceStatus === 'confident' || confidenceStatus === 'mastered';
    const completedAt = done && !m.completedAt ? todayISO() : m.completedAt;
    const key = `topic:${topicId}`;
    let next: AppState = {
      ...state,
      quest: {
        ...state.quest,
        missions: {
          ...state.quest.missions,
          [key]: { ...m, confidence: confidenceStatus, completedAt },
        },
      },
    };
    // also mirror handbook status
    const itemKey = `topic:${topicId}`;
    const prev = getItem(next, 'topic', topicId);
    next = {
      ...next,
      items: {
        ...next.items,
        [itemKey]: { ...prev, status: confidenceStatus, updatedAt: todayISO() },
      },
    };
    return next;
  });
  if (done) {
    const title = findTopic(topicId)?.title || topicId;
    awardXP(
      setState,
      pushXp,
      confidenceStatus === 'mastered' ? 30 : 20,
      `Mission complete: ${title}`,
      `mission:topic:${topicId}:complete:${confidenceStatus}`,
    );
  }
  return done;
}

export function codingBossProgress(state: AppState, level: QuestLevel) {
  const ids = level.boss.codingIds || [];
  const solved = ids.filter((id) => {
    const p = getItem(state, 'coding', id).codingProgress;
    return p === 'solved_no_help' || p === 'solved_with_hints';
  }).length;
  return {
    solved,
    total: ids.length,
    pct: ids.length ? Math.round((solved / ids.length) * 100) : 0,
  };
}

export { findLevel };
