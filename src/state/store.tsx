import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import type {
  AppState,
  CodingProgress,
  ItemRecord,
  ItemStatus,
  MissionProof,
  QuestState,
  XpPopup,
} from '../types';
import { todayISO } from '../lib/dates';

const STORAGE_KEY = 'ficc_quest_v1';

function defaultQuest(): QuestState {
  return {
    xp: 0,
    xpLog: [],
    bossPassed: {},
    bossAttempts: {},
    achievements: [],
    aloudTotalCount: 0,
    awardedKeys: {},
    activityLog: [],
    missions: {},
  };
}

export function defaultState(): AppState {
  return {
    createdAt: todayISO(),
    meta: { streak: 0, lastActiveDate: null, startDate: todayISO() },
    items: {},
    mockSessions: [],
    quest: defaultQuest(),
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...defaultState(),
      ...parsed,
      meta: { ...defaultState().meta, ...parsed.meta },
      quest: { ...defaultQuest(), ...parsed.quest },
      items: parsed.items || {},
      mockSessions: parsed.mockSessions || [],
    };
  } catch {
    return defaultState();
  }
}

function touchStreak(state: AppState): AppState {
  const today = todayISO();
  const last = state.meta.lastActiveDate;
  if (last === today) return state;
  let streak = state.meta.streak || 0;
  if (!last) streak = 1;
  else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    streak = last === todayISO(yesterday) ? streak + 1 : 1;
  }
  return {
    ...state,
    meta: { ...state.meta, streak, lastActiveDate: today },
  };
}

type Action =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'SET_STATE'; updater: (s: AppState) => AppState }
  | { type: 'TOUCH_STREAK' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'TOUCH_STREAK':
      return touchStreak(state);
    case 'SET_STATE':
      return action.updater(state);
    default:
      return state;
  }
}

interface StoreApi {
  state: AppState;
  setState: (updater: (s: AppState) => AppState) => void;
  xpPopups: XpPopup[];
  pushXpPopup: (amount: number, reason: string) => void;
  dismissXpPopup: (id: number) => void;
  levelUpLevelId: number | null;
  triggerLevelUp: (levelId: number) => void;
  clearLevelUp: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [xpPopups, setXpPopups] = useState<XpPopup[]>([]);
  const [levelUpLevelId, setLevelUpLevelId] = useState<number | null>(null);
  const popupId = useRef(0);
  const hydrated = useRef(false);

  useEffect(() => {
    dispatch({ type: 'TOUCH_STREAK' });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const api: StoreApi = {
    state,
    setState: (updater) => dispatch({ type: 'SET_STATE', updater }),
    xpPopups,
    pushXpPopup: (amount, reason) => {
      const id = ++popupId.current;
      setXpPopups((p) => [...p, { id, amount, reason }]);
      setTimeout(() => setXpPopups((p) => p.filter((x) => x.id !== id)), 2200);
    },
    dismissXpPopup: (id) => setXpPopups((p) => p.filter((x) => x.id !== id)),
    levelUpLevelId,
    triggerLevelUp: (levelId) => setLevelUpLevelId(levelId),
    clearLevelUp: () => setLevelUpLevelId(null),
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}

export function itemKey(collection: string, id: string) {
  return `${collection}:${id}`;
}

export function getItem(state: AppState, collection: string, id: string): ItemRecord {
  const key = itemKey(collection, id);
  return (
    state.items[key] || {
      status: 'not_started',
      confidence: 0,
      notes: '',
      nextReview: null,
    }
  );
}

export function setItemStatus(
  state: AppState,
  collection: string,
  id: string,
  status: ItemStatus,
): AppState {
  const key = itemKey(collection, id);
  const prev = getItem(state, collection, id);
  return {
    ...state,
    items: {
      ...state.items,
      [key]: {
        ...prev,
        status,
        updatedAt: todayISO(),
        nextReview:
          status === 'confident' || status === 'mastered'
            ? addDays(todayISO(), status === 'mastered' ? 14 : 7)
            : prev.nextReview,
      },
    },
  };
}

export function setCodingProgress(
  state: AppState,
  id: string,
  codingProgress: CodingProgress,
): AppState {
  const key = itemKey('coding', id);
  const prev = getItem(state, 'coding', id);
  return {
    ...state,
    items: {
      ...state.items,
      [key]: {
        ...prev,
        codingProgress,
        updatedAt: todayISO(),
        status:
          codingProgress === 'solved_no_help' || codingProgress === 'solved_with_hints'
            ? 'confident'
            : prev.status,
      },
    },
  };
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function ensureMission(state: AppState, topicId: string): MissionProof {
  return (
    state.quest.missions[`topic:${topicId}`] || {
      opened: false,
      recallAttempted: false,
      recallPassed: null,
      exerciseAttempted: false,
      confidence: null,
      completedAt: null,
    }
  );
}
