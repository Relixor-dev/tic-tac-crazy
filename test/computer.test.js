import assert from "node:assert/strict";
import test from "node:test";
import { chooseComputerAction } from "../src/computer.js";
import { applyAction, createGame, getLegalActions } from "../src/game.js";

function makeThreatenedGame() {
  let game = createGame();
  game = applyAction(game, { type: "placeMark", index: 0 });
  game = applyAction(game, { type: "placeMark", index: 3 });
  return applyAction(game, { type: "placeMark", index: 1 });
}

test("easy computer chooses a legal move using the supplied random source", () => {
  const game = createGame();
  const action = chooseComputerAction(game, "easy", () => 0);

  assert.deepEqual(action, getLegalActions(game)[0]);
});

for (const difficulty of ["medium", "hard", "insane"]) {
  test(`${difficulty} computer blocks an immediate win`, () => {
    const game = makeThreatenedGame();
    const action = chooseComputerAction(game, difficulty, () => 0);

    assert.equal(action.index, 2);
  });
}

test("computer rejects an unknown difficulty", () => {
  assert.throws(() => chooseComputerAction(createGame(), "expert"), /Unknown computer difficulty/);
});
