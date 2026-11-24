# Tic Tac Crazy

The gameplay rules live in `src/game.js` as a browser-compatible JavaScript
module, separate from the start menu and rendering code.

## Rules implemented

- The board is 3×3. Players alternate one action at a time; X goes first.
- A normal mark, an item placement, or an item activation is one action.
- Three marks in a row (horizontal, vertical, or diagonal) wins.
- Each player starts with 2 swords, 2 guns, and 1 triangle. Stock is spent
  when an item is placed. Placed items stay on the board until activated or
  removed.
- Swords can be placed in any empty cell except the center. They remove one
  occupied adjacent cell in any direction when activated.
- Guns can be placed in corners. They remove an occupied cell in the same row,
  column, or diagonal, even if another piece is between the gun and target.
- Weapon attacks can remove either player's pieces. The used weapon is removed
  as well.
- Triangles can be placed in any empty cell. Activating one consumes it, then
  randomly removes `floor(half)` of each player's remaining pieces, including
  items. (The activated triangle itself is consumed before that count.)
- A player wins as soon as their three marks form a line. The game is a draw
  when the next player has no legal action.

## Using the game module

```js
import { applyAction, createGame, getLegalActions } from "./src/game.js";

let game = createGame();
game = applyAction(game, { type: "placeMark", index: 4 });
const actionsForTheCurrentPlayer = getLegalActions(game);
```

Actions are `placeMark` with an `index`, `placeItem` with an `item` and
`index`, and `useItem` with an item's `index` and (for swords/guns) a
`targetIndex`. Board cells are `null`, `"X"`, `"O"`, or an item object such as
`{ type: "sword", owner: "X" }`. `applyAction` returns a new game state and
throws an error for an illegal action. Pass `{ random: yourRandomFunction }`
as the third argument to `applyAction` to control triangle randomness.

Run the rules tests with `npm test`.

## Running the game

Run `npm start` to serve the game at <http://localhost:5000>. In VS Code, select
**Run Tic Tac Crazy (port 5000)** in Run and Debug to start the server and open
the game in a Chrome debugging session.

Choose an action from the menu, then select a board cell. To use a sword or gun,
select **Use an item**, choose one of your items, then choose an occupied target
in range. Triangles activate as soon as selected.