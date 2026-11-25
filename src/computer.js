import { applyAction, getLegalActions } from "./game.js";

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const DIFFICULTIES = new Set(["easy", "medium", "hard", "insane"]);

export function chooseComputerAction(game, difficulty = "medium", random = Math.random) {
  if (!DIFFICULTIES.has(difficulty)) {
    throw new Error(`Unknown computer difficulty: ${difficulty}`);
  }
  if (typeof random !== "function") {
    throw new TypeError("The random option must be a function.");
  }

  const actions = getLegalActions(game);
  if (actions.length === 0) {
    throw new Error("The computer has no legal moves.");
  }
  if (difficulty === "easy") {
    return actions[randomIndex(actions.length, random)];
  }

  const player = game.currentPlayer;
  const depth = difficulty === "insane" ? 9 : difficulty === "hard" ? 3 : 0;
  let bestScore = -Infinity;
  let bestActions = [];

  for (const action of actions) {
    const next = applyAction(game, action, { random: () => 0.5 });
    let score = evaluatePosition(next.board, player);

    if (next.winner === player) {
      score += 100_000;
    } else if (next.winner) {
      score -= 100_000;
    } else {
      const opponentWins = getLegalActions(next).filter((reply) => {
        if (reply.type !== "placeMark") return false;
        return applyAction(next, reply, { random: () => 0.5 }).winner === next.currentPlayer;
      }).length;
      score -= opponentWins * 10_000;
      if (depth > 0) {
        const remainingCells = next.board.filter((cell) => cell === null).length;
        score += minimax(
          next.board,
          next.currentPlayer,
          player,
          Math.min(depth, remainingCells),
          1,
          -Infinity,
          Infinity,
        );
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestActions = [action];
    } else if (score === bestScore) {
      bestActions.push(action);
    }
  }

  return bestActions[randomIndex(bestActions.length, random)];
}

function minimax(board, currentPlayer, computerPlayer, depth, ply, alpha, beta) {
  const winner = findWinner(board);
  if (winner) return winner === computerPlayer ? 100 - ply : ply - 100;
  if (depth === 0 || !board.includes(null)) return evaluatePosition(board, computerPlayer);

  const maximizing = currentPlayer === computerPlayer;
  let bestScore = maximizing ? -Infinity : Infinity;
  for (let index = 0; index < board.length; index += 1) {
    if (board[index] !== null) continue;
    board[index] = currentPlayer;
    const score = minimax(
      board,
      currentPlayer === "X" ? "O" : "X",
      computerPlayer,
      depth - 1,
      ply + 1,
      alpha,
      beta,
    );
    board[index] = null;

    if (maximizing) {
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);
    } else {
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, bestScore);
    }
    if (beta <= alpha) break;
  }
  return bestScore;
}

function evaluatePosition(board, player) {
  const opponent = player === "X" ? "O" : "X";
  let score = 0;

  for (const [first, second, third] of WINNING_LINES) {
    const line = [board[first], board[second], board[third]];
    if (line.includes(opponent) && line.includes(player)) continue;
    if (line.some((cell) => cell !== null && cell !== player && cell !== opponent)) continue;
    const ownMarks = line.filter((cell) => cell === player).length;
    const opposingMarks = line.filter((cell) => cell === opponent).length;
    if (opposingMarks === 0) score += [0, 2, 12, 100][ownMarks];
    if (ownMarks === 0) score -= [0, 2, 12, 100][opposingMarks];
  }

  if (board[4] === player) score += 3;
  if (board[4] === opponent) score -= 3;
  return score;
}

function findWinner(board) {
  for (const [first, second, third] of WINNING_LINES) {
    const mark = board[first];
    if ((mark === "X" || mark === "O") && mark === board[second] && mark === board[third]) {
      return mark;
    }
  }
  return null;
}

function randomIndex(length, random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("The random function must return a value in [0, 1).");
  }
  return Math.floor(value * length);
}
