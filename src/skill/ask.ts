// T2.7 AskUserQuestion ONE-AT-A-TIME wrapper (F5.3)
// 00-common §AskUserQuestion 패턴 enforce

export interface Question {
  id: string;
  prompt: string;
  options?: { label: string; description?: string }[];
  recommend?: string;
  why?: string;
}

export interface AskerState {
  pending: Question[];
  asked: Question[];
  answers: Map<string, string>;
}

export function createAsker(questions: Question[]): AskerState {
  return { pending: [...questions], asked: [], answers: new Map() };
}

/**
 * Pull next question. Returns null when all asked.
 * F5.3: STOP after each — caller must answer before next() returns the next.
 */
export function next(state: AskerState): Question | null {
  if (state.pending.length === 0) return null;
  const q = state.pending[0];
  return q;
}

/**
 * Record answer for current question. Advances queue.
 * Throws if answer for already-answered or non-pending question.
 */
export function answer(state: AskerState, id: string, value: string): void {
  if (state.answers.has(id)) {
    throw new Error(`AskerState: question ${id} already answered (F5.3 ONE-AT-A-TIME violation)`);
  }
  const idx = state.pending.findIndex((q) => q.id === id);
  if (idx === -1) {
    throw new Error(`AskerState: question ${id} not pending`);
  }
  const [q] = state.pending.splice(idx, 1);
  state.asked.push(q);
  state.answers.set(id, value);
}

export function isComplete(state: AskerState): boolean {
  return state.pending.length === 0;
}
