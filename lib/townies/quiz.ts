import 'server-only';

/**
 * Mass trivia for the pop-up (Lucas, 2026-10-07: "crazy easy trivia about
 * Mass"). Answers live only on the server; the browser gets questions and
 * shuffled options, and /api/quiz/grade scores the picks.
 *
 * Every answer here is a plain fact. Add questions freely, but keep them easy
 * and checkable: nothing contested, nothing that changes year to year.
 */
type Question = { id: string; q: string; answer: string; wrong: [string, string, string] };

export const QUESTIONS: Question[] = [
  { id: 'capital', q: 'What’s the capital of Massachusetts?', answer: 'Boston', wrong: ['Worcester', 'Springfield', 'Salem'] },
  { id: 'cape', q: 'Which cape is in Massachusetts?', answer: 'Cape Cod', wrong: ['Cape Canaveral', 'Cape May', 'Cape Hatteras'] },
  { id: 'frappe', q: 'In Mass, a milkshake with ice cream is called a…', answer: 'Frappe', wrong: ['Float', 'Smoothie', 'Slushie'] },
  { id: 'fenway', q: 'Who plays at Fenway Park?', answer: 'Red Sox', wrong: ['Patriots', 'Celtics', 'Bruins'] },
  { id: 'ocean', q: 'Which ocean is off the Mass coast?', answer: 'Atlantic', wrong: ['Pacific', 'Indian', 'Arctic'] },
  { id: 'plymouth', q: 'Where did the Pilgrims land in 1620?', answer: 'Plymouth', wrong: ['Nantucket', 'Gloucester', 'Worcester'] },
  { id: 'wicked', q: 'If something is “wicked good,” it’s…', answer: 'Very good', wrong: ['Evil', 'Spooky', 'Overrated'] },
  { id: 'dunkin', q: 'Dunkin’ opened its first shop in which Mass city?', answer: 'Quincy', wrong: ['Pittsfield', 'Lowell', 'Fall River'] },
  { id: 'salem', q: 'Which city is known for its 1692 witch trials?', answer: 'Salem', wrong: ['Hingham', 'Milton', 'Braintree'] },
  { id: 'pike', q: 'Locals call I-90 across the state…', answer: 'The Pike', wrong: ['The Loop', 'The Turnpike Trail', 'The 90s'] },
  { id: 'the-t', q: 'In Boston, “the T” is…', answer: 'The subway', wrong: ['A sandwich', 'A sports bar', 'A tunnel'] },
  { id: 'harbor', q: 'What did colonists throw into Boston Harbor in 1773?', answer: 'Tea', wrong: ['Coffee', 'Lobsters', 'Hats'] },
];

export const QUIZ_LENGTH = 4;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Four random questions, options shuffled. No answers leave the server. */
export function drawQuiz() {
  return shuffle(QUESTIONS)
    .slice(0, QUIZ_LENGTH)
    .map((q) => ({ id: q.id, q: q.q, options: shuffle([q.answer, ...q.wrong]) }));
}

/** Score picks by question id. Requires QUIZ_LENGTH distinct, known questions. */
export function gradeQuiz(picks: Record<string, string>): { score: number; correct: Record<string, string> } | null {
  const ids = Object.keys(picks);
  if (ids.length !== QUIZ_LENGTH) return null;
  const correct: Record<string, string> = {};
  let score = 0;
  for (const id of ids) {
    const q = QUESTIONS.find((x) => x.id === id);
    if (!q) return null;
    correct[id] = q.answer;
    if (picks[id] === q.answer) score++;
  }
  return { score, correct };
}
