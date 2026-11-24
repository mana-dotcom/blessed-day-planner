export type Difficulty = "easy" | "medium" | "hard";
export type Board = (number | null)[]; // length 81, 0-8 row-major
export type Notes = number[][]; // length 81, each entry is array of candidate digits 1-9

export const DIFFICULTY_CLUES: Record<Difficulty, number> = {
  easy: 42,
  medium: 32,
  hard: 26,
};

export const DIFFICULTY_NJOUN: Record<Difficulty, number> = {
  easy: 3,
  medium: 6,
  hard: 12,
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function emptyBoard(): Board {
  return Array(81).fill(null);
}

export function emptyNotes(): Notes {
  return Array.from({ length: 81 }, () => []);
}

export function rowOf(i: number) {
  return Math.floor(i / 9);
}
export function colOf(i: number) {
  return i % 9;
}
export function boxOf(i: number) {
  return Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
}

export function peers(i: number): number[] {
  const r = rowOf(i);
  const c = colOf(i);
  const b = boxOf(i);
  const result = new Set<number>();
  for (let x = 0; x < 9; x++) {
    result.add(r * 9 + x); // same row
    result.add(x * 9 + c); // same col
  }
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  for (let rr = br; rr < br + 3; rr++) {
    for (let cc = bc; cc < bc + 3; cc++) {
      result.add(rr * 9 + cc);
    }
  }
  result.delete(i);
  return [...result];
}

const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => peers(i));

export function isValid(board: Board, index: number, value: number): boolean {
  for (const p of PEERS[index]!) {
    if (board[p] === value) return false;
  }
  return true;
}

export function findConflicts(board: Board, index: number, value: number | null): Set<number> {
  if (value === null) return new Set();
  const conflicts = new Set<number>();
  for (const p of PEERS[index]!) {
    if (board[p] === value) conflicts.add(p);
  }
  return conflicts;
}

export function allConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>();
  for (let i = 0; i < 81; i++) {
    const v = board[i];
    if (v === null) continue;
    for (const p of PEERS[i]!) {
      if (board[p] === v) {
        conflicts.add(i);
        conflicts.add(p);
      }
    }
  }
  return conflicts;
}

/** Solve a board in-place with backtracking; returns true if solved. */
export function solve(board: Board): boolean {
  let idx = -1;
  for (let i = 0; i < 81; i++) {
    if (board[i] === null) {
      idx = i;
      break;
    }
  }
  if (idx === -1) return true; // complete
  const candidates = shuffledDigits();
  for (const v of candidates) {
    if (isValid(board, idx, v)) {
      board[idx] = v;
      if (solve(board)) return true;
      board[idx] = null;
    }
  }
  return false;
}

export function isSolved(board: Board): boolean {
  for (let i = 0; i < 81; i++) {
    const v = board[i];
    if (v === null || v === undefined) return false;
    if (!isValid(board, i, v)) return false;
  }
  return true;
}

function shuffledDigits(): number[] {
  const d = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j]!, d[i]!];
  }
  return d;
}

/** Generate a full valid solved board. */
function generateFull(): Board {
  const board = emptyBoard();
  solve(board);
  return board;
}

/**
 * Generate a solvable puzzle by removing cells from a full solution.
 * Keeps the solution so we can validate and give hints.
 */
export function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board; givens: boolean[] } {
  const solution = generateFull();
  const puzzle: Board = [...solution];
  const givens = Array(81).fill(true);
  const targetClues = DIFFICULTY_CLUES[difficulty];
  const toRemove = 81 - targetClues;

  // Remove random cells; we keep the solution for hints so uniqueness check is optional.
  const indices = Array.from({ length: 81 }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }

  let removed = 0;
  for (const idx of indices) {
    if (removed >= toRemove) break;
    puzzle[idx] = null;
    givens[idx] = false;
    removed++;
  }

  return { puzzle, solution, givens };
}

/** Return a hint: the correct value for the first empty or wrong cell. */
export function getHint(board: Board, solution: Board): { index: number; value: number } | null {
  for (let i = 0; i < 81; i++) {
    if (board[i] !== solution[i]) {
      return { index: i, value: solution[i]! };
    }
  }
  return null;
}

/** Toggle a candidate in notes for a cell. */
export function toggleNote(notes: Notes, index: number, digit: number): Notes {
  const cellNotes = [...notes[index]!];
  const pos = cellNotes.indexOf(digit);
  if (pos >= 0) cellNotes.splice(pos, 1);
  else cellNotes.push(digit);
  return notes.map((n, i) => (i === index ? cellNotes : n));
}

/** Auto-compute notes: candidates that aren't in any peer. */
export function autoNotes(board: Board): Notes {
  return Array.from({ length: 81 }, (_, i) => {
    if (board[i] !== null) return [];
    const used = new Set<number>();
    for (const p of PEERS[i]!) {
      if (board[p] !== null) used.add(board[p]!);
    }
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !used.has(d));
  });
}
