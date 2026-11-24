export const BOARD_SIZE = 3;
export const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;
export const ITEMS = Object.freeze(["sword", "gun", "triangle"]);

const PLAYERS = Object.freeze(["X", "O"]);
const INITIAL_INVENTORY = Object.freeze({
  sword: 2,
  gun: 2,
  triangle: 1,
});
const GUN_CORNERS = new Set([0, 2, 6, 8]);

export function createGame() {
  return {
    board: Array(BOARD_CELLS).fill(null),
    currentPlayer: "X",
    inventory: {
      X: { ...INITIAL_INVENTORY },
      O: { ...INITIAL_INVENTORY },
    },
    winner: null,
    draw: false,
  };
}

export function getLegalActions(game) {
  if (game.winner || game.draw) {
    return [];
  }

  const player = game.currentPlayer;
  const actions = [];

  for (let index = 0; index < BOARD_CELLS; index += 1) {
    if (game.board[index] === null) {
      actions.push({ type: "placeMark", index });

      for (const item of ITEMS) {
        if (
          game.inventory[player][item] > 0 &&
          canPlaceItem(item, index)
        ) {
          actions.push({ type: "placeItem", item, index });
        }
      }
    }

    const piece = game.board[index];
    if (!isOwnedItem(piece, player)) {
      continue;
    }

    if (piece.type === "triangle") {
      actions.push({ type: "useItem", index });
      continue;
    }

    for (let targetIndex = 0; targetIndex < BOARD_CELLS; targetIndex += 1) {
      if (
        game.board[targetIndex] !== null &&
        canHit(piece.type, index, targetIndex)
      ) {
        actions.push({ type: "useItem", index, targetIndex });
      }
    }
  }

  return actions;
}

export function applyAction(game, action, options = {}) {
  if (game.winner || game.draw) {
    throw new Error("The game is already over.");
  }
  if (!action || typeof action !== "object") {
    throw new TypeError("An action object is required.");
  }

  const next = {
    ...game,
    board: game.board.map((cell) =>
      cell && typeof cell === "object" ? { ...cell } : cell,
    ),
    inventory: {
      X: { ...game.inventory.X },
      O: { ...game.inventory.O },
    },
  };
  const player = game.currentPlayer;

  switch (action.type) {
    case "placeMark":
      requireEmptyCell(next.board, action.index);
      next.board[action.index] = player;
      break;

    case "placeItem":
      requireEmptyCell(next.board, action.index);
      if (!ITEMS.includes(action.item)) {
        throw new Error("Unknown item.");
      }
      if (!canPlaceItem(action.item, action.index)) {
        throw new Error(`A ${action.item} cannot be placed on that cell.`);
      }
      if (next.inventory[player][action.item] === 0) {
        throw new Error(`Player ${player} has no ${action.item}s remaining.`);
      }
      next.inventory[player][action.item] -= 1;
      next.board[action.index] = { type: action.item, owner: player };
      break;

    case "useItem": {
      requireCellIndex(action.index);
      const item = next.board[action.index];
      if (!isOwnedItem(item, player)) {
        throw new Error("You can only use an item you own.");
      }

      if (item.type === "triangle") {
        next.board[action.index] = null;
        removeRandomHalfForEachPlayer(next.board, getRandom(options));
        break;
      }

      requireCellIndex(action.targetIndex);
      if (
        next.board[action.targetIndex] === null ||
        !canHit(item.type, action.index, action.targetIndex)
      ) {
        throw new Error("That item cannot hit the selected cell.");
      }
      next.board[action.index] = null;
      next.board[action.targetIndex] = null;
      break;
    }

    default:
      throw new Error("Unknown action.");
  }

  next.currentPlayer = player === "X" ? "O" : "X";
  next.winner = findWinner(next.board);
  next.draw = next.winner === null && getLegalActions(next).length === 0;
  return next;
}

function canPlaceItem(item, index) {
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_CELLS) {
    return false;
  }
  if (item === "sword") {
    return index !== 4;
  }
  if (item === "gun") {
    return GUN_CORNERS.has(index);
  }
  return item === "triangle";
}

function canHit(item, originIndex, targetIndex) {
  if (
    !Number.isInteger(targetIndex) ||
    targetIndex < 0 ||
    targetIndex >= BOARD_CELLS ||
    targetIndex === originIndex
  ) {
    return false;
  }

  const rowDistance = Math.abs(
    Math.floor(originIndex / BOARD_SIZE) -
      Math.floor(targetIndex / BOARD_SIZE),
  );
  const columnDistance = Math.abs(
    (originIndex % BOARD_SIZE) - (targetIndex % BOARD_SIZE),
  );

  if (item === "sword") {
    return rowDistance <= 1 && columnDistance <= 1;
  }
  if (item === "gun" && GUN_CORNERS.has(originIndex)) {
    return (
      rowDistance === 0 ||
      columnDistance === 0 ||
      rowDistance === columnDistance
    );
  }
  return false;
}

function isOwnedItem(cell, player) {
  return (
    cell !== null &&
    typeof cell === "object" &&
    cell.owner === player &&
    ITEMS.includes(cell.type)
  );
}

function requireCellIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index >= BOARD_CELLS) {
    throw new RangeError(`Cell index must be between 0 and ${BOARD_CELLS - 1}.`);
  }
}

function requireEmptyCell(board, index) {
  requireCellIndex(index);
  if (board[index] !== null) {
    throw new Error("That cell is already occupied.");
  }
}

function getRandom(options) {
  const random = options.random ?? Math.random;
  if (typeof random !== "function") {
    throw new TypeError("The random option must be a function.");
  }
  return random;
}

function removeRandomHalfForEachPlayer(board, random) {
  for (const player of PLAYERS) {
    const ownedIndexes = [];
    for (let index = 0; index < board.length; index += 1) {
      const cell = board[index];
      if (
        cell === player ||
        (cell && typeof cell === "object" && cell.owner === player)
      ) {
        ownedIndexes.push(index);
      }
    }

    const removeCount = Math.floor(ownedIndexes.length / 2);
    for (let index = 0; index < removeCount; index += 1) {
      const remaining = ownedIndexes.length - index;
      const value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError("The random function must return a value in [0, 1).");
      }
      const selected = index + Math.floor(value * remaining);
      [ownedIndexes[index], ownedIndexes[selected]] = [
        ownedIndexes[selected],
        ownedIndexes[index],
      ];
      board[ownedIndexes[index]] = null;
    }
  }
}

function findWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [first, second, third] of lines) {
    const mark = board[first];
    if (
      (mark === "X" || mark === "O") &&
      mark === board[second] &&
      mark === board[third]
    ) {
      return mark;
    }
  }
  return null;
}

if (typeof window === 'undefined') {
  const http = require('http');
  const fs = require('fs');
  const path = require('path');

  http.createServer((req, res) => {
    let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
        res.end(content);
      }
    });
  }).listen(5000, () => {
    console.log('Game running at http://localhost:5000');
  });
}