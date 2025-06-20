import {
  initializeGame,
  getBoardState,
  getCurrentPlayer,
  selectSquare,
  getLegalMoves,
  movePiece,
  isGameOver,
  getGameStatus,
  resetGame
} from './game.js';

import { PIECES } from './engine.js';  // Assuming you export PIECES from engine.js

// DOM references
const boardEl = document.getElementById("board");
const turnIndicator = document.getElementById("turn-indicator");
const gameStatusDiv = document.getElementById("gameStatus"); // Confirm your HTML ID here

let selected = null;

/**
 * Creates the 64 square divs inside the board container.
 * Call this once on page load if you want to separate DOM creation from updating pieces.
 */
export function createBoard() {
  boardEl.innerHTML = ""; // Clear any existing content

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.className = `square ${(row + col) % 2 === 0 ? "light-square" : "dark-square"}`;
      square.dataset.row = row;
      square.dataset.col = col;

      square.addEventListener("click", () => handleClick(row, col));
      boardEl.appendChild(square);
    }
  }
}

/**
 * Updates pieces on the board and UI elements like turn indicator and game status.
 * Call this whenever the game state changes.
 */
export function updateBoard() {
  const board = getBoardState();

  // Update pieces for each square
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const selector = `.square[data-row="${row}"][data-col="${col}"]`;
      const square = boardEl.querySelector(selector);
      if (!square) continue;

      const pieceChar = board[row][col];
      square.textContent = "";
      square.classList.remove("white-piece", "black-piece");

      if (pieceChar) {
        square.textContent = PIECES[pieceChar] || pieceChar; // Show symbol or fallback
        const isWhite = pieceChar === pieceChar.toUpperCase();
        square.classList.add(isWhite ? "white-piece" : "black-piece");
      }

      // Remove previous highlight classes
      square.classList.remove("highlight");
    }
  }

  // Show current turn
  turnIndicator.textContent = `${getCurrentPlayer()}'s Turn`;

  // Show game status messages
  const status = getGameStatus();
  gameStatusDiv.textContent = status || "";
}

function clearHighlights() {
  const highlighted = boardEl.querySelectorAll(".highlight");
  highlighted.forEach(sq => sq.classList.remove("highlight"));
}

function handleClick(row, col) {
  if (isGameOver()) return;

  if (!selected) {
    if (selectSquare(row, col)) {
      selected = { row, col };
      highlightMoves();
    }
  } else {
    if (movePiece(selected, { row, col })) {
      selected = null;
      updateBoard();
    } else {
      selected = null;
      updateBoard();
    }
  }
}

function highlightMoves() {
  clearHighlights();
  const moves = getLegalMoves();
  for (const move of moves) {
    const selector = `.square[data-row="${move.row}"][data-col="${move.col}"]`;
    const square = document.querySelector(selector);
    if (square) square.classList.add("highlight");
  }
}

// Reset button logic
document.getElementById("playAgainBtn")?.addEventListener("click", () => {
  resetGame();
  selected = null;
  updateBoard();
});

// Initialize game and board on load
initializeGame();
createBoard();
updateBoard();
