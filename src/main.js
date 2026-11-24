import { applyAction, createGame, getLegalActions } from "./game.js";

const boardElement = document.querySelector("#board");
const statusElement = document.querySelector("#status");
const messageElement = document.querySelector("#message");
const actionElement = document.querySelector("#action");
const helpElement = document.querySelector("#help");
const inventoryXElement = document.querySelector("#inventory-X");
const inventoryOElement = document.querySelector("#inventory-O");

let game = createGame();
let selectedItemIndex = null;

document.querySelector("#restart").addEventListener("click", () => {
  game = createGame();
  selectedItemIndex = null;
  messageElement.textContent = "";
  render();
});

actionElement.addEventListener("change", () => {
  selectedItemIndex = null;
  messageElement.textContent = "";
  render();
});

function render() {
  const actions = getLegalActions(game);
  const finished = Boolean(game.winner || game.draw);
  statusElement.textContent = game.winner
    ? `Player ${game.winner} wins!`
    : game.draw
      ? "It's a draw!"
      : `Player ${game.currentPlayer}'s turn`;
  boardElement.replaceChildren();

  game.board.forEach((cell, index) => {
    const button = document.createElement("button");
    const selected = index === selectedItemIndex;
    button.className = "cell";
    if (selected) button.classList.add("selected");
    if (cell === "X" || cell === "O") {
      button.textContent = cell;
      button.classList.add(`mark-${cell.toLowerCase()}`);
    } else if (cell) {
      button.textContent = itemSymbol(cell.type);
      button.classList.add("item", `item-${cell.type}`);
    }

    const description = cell === null
      ? "empty"
      : typeof cell === "string"
        ? `player ${cell}'s mark`
        : `player ${cell.owner}'s ${cell.type}`;
    button.setAttribute("aria-label", `Cell ${index + 1}, ${description}`);
    button.disabled = finished;
    button.addEventListener("click", () => handleCellClick(index));
    boardElement.append(button);
  });

  actionElement.disabled = finished;
  helpElement.textContent = getHelpText();
  inventoryXElement.textContent = inventoryText("X");
  inventoryOElement.textContent = inventoryText("O");
  inventoryXElement.classList.toggle("active-player", game.currentPlayer === "X");
  inventoryOElement.classList.toggle("active-player", game.currentPlayer === "O");
}

function handleCellClick(index) {
  if (game.winner || game.draw) return;

  const action = actionElement.value;
  const actions = getLegalActions(game);
  try {
    if (action === "placeMark") {
      applyLegalAction(actions.find((candidate) =>
        candidate.type === "placeMark" && candidate.index === index
      ));
      return;
    }

    if (action !== "useItem") {
      applyLegalAction(actions.find((candidate) =>
        candidate.type === "placeItem" &&
        candidate.item === action &&
        candidate.index === index
      ));
      return;
    }

    if (selectedItemIndex === null) {
      const item = game.board[index];
      if (!item || typeof item !== "object" || item.owner !== game.currentPlayer) {
        throw new Error("Choose one of your items first.");
      }
      if (item.type === "triangle") {
        applyLegalAction(actions.find((candidate) =>
          candidate.type === "useItem" && candidate.index === index
        ));
        return;
      }
      const hasTarget = actions.some((candidate) =>
        candidate.type === "useItem" && candidate.index === index
      );
      if (!hasTarget) throw new Error("That item has no valid targets.");
      selectedItemIndex = index;
      messageElement.textContent = "Now choose an occupied target.";
      render();
      return;
    }

    applyLegalAction(actions.find((candidate) =>
      candidate.type === "useItem" &&
      candidate.index === selectedItemIndex &&
      candidate.targetIndex === index
    ));
  } catch (error) {
    messageElement.textContent = error.message;
  }
}

function applyLegalAction(action) {
  if (!action) throw new Error("That action isn't legal for this cell.");
  game = applyAction(game, action);
  selectedItemIndex = null;
  messageElement.textContent = "";
  render();
}

function itemSymbol(type) {
  return { sword: "⚔", gun: "✦", triangle: "△" }[type];
}

function inventoryText(player) {
  const inventory = game.inventory[player];
  return `Player ${player}: ${inventory.sword} swords · ${inventory.gun} guns · ${inventory.triangle} triangles`;
}

function getHelpText() {
  if (game.winner || game.draw) return "Start a new game to play again.";
  if (actionElement.value === "useItem") {
    return selectedItemIndex === null
      ? "Choose one of your items. Triangles activate immediately."
      : "Choose an occupied cell in range to remove it.";
  }
  return actionElement.value === "placeMark"
    ? "Choose an empty cell."
    : "Choose an empty cell where this item can be placed.";
}

render();
