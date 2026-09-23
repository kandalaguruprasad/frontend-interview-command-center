export type TopicLevel = 'basic' | 'intermediate' | 'senior';

export interface Topic {
  id: string;
  category: string;
  title: string;
  level: TopicLevel;
  explanation: string;
  whyItMatters: string;
  simpleExample: string;
  realExample: string;
  commonMistake: string;
  interviewAnswer: string;
  followUps: string[];
  miniExercise: string;
  seniorDiscussion: string;
}

export interface Question {
  id: string;
  category: string;
  difficulty: TopicLevel;
  time: string;
  question: string;
  concise: string;
  strong: string;
  code: string | null;
  weak: string;
  followUp: string;
}

export interface CodingTest {
  args: unknown[];
  expected: unknown;
  desc: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: string;
  functionName: string;
  statement: string;
  examples: string;
  constraints: string;
  starter: string;
  tests: CodingTest[];
  hints: string[];
  solution: string;
  complexity: string;
  variation: string;
  explain: string;
}

export interface MachineCoding {
  id: string;
  title: string;
  timeLimit: string;
  requirements: string;
  acceptanceCriteria: string[];
  componentBreakdown: string;
  stateModel: string;
  edgeCases: string[];
  a11yChecklist: string[];
  rubric: string;
  starterData: string;
  referenceSolution: string;
}

export interface Lab {
  id: string;
  title: string;
  category?: string;
  [key: string]: unknown;
}

export interface SystemDesign {
  id: string;
  title: string;
  [key: string]: unknown;
}

export interface ProjectQuestion {
  id: string;
  type: string;
  question: string;
  thirtySec: string;
  ninetySec: string;
  deepDive: string;
  weak: string;
  followUps: string[];
  honestyWarning: string | null;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  context: string;
  stack: string[];
  questions: ProjectQuestion[];
}

export type BossType =
  | 'quiz'
  | 'coding'
  | 'machinecoding'
  | 'systemdesign'
  | 'project'
  | 'mockinterview';

export interface QuestBoss {
  type: BossType;
  description: string;
  category?: string;
  duration?: number;
  codingIds?: string[];
  refId?: string;
}

export interface QuestLevel {
  id: number;
  zone: string;
  title: string;
  description: string;
  topicCategory?: string;
  requiredTopics: string[];
  requiredCoding: string[];
  requiredLabs: string[];
  requirements?: { minReadiness?: number };
  boss: QuestBoss;
}

export type ItemStatus =
  | 'not_started'
  | 'learning'
  | 'needs_revision'
  | 'confident'
  | 'mastered';

export type CodingProgress =
  | 'not_viewed'
  | 'viewed'
  | 'attempted'
  | 'tests_partial'
  | 'solved_no_help'
  | 'solved_with_hints'
  | 'revealed';

export type MissionStage = 'learn' | 'recall' | 'practise' | 'complete' | 'done';

export type LevelStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'boss_available'
  | 'completed'
  | 'mastered';

export interface MissionProof {
  opened: boolean;
  recallAttempted: boolean;
  recallPassed: boolean | null;
  exerciseAttempted: boolean;
  confidence: ItemStatus | null;
  completedAt: string | null;
}

export interface ItemRecord {
  status: ItemStatus;
  confidence: number;
  notes: string;
  nextReview: string | null;
  codingProgress?: CodingProgress;
  updatedAt?: string;
}

export interface BossAttempt {
  date: string;
  score: number;
  passed: boolean;
  subId: string | null;
}

export interface XpLogEntry {
  date: string;
  amount: number;
  reason: string;
}

export interface ActivityEntry {
  action: string;
  amount: number;
  at: string;
}

export interface QuestState {
  xp: number;
  xpLog: XpLogEntry[];
  bossPassed: Record<number, boolean>;
  bossAttempts: Record<number, BossAttempt[]>;
  achievements: string[];
  aloudTotalCount: number;
  awardedKeys: Record<string, boolean>;
  activityLog: ActivityEntry[];
  missions: Record<string, MissionProof>;
}

export interface AppState {
  createdAt: string;
  meta: {
    streak: number;
    lastActiveDate: string | null;
    startDate: string;
  };
  items: Record<string, ItemRecord>;
  mockSessions: { date: string; duration: number; score: number; category: string }[];
  quest: QuestState;
}

export interface MissionItem {
  type: 'topic' | 'coding' | 'lab';
  id: string;
}

export interface ContinueTarget {
  label: string;
  path: string;
}

export interface XpPopup {
  id: number;
  amount: number;
  reason: string;
}
