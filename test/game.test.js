import assert from "node:assert/strict";
import test from "node:test";
import { applyAction, createGame, getLegalActions } from "../src/game.js";

function play(game, action) {
  return applyAction(game, action);
}

test("starts a 3x3 game with the stated stock for both players", () => {
  const game = createGame();

  assert.equal(game.board.length, 9);
  assert.equal(game.currentPlayer, "X");
  assert.deepEqual(game.inventory.X, { sword: 2, gun: 2, triangle: 1 });
  assert.deepEqual(game.inventory.O, { sword: 2, gun: 2, triangle: 1 });
});

test("places swords on any non-center cell and guns only in corners", () => {
  let game = createGame();

  assert.throws(
    () => applyAction(game, { type: "placeItem", item: "sword", index: 4 }),
    /cannot be placed/,
  );
  assert.throws(
    () => applyAction(game, { type: "placeItem", item: "gun", index: 1 }),
    /cannot be placed/,
  );

  game = play(game, { type: "placeItem", item: "sword", index: 0 });
  game = play(game, { type: "placeMark", index: 4 });
  assert.deepEqual(game.board[0], { type: "sword", owner: "X" });
  assert.equal(game.inventory.X.sword, 1);
});

test("a sword can hit any adjacent occupied cell, including its owner's mark", () => {
  let game = createGame();
  game = play(game, { type: "placeMark", index: 4 });
  game = play(game, { type: "placeMark", index: 8 });
  game = play(game, { type: "placeItem", item: "sword", index: 0 });
  game = play(game, { type: "placeMark", index: 2 });

  assert.ok(
    getLegalActions(game).some(
      (action) =>
        action.type === "useItem" &&
        action.index === 0 &&
        action.targetIndex === 4,
    ),
  );
  game = play(game, { type: "useItem", index: 0, targetIndex: 4 });
  assert.equal(game.board[0], null);
  assert.equal(game.board[4], null);
  assert.equal(game.board[8], "O");
});

test("a gun hits along its row, column, and diagonal, through intervening pieces", () => {
  let game = createGame();
  game = play(game, { type: "placeItem", item: "gun", index: 0 });
  game = play(game, { type: "placeMark", index: 1 });
  game = play(game, { type: "placeMark", index: 8 });
  game = play(game, { type: "placeMark", index: 4 });

  assert.ok(
    getLegalActions(game).some(
      (action) =>
        action.type === "useItem" &&
        action.index === 0 &&
        action.targetIndex === 4,
    ),
  );
  assert.ok(
    !getLegalActions(game).some(
      (action) =>
        action.type === "useItem" &&
        action.index === 0 &&
        [5, 7].includes(action.targetIndex),
    ),
  );

  game = play(game, { type: "useItem", index: 0, targetIndex: 4 });
  assert.equal(game.board[0], null);
  assert.equal(game.board[4], null);
  assert.equal(game.board[1], "O");
});

test("a triangle removes half of each player's remaining pieces and is consumed", () => {
  let game = createGame();
  game = play(game, { type: "placeMark", index: 0 });
  game = play(game, { type: "placeMark", index: 1 });
  game = play(game, { type: "placeItem", item: "triangle", index: 4 });
  game = play(game, { type: "placeItem", item: "sword", index: 2 });
  game = play(game, { type: "placeMark", index: 8 });
  game = play(game, { type: "placeMark", index: 6 });
  const randomValues = [0, 0.5];
  game = applyAction(
    game,
    { type: "useItem", index: 4 },
    { random: () => randomValues.shift() },
  );

  const countOwned = (player) =>
    game.board.filter(
      (cell) =>
        cell === player ||
        (cell !== null && typeof cell === "object" && cell.owner === player),
    ).length;

  assert.equal(countOwned("X"), 1);
  assert.equal(countOwned("O"), 2);
  assert.equal(game.board[4], null);
  assert.equal(game.board[2], null);
  assert.equal(game.inventory.X.triangle, 0);
});

test("three in a row wins and ends the game", () => {
  let game = createGame();
  game = play(game, { type: "placeMark", index: 0 });
  game = play(game, { type: "placeMark", index: 1 });
  game = play(game, { type: "placeMark", index: 4 });
  game = play(game, { type: "placeMark", index: 2 });
  game = play(game, { type: "placeMark", index: 8 });

  assert.equal(game.winner, "X");
  assert.deepEqual(getLegalActions(game), []);
  assert.throws(
    () => applyAction(game, { type: "placeMark", index: 3 }),
    /already over/,
  );
});
