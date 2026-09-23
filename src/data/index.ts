import type {
  CodingProblem,
  Lab,
  MachineCoding,
  Project,
  Question,
  QuestLevel,
  SystemDesign,
  Topic,
} from '../types';
import achievementsJson from './achievements.json';
import codingJson from './coding.json';
import labsJson from './labs.json';
import machineCodingJson from './machineCoding.json';
import projectsJson from './projects.json';
import questionsJson from './questions.json';
import questLevelsJson from './questLevels.json';
import systemDesignsJson from './systemDesigns.json';
import topicsJson from './topics.json';

export const QUEST_LEVELS = questLevelsJson as QuestLevel[];
export const TOPICS = topicsJson as Topic[];
export const QUESTIONS = questionsJson as Question[];
export const CODING_PROBLEMS = codingJson as CodingProblem[];
export const MACHINE_CODING = machineCodingJson as MachineCoding[];
export const LABS = labsJson as Lab[];
export const SYSTEM_DESIGNS = systemDesignsJson as SystemDesign[];
export const PROJECTS = projectsJson as Project[];
export const ACHIEVEMENTS = achievementsJson as {
  id: string;
  title: string;
  description: string;
}[];

export const PLAYER_RANKS = [
  { min: 0, title: 'Frontend Recruit' },
  { min: 500, title: 'Junior Contributor' },
  { min: 1500, title: 'Frontend Engineer' },
  { min: 3000, title: 'Confident Engineer' },
  { min: 4500, title: 'Senior-Track Engineer' },
  { min: 6000, title: 'Interview Sharp' },
  { min: 7000, title: 'Interview Ready' },
] as const;

export function findTopic(id: string) {
  return TOPICS.find((t) => t.id === id);
}

export function findQuestion(id: string) {
  return QUESTIONS.find((q) => q.id === id);
}

export function findCoding(id: string) {
  return CODING_PROBLEMS.find((c) => c.id === id);
}

export function findLab(id: string) {
  return LABS.find((l) => l.id === id);
}

export function findMachineCoding(id: string) {
  return MACHINE_CODING.find((m) => m.id === id);
}

export function findSystemDesign(id: string) {
  return SYSTEM_DESIGNS.find((s) => s.id === id);
}

export function findLevel(id: number) {
  return QUEST_LEVELS.find((l) => l.id === id);
}

export function questionsForCategory(category: string) {
  return QUESTIONS.filter((q) => q.category === category);
}
