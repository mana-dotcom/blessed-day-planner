import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eraser, Lightbulb, Pencil, Play, Star, Timer, Trophy, X } from "lucide-react";
import {
  type Board, type Difficulty, type Notes,
  allConflicts, autoNotes, DIFFICULTY_LABEL, DIFFICULTY_NJOUN, emptyBoard, emptyNotes,
  findConflicts, generatePuzzle, getHint, isSolved, toggleNote,
} from "@/lib/sudoku";
import { actions } from "@/lib/garden-game";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/jeux-sudoku")({
  head: () => ({
    meta: [
      { title: "Sudoku.exe — Jeux" },
      { name: "description", content: "Sudoku rétro pastel — résous la grille et gagne des njoum." },
      { property: "og:title", content: "Sudoku.exe — Jeux" },
      { property: "og:description", content: "Un sudoku mignon et rétro pour faire travailler ton cerveau." },
    ],
  }),
  component: SudokuRoute,
});

const SUDOKU_KEY = "sudoku-v1";
type SaveState = {
  board: Board;
  solution: Board;
  givens: boolean[];
  notes: Notes;
  difficulty: Difficulty;
  elapsed: number; // seconds
  solvedCount: number;
  active: boolean;
};

function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(SUDOKU_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveState;
  } catch {
    return null;
  }
}

function persist(s: SaveState) {
  localStorage.setItem(SUDOKU_KEY, JSON.stringify(s));
}

const SOLVED_KEY = "sudoku-solved-count";

function loadSolvedCount(): number {
  try {
    const raw = localStorage.getItem(SOLVED_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function persistSolvedCount(n: number) {
  localStorage.setItem(SOLVED_KEY, String(n));
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function SudokuRoute() {
  const [solvedCount, setSolvedCount] = useState(loadSolvedCount);
  const [save, setSave] = useState<SaveState | null>(loadSave);
  const [screen, setScreen] = useState<"start" | "play">(() => (loadSave()?.active ? "play" : "start"));
  const [difficulty, setDifficulty] = useState<Difficulty>(save?.difficulty ?? "easy");
  const [justWon, setJustWon] = useState(false);
  const [wonReward, setWonReward] = useState(0);
  const [, force] = useState(0);
  const rerender = useCallback(() => force((x) => x + 1), []);

  // Timer tick
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (screen !== "play" || !save?.active) return;
    timerRef.current = setInterval(() => {
      setSave((prev) => {
        if (!prev || !prev.active) return prev;
        const next = { ...prev, elapsed: prev.elapsed + 1 };
        persist(next);
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, save?.active]);

  const startGame = useCallback(
    (diff: Difficulty) => {
      const { puzzle, solution, givens } = generatePuzzle(diff);
      const state: SaveState = {
        board: puzzle,
        solution,
        givens,
        notes: emptyNotes(),
        difficulty: diff,
        elapsed: 0,
        solvedCount,
        active: true,
      };
      persist(state);
      setSave(state);
      setDifficulty(diff);
      setScreen("play");
      setJustWon(false);
    },
    [solvedCount],
  );

  const resetToStart = useCallback(() => {
    if (save?.active) {
      const cleared = { ...save, active: false };
      persist(cleared);
      setSave(cleared);
    }
    setScreen("start");
  }, [save]);

  const handleWin = useCallback(
    (state: SaveState) => {
      const reward = DIFFICULTY_NJOUN[state.difficulty];
      const newCount = solvedCount + 1;
      setSolvedCount(newCount);
      persistSolvedCount(newCount);
      actions.awardStars(reward);
      const cleared = { ...state, active: false };
      persist(cleared);
      setSave(cleared);
      setWonReward(reward);
      setJustWon(true);
    },
    [solvedCount],
  );

  if (screen === "start") {
    return (
      <SudokuStartScreen
        solvedCount={solvedCount}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onPlay={() => startGame(difficulty)}
        hasSave={!!save?.active}
        onResume={() => {
          if (save?.active) {
            setDifficulty(save.difficulty);
            setScreen("play");
          }
        }}
        njoum={useStore()[0].farm.stars}
      />
    );
  }

  if (!save || justWon) {
    return (
      <SudokuWinScreen
        reward={wonReward}
        solvedCount={solvedCount}
        difficulty={save?.difficulty ?? difficulty}
        time={fmtTime(save?.elapsed ?? 0)}
        onPlayAgain={() => startGame(save?.difficulty ?? difficulty)}
        onBackToStart={() => {
          setJustWon(false);
          setScreen("start");
        }}
      />
    );
  }

  return (
    <SudokuPlay
      state={save}
      onCellChange={(index, value, notes) => {
        const next: SaveState = { ...save, board: [...save.board], notes: notes ? notes.map((n) => [...n]) : save.notes };
        next.board[index] = value;
        if (value !== null) {
          // clear notes for this cell
          next.notes[index] = [];
        }
        persist(next);
        setSave(next);
        if (isSolved(next.board)) {
          handleWin(next);
        }
      }}
      onToggleNote={(index, digit) => {
        const nextNotes = toggleNote(save.notes, index, digit);
        const next = { ...save, notes: nextNotes };
        persist(next);
        setSave(next);
      }}
      onErase={(index) => {
        const next: SaveState = { ...save, board: [...save.board], notes: save.notes.map((n) => [...n]) };
        next.board[index] = null;
        next.notes[index] = [];
        persist(next);
        setSave(next);
      }}
      onHint={() => {
        const hint = getHint(save.board, save.solution);
        if (!hint) return;
        const next: SaveState = { ...save, board: [...save.board], notes: save.notes.map((n) => [...n]) };
        next.board[hint.index] = hint.value;
        next.notes[hint.index] = [];
        persist(next);
        setSave(next);
        if (isSolved(next.board)) {
          handleWin(next);
        }
      }}
      onAutoNotes={() => {
        const next = { ...save, notes: autoNotes(save.board) };
        persist(next);
        setSave(next);
      }}
      onBack={resetToStart}
      rerender={rerender}
    />
  );
}

/* ---------- Start Screen ---------- */

function SudokuStartScreen({
  solvedCount,
  difficulty,
  setDifficulty,
  onPlay,
  hasSave,
  onResume,
  njoum,
}: {
  solvedCount: number;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onPlay: () => void;
  hasSave: boolean;
  onResume: () => void;
  njoum: number;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-xl px-5 pb-32 pt-10">
      {/* Browser window frame */}
      <div className="overflow-hidden rounded-2xl border-2 border-primary/60 bg-card shadow-[0_8px_0_0_var(--primary)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b-2 border-primary/60 bg-gradient-to-r from-[#f9a8d4] via-[#fbcfe8] to-[#f9a8d4] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#e11d48]" />
            <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
            <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
          </div>
          <span className="mx-auto font-mono text-sm font-bold tracking-widest text-primary">Sudoku.exe</span>
          <Link to="/jeux" aria-label="Fermer" className="grid h-6 w-6 place-items-center rounded-full text-primary/70 hover:bg-primary/10">
            <X className="h-4 w-4" />
          </Link>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6 sm:p-8">
          {/* welcome badge */}
          <div className="text-center">
            <span className="inline-block rounded-full border-2 border-primary/30 bg-secondary px-4 py-1.5 font-mono text-xs uppercase tracking-[0.3em] text-primary">
              ✿ welcome diva! ✿
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-center font-display text-5xl leading-none text-primary sm:text-6xl"
            style={{ textShadow: "2px 2px 0 oklch(0.9 0.08 5), 4px 4px 0 oklch(0.85 0.06 5)" }}
          >
            Sudoku
          </h1>
          <p className="text-center font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            ♡ pastel puzzle ♡
          </p>

          {/* Solved counter + njoum */}
          <div className="flex justify-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-secondary/60 px-4 py-2.5">
              <Trophy className="h-5 w-5 text-accent-strong" />
              <div>
                <p className="font-mono text-lg font-bold leading-none text-primary">{solvedCount}</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">solved</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-secondary/60 px-4 py-2.5">
              <Star className="h-5 w-5 fill-current text-accent-strong" />
              <div>
                <p className="font-mono text-lg font-bold leading-none text-primary">{njoum}</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">njoum</p>
              </div>
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Difficulty / Settings</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-xl border-2 px-3 py-3 font-mono text-xs font-bold uppercase tracking-widest transition ${
                    difficulty === d
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--accent-strong)]"
                      : "border-primary/20 bg-secondary/60 text-primary hover:border-primary/50"
                  }`}
                >
                  {DIFFICULTY_LABEL[d]}
                  <span className="mt-0.5 block text-[9px] opacity-70">+{DIFFICULTY_NJOUN[d]} ★</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={onPlay}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-gradient-to-r from-[#f9a8d4] to-[#fbcfe8] px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary shadow-[0_4px_0_0_var(--primary)] transition active:translate-y-0.5 active:shadow-[0_2px_0_0_var(--primary)]"
            >
              <Play className="h-4 w-4 fill-current" /> Play
            </button>
            {hasSave && (
              <button
                onClick={onResume}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-card px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary transition hover:border-primary/60"
              >
                ↺ Resume game
              </button>
            )}
            <Link
              to="/jeux"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/20 px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Games
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Win Screen ---------- */

function SudokuWinScreen({
  reward,
  solvedCount,
  difficulty,
  time,
  onPlayAgain,
  onBackToStart,
}: {
  reward: number;
  solvedCount: number;
  difficulty: Difficulty;
  time: string;
  onPlayAgain: () => void;
  onBackToStart: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 pb-32 pt-10">
      <div className="w-full overflow-hidden rounded-2xl border-2 border-primary/60 bg-card shadow-[0_8px_0_0_var(--primary)]">
        <div className="flex items-center gap-2 border-b-2 border-primary/60 bg-gradient-to-r from-[#f9a8d4] via-[#fbcfe8] to-[#f9a8d4] px-4 py-2.5">
          <span className="mx-auto font-mono text-sm font-bold tracking-widest text-primary">Sudoku.exe</span>
        </div>
        <div className="space-y-6 p-8 text-center">
          <div className="text-6xl">✿</div>
          <h2
            className="font-display text-4xl text-primary sm:text-5xl"
            style={{ textShadow: "2px 2px 0 oklch(0.9 0.08 5)" }}
          >
            You did it!
          </h2>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">Sudoku solved, diva ♡</p>

          <div className="flex justify-center gap-3">
            <div className="rounded-xl border-2 border-primary/20 bg-secondary/60 px-5 py-3">
              <p className="font-mono text-2xl font-bold text-primary">{time}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">time</p>
            </div>
            <div className="rounded-xl border-2 border-primary/20 bg-secondary/60 px-5 py-3">
              <p className="font-mono text-2xl font-bold text-primary">{DIFFICULTY_LABEL[difficulty]}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">level</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-accent-strong/40 bg-accent/40 px-5 py-3">
            <Star className="h-6 w-6 fill-current text-accent-strong" />
            <span className="font-mono text-xl font-bold text-primary">+{reward} njoum!</span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Total solved: {solvedCount}
          </p>

          <div className="space-y-2.5">
            <button
              onClick={onPlayAgain}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-gradient-to-r from-[#f9a8d4] to-[#fbcfe8] px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary shadow-[0_4px_0_0_var(--primary)] transition active:translate-y-0.5 active:shadow-[0_2px_0_0_var(--primary)]"
            >
              <Play className="h-4 w-4 fill-current" /> Play again
            </button>
            <button
              onClick={onBackToStart}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/20 px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Play Screen ---------- */

function SudokuPlay({
  state,
  onCellChange,
  onToggleNote,
  onErase,
  onHint,
  onAutoNotes,
  onBack,
}: {
  state: SaveState;
  onCellChange: (index: number, value: number | null, notes?: Notes) => void;
  onToggleNote: (index: number, digit: number) => void;
  onErase: (index: number) => void;
  onHint: () => void;
  onAutoNotes: () => void;
  onBack: () => void;
  rerender: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const conflicts = useMemo(() => allConflicts(state.board), [state.board]);

  const selectedValue: number | null = selected !== null ? (state.board[selected] ?? null) : null;
  const selectedConflicts = useMemo(
    () => (selected !== null && state.board[selected] != null ? findConflicts(state.board, selected, state.board[selected]!) : new Set<number>()),
    [state.board, selected],
  );

  const placeNumber = (digit: number) => {
    if (selected === null) return;
    if (state.givens[selected]) return;
    if (noteMode) {
      onToggleNote(selected, digit);
    } else {
      onCellChange(selected, digit);
    }
  };

  const handleErase = () => {
    if (selected === null) return;
    if (state.givens[selected]) return;
    onErase(selected);
  };

  return (
    <div className="mx-auto min-h-screen max-w-xl px-5 pb-32 pt-6">
      {/* Browser frame */}
      <div className="overflow-hidden rounded-2xl border-2 border-primary/60 bg-card shadow-[0_6px_0_0_var(--primary)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b-2 border-primary/60 bg-gradient-to-r from-[#f9a8d4] via-[#fbcfe8] to-[#f9a8d4] px-3 py-2">
          <button
            onClick={onBack}
            aria-label="Back to Games"
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary transition hover:bg-primary/20"
          >
            <ArrowLeft className="h-3 w-3" /> Games
          </button>
          <span className="mx-auto font-mono text-sm font-bold tracking-widest text-primary">Sudoku.exe</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
            {DIFFICULTY_LABEL[state.difficulty]}
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Timer + njoum row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-1.5">
              <Timer className="h-4 w-4 text-accent-strong" />
              <span className="font-mono text-sm font-bold text-primary">{fmtTime(state.elapsed)}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-1.5">
              <Trophy className="h-4 w-4 text-accent-strong" />
              <span className="font-mono text-sm font-bold text-primary">{loadSolvedCount()}</span>
            </div>
          </div>

          {/* Board */}
          <SudokuBoard
            board={state.board}
            givens={state.givens}
            notes={state.notes}
            selected={selected}
            onSelect={setSelected}
            conflicts={conflicts}
            selectedConflicts={selectedConflicts}
            selectedValue={selectedValue}
          />

          {/* Number pad */}
          <div className="grid grid-cols-9 gap-1">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((digit) => {
              const count = state.board.filter((v) => v === digit).length;
              const complete = count >= 9;
              return (
                <button
                  key={digit}
                  onClick={() => placeNumber(digit)}
                  disabled={complete && !noteMode}
                  className={`aspect-square rounded-lg border-2 font-mono text-lg font-bold transition ${
                    noteMode
                      ? "border-primary/30 bg-secondary/40 text-primary/70 hover:border-primary/60"
                      : "border-primary/20 bg-secondary/60 text-primary hover:border-primary hover:bg-secondary active:scale-95"
                  } ${complete && !noteMode ? "opacity-30" : ""}`}
                >
                  {digit}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-4 gap-2">
            <ActionButton
              active={noteMode}
              onClick={() => setNoteMode((v) => !v)}
              icon={<Pencil className="h-4 w-4" />}
              label="Notes"
            />
            <ActionButton onClick={handleErase} icon={<Eraser className="h-4 w-4" />} label="Erase" />
            <ActionButton onClick={onHint} icon={<Lightbulb className="h-4 w-4" />} label="Hint" />
            <ActionButton onClick={onAutoNotes} icon={<span className="text-xs font-bold">A</span>} label="Auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  active,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest transition ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-[0_2px_0_0_var(--accent-strong)]"
          : "border-primary/20 bg-secondary/60 text-primary hover:border-primary/50 active:scale-95"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------- Board ---------- */

function SudokuBoard({
  board,
  givens,
  notes,
  selected,
  onSelect,
  conflicts,
  selectedConflicts,
  selectedValue,
}: {
  board: Board;
  givens: boolean[];
  notes: Notes;
  selected: number | null;
  onSelect: (i: number) => void;
  conflicts: Set<number>;
  selectedConflicts: Set<number>;
  selectedValue: number | null;
}) {
  return (
    <div className="mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-xl border-2 border-primary/70 bg-primary/5">
      <div className="grid grid-cols-9 gap-0">
        {board.map((value, i) => {
          const row = Math.floor(i / 9);
          const col = i % 9;
          const isGiven = givens[i];
          const isSelected = selected === i;
          const isPeer = selected !== null && selected !== i && isPeerOf(selected, i);
          const sameValue = selectedValue !== null && value === selectedValue && !isSelected;
          const isConflict = conflicts.has(i);
          const isSelectedConflict = selectedConflicts.has(i);
          const isBoxBorderRight = (col + 1) % 3 === 0 && col !== 8;
          const isBoxBorderBottom = (row + 1) % 3 === 0 && row !== 8;
          const cellNotes = notes[i] ?? [];

          let bg = "bg-card";
          if (isConflict) bg = "bg-[#fecdd3]/50";
          if (isSelectedConflict) bg = "bg-[#fb7185]/40";
          if (isPeer && !isConflict) bg = "bg-secondary/50";
          if (sameValue && !isConflict) bg = "bg-[#fbcfe8]/60";
          if (isSelected) bg = "bg-[#f9a8d4]/70";

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`relative flex aspect-square items-center justify-center border-b border-r border-primary/15 ${bg} ${isBoxBorderRight ? "border-r-2 border-r-primary/50" : ""} ${isBoxBorderBottom ? "border-b-2 border-b-primary/50" : ""} ${col === 0 ? "border-l-0" : ""} ${row === 0 ? "border-t-0" : ""} transition-colors`}
            >
              {value !== null ? (
                <span
                  className={`font-mono text-base font-bold sm:text-lg ${isGiven ? "text-primary" : "text-accent-strong"} ${isConflict ? "!text-destructive" : ""}`}
                >
                  {value}
                </span>
              ) : cellNotes.length > 0 ? (
                <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-0.5">
                  {Array.from({ length: 9 }, (_, n) => n + 1).map((d) => (
                    <span key={d} className="flex items-center justify-center font-mono text-[7px] text-muted-foreground sm:text-[8px]">
                      {cellNotes.includes(d) ? d : ""}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isPeerOf(a: number, b: number): boolean {
  const ra = Math.floor(a / 9);
  const ca = a % 9;
  const rb = Math.floor(b / 9);
  const cb = b % 9;
  const ba = Math.floor(ra / 3) * 3 + Math.floor(ca / 3);
  const bb = Math.floor(rb / 3) * 3 + Math.floor(cb / 3);
  return ra === rb || ca === cb || ba === bb;
}
