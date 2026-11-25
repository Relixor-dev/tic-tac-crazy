import { chooseComputerAction } from "./computer.js";
import { applyAction, createGame, getLegalActions } from "./game.js";

const boardElement = document.querySelector("#board");
const statusElement = document.querySelector("#status");
const messageElement = document.querySelector("#message");
const helpElement = document.querySelector("#help");
const inventoryXElement = document.querySelector("#inventory-X");
const inventoryOElement = document.querySelector("#inventory-O");
const difficultyControls = document.querySelector("#difficulty-controls");
const itemModeButtons = [...document.querySelectorAll("[data-item-mode]")];
const gameModeButtons = [...document.querySelectorAll("[data-game-mode]")];
const difficultyButtons = [...document.querySelectorAll("[data-difficulty]")];

let game = createGame();
let selectedItemIndex = null;
let selectedMode = "mark";
let gameMode = "players";
let difficulty = "easy";

for (const iconElement of document.querySelectorAll(".mode-icon")) {
  iconElement.append(createItemIcon(iconElement.parentElement.dataset.itemMode));
}

document.querySelector("#restart").addEventListener("click", () => {
  game = createGame();
  selectedItemIndex = null;
  messageElement.textContent = "";
  render();
});

for (const button of itemModeButtons) {
  button.addEventListener("click", () => {
    const clickedMode = button.dataset.itemMode;
    selectedMode = selectedMode === clickedMode ? "mark" : clickedMode;
    selectedItemIndex = null;
    messageElement.textContent = "";
    updatePressedButtons(itemModeButtons, "itemMode", selectedMode);
    render();
  });
}

for (const button of gameModeButtons) {
  button.addEventListener("click", () => {
    gameMode = button.dataset.gameMode;
    game = createGame();
    selectedItemIndex = null;
    messageElement.textContent = "";
    difficultyControls.hidden = gameMode !== "computer";
    updatePressedButtons(gameModeButtons, "gameMode", gameMode);
    render();
  });
}

for (const button of difficultyButtons) {
  button.addEventListener("click", () => {
    difficulty = button.dataset.difficulty;
    updatePressedButtons(difficultyButtons, "difficulty", difficulty);
    if (gameMode === "computer" && game.currentPlayer === "O" && !isFinished()) {
      makeComputerMove();
    }
  });
}

function updatePressedButtons(buttons, dataKey, selectedValue) {
  for (const button of buttons) {
    const selected = button.dataset[dataKey] === selectedValue;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
}

function render() {
  const finished = isFinished();
  statusElement.textContent = game.winner
    ? gameMode === "computer" && game.winner === "O"
      ? "Computer wins!"
      : `Player ${game.winner} wins!`
    : game.draw
      ? "It's a draw!"
      : gameMode === "computer" && game.currentPlayer === "O"
        ? `Computer's turn (${difficulty})`
        : gameMode === "computer"
          ? "Your turn (X)"
          : `Player ${game.currentPlayer}'s turn`;
  boardElement.replaceChildren();

  game.board.forEach((cell, index) => {
    const button = document.createElement("button");
    button.className = "cell";
    if (index === selectedItemIndex) button.classList.add("selected");
    if (cell === "X" || cell === "O") {
      button.textContent = cell;
      button.classList.add(`mark-${cell.toLowerCase()}`);
    } else if (cell) {
      button.classList.add("item", `item-${cell.type}`);
      button.append(createItemIcon(cell.type));
    }

    const description = cell === null
      ? "empty"
      : typeof cell === "string"
        ? `player ${cell}'s mark`
        : `player ${cell.owner}'s ${cell.type}`;
    button.setAttribute("aria-label", `Cell ${index + 1}, ${description}`);
    button.disabled = finished || (gameMode === "computer" && game.currentPlayer === "O");
    button.addEventListener("click", () => handleCellClick(index));
    boardElement.append(button);
  });

  helpElement.textContent = getHelpText();
  inventoryXElement.textContent = inventoryText("X");
  inventoryOElement.textContent = inventoryText("O");
  inventoryXElement.classList.toggle("active-player", game.currentPlayer === "X");
  inventoryOElement.classList.toggle("active-player", game.currentPlayer === "O");
}

function handleCellClick(index) {
  if (isFinished() || (gameMode === "computer" && game.currentPlayer === "O")) return;

  const actions = getLegalActions(game);
  try {
    if (selectedItemIndex !== null) {
      applyLegalAction(actions.find((candidate) =>
        candidate.type === "useItem" &&
        candidate.index === selectedItemIndex &&
        candidate.targetIndex === index
      ));
      return;
    }

    const cell = game.board[index];
    if (cell && typeof cell === "object" && cell.owner === game.currentPlayer) {
      if (cell.type === "triangle") {
        applyLegalAction(actions.find((candidate) =>
          candidate.type === "useItem" && candidate.index === index
        ));
        return;
      }
      if (actions.some((candidate) =>
        candidate.type === "useItem" && candidate.index === index
      )) {
        selectedItemIndex = index;
        messageElement.textContent = "Now choose an occupied target.";
        render();
        return;
      }
    }

    if (selectedMode === "mark") {
      applyLegalAction(actions.find((candidate) =>
        candidate.type === "placeMark" && candidate.index === index
      ));
      return;
    }

    applyLegalAction(actions.find((candidate) =>
      candidate.type === "placeItem" &&
      candidate.item === selectedMode &&
      candidate.index === index
    ));
  } catch (error) {
    messageElement.textContent = error.message;
  }
}

function applyLegalAction(action) {
  if (!action) throw new Error("That move isn't legal for this cell.");
  game = applyAction(game, action);
  selectedItemIndex = null;
  messageElement.textContent = "";
  render();
  if (gameMode === "computer" && game.currentPlayer === "O" && !isFinished()) {
    makeComputerMove();
  }
}

function makeComputerMove() {
  const action = chooseComputerAction(game, difficulty);
  game = applyAction(game, action);
  selectedItemIndex = null;
  messageElement.textContent = "";
  render();
}

function createItemIcon(type) {
  const icon = document.createElement("span");
  icon.className = "icon";
  icon.setAttribute("aria-hidden", "true");
  const images = {
    sword: "⚔️",
    gun: "🔫",
    triangle: "🔺",
  };
  icon.textContent = images[type];
  if (type === "triangle") icon.classList.add("icon-triangle");
  return icon;
}

function inventoryText(player) {
  const inventory = game.inventory[player];
  return `Player ${player}: ${inventory.sword} swords · ${inventory.gun} guns · ${inventory.triangle} Illuminati`;
}

function getHelpText() {
  if (isFinished()) return "Start a new game to play again.";
  if (selectedItemIndex !== null) return "Choose an occupied cell in range to remove it.";
  if (selectedMode === "mark") return "Choose an empty cell for your X or O. Tap an owned weapon to use it.";
  return selectedMode === "triangle"
    ? "Choose an empty cell for your pyramid. Tap it later to activate."
    : `Choose an empty cell for your ${selectedMode}. Tap an owned ${selectedMode} to use it.`;
}

function isFinished() {
  return Boolean(game.winner || game.draw);
}

render();
