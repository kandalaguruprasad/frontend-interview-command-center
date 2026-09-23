import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'legacy', 'index.html'), 'utf8');
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
const script = html.slice(scriptStart + 8, scriptEnd);

function extractArrayLiteral(name) {
  const marker = `const ${name} = `;
  const idx = script.indexOf(marker);
  if (idx < 0) throw new Error(`not found: ${name}`);
  let i = idx + marker.length;
  while (/\s/.test(script[i])) i++;
  if (script[i] !== '[') throw new Error(`${name} is not an array`);
  let depth = 0;
  let inStr = null;
  let esc = false;
  const start = i;
  for (; i < script.length; i++) {
    const c = script[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = c;
      continue;
    }
    // skip line comments
    if (c === '/' && script[i + 1] === '/') {
      while (i < script.length && script[i] !== '\n') i++;
      continue;
    }
    // skip block comments
    if (c === '/' && script[i + 1] === '*') {
      i += 2;
      while (i < script.length && !(script[i] === '*' && script[i + 1] === '/')) i++;
      i++;
      continue;
    }
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return script.slice(start, i + 1);
    }
  }
  throw new Error(`unclosed array: ${name}`);
}

function parseLiteral(src, prelude = '') {
  return new Function(`${prelude}\nreturn (${src});`)();
}

const outDir = path.join(root, 'src', 'data');
fs.mkdirSync(outDir, { recursive: true });

const TOPICS = parseLiteral(extractArrayLiteral('TOPICS'));
const QUESTIONS = parseLiteral(extractArrayLiteral('QUESTIONS'));
const CODING_PROBLEMS = parseLiteral(extractArrayLiteral('CODING_PROBLEMS'));
const MACHINE_CODING = parseLiteral(extractArrayLiteral('MACHINE_CODING'));
const LABS = parseLiteral(extractArrayLiteral('LABS'));
const SYSTEM_DESIGNS = parseLiteral(extractArrayLiteral('SYSTEM_DESIGNS'));

const mkQSrc = `
function mkQ(cfg){
  return {
    id: cfg.id, type: cfg.type, question: cfg.question,
    thirtySec: cfg.thirtySec, ninetySec: cfg.ninetySec, deepDive: cfg.deepDive,
    weak: cfg.weak, followUps: cfg.followUps || [],
    honestyWarning: cfg.honestyWarning || null,
  };
}
`;
const PROJECTS = parseLiteral(extractArrayLiteral('PROJECTS'), mkQSrc);
const QUEST_LEVELS = parseLiteral(extractArrayLiteral('QUEST_LEVELS'));

const ACHIEVEMENTS_META = [
  { id: 'first_blood', title: 'First Blood', description: 'Pass your first boss battle.' },
  { id: 'no_notes_needed', title: 'No Notes Needed', description: 'Explain 10 concepts aloud.' },
  { id: 'clean_coder', title: 'Clean Coder', description: 'Solve 5 coding problems without hints.' },
  { id: 'streak_keeper', title: 'Streak Keeper', description: 'Reach a 7-day preparation streak.' },
  { id: 'halfway_hero', title: 'Halfway Hero', description: 'Pass the boss at Level 6.' },
  { id: 'daily_disciplined', title: 'Daily Discipline', description: 'Complete all 3 daily quests in one day.' },
  { id: 'quest_complete', title: 'Quest Complete', description: 'Pass the Level 10 final boss.' },
];

function writeJson(name, data) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2));
}

writeJson('topics.json', TOPICS);
writeJson('questions.json', QUESTIONS);
writeJson('coding.json', CODING_PROBLEMS);
writeJson('machineCoding.json', MACHINE_CODING);
writeJson('labs.json', LABS);
writeJson('systemDesigns.json', SYSTEM_DESIGNS);
writeJson('projects.json', PROJECTS);
writeJson('questLevels.json', QUEST_LEVELS);
writeJson('achievements.json', ACHIEVEMENTS_META);

console.log({
  levels: QUEST_LEVELS.length,
  topics: TOPICS.length,
  questions: QUESTIONS.length,
  coding: CODING_PROBLEMS.length,
  machineCoding: MACHINE_CODING.length,
  labs: LABS.length,
  systemDesigns: SYSTEM_DESIGNS.length,
  projects: PROJECTS.length,
});
