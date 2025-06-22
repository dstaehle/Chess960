console.log("✅ ui.js is loading...");

import {
  initializeGame,
  getBoardState,
  getCurrentPlayer,
  getLegalMovesForPiece,
  getGameStatus,
  resetGame,
  makeMove,
  promotePawn,
  getLastMove
} from './game.js';

import { PIECES, getAllKnightInfluence, isWhitePiece } from './engine.js';

// DOM references
const boardEl = document.getElementById("board");
const turnIndicator = document.getElementById("turn-indicator");
const gameStatusDiv = document.getElementById("gameStatus");
const promotionModal = document.getElementById("promotionModal");
const promotionButtons = promotionModal.querySelectorAll("button");


let selectedSquare = null;

export function createBoard() {
  boardEl.innerHTML = "";

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

function applyKnightInfluence(board) {
  // Clear any old indicators first
  document.querySelectorAll(".influence-marker").forEach(el => el.remove());

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.toLowerCase() !== 'n') continue;

      const isWhite = piece === piece.toUpperCase();
      const offsets = [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2]
      ];

      for (const [dr, dc] of offsets) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r > 7 || c < 0 || c > 7) continue;

        const square = document.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
        if (!square) continue;

        const positions = isWhite
          ? ['top', 'bottom', 'left', 'right']
          : ['tl', 'tr', 'bl', 'br'];

        for (const pos of positions) {
          const marker = document.createElement("span");
          marker.classList.add(
            "influence-marker",
            `marker-${pos}`,
            isWhite ? "white-influence" : "black-influence"
          );
          marker.textContent = isWhite ? '+' : 'x';
          square.appendChild(marker);
        }
      }
    }
  }
}




function clearHighlights() {
  document.querySelectorAll('.square').forEach(sq => {
    sq.classList.remove("highlight");
  });
}

function highlightMoves(moves) {
  clearHighlights();
  for (const move of moves) {
    const selector = `.square[data-row="${move.row}"][data-col="${move.col}"]`;
    const square = boardEl.querySelector(selector);
    if (square) square.classList.add("highlight");
  }
}

function handleClick(row, col) {
  console.log("🟨 handleClick fired for square:", row, col);
  const board = getBoardState();
  const clickedPiece = board[row][col];
  const player = getCurrentPlayer();

  console.log("Piece clicked:", clickedPiece, "Current Player:", player);

  if (selectedSquare === null) {
    if (!clickedPiece) return;

    const isWhite = clickedPiece === clickedPiece.toUpperCase();
    if ((player === "white" && !isWhite) || (player === "black" && isWhite)) return;

    selectedSquare = { row, col };
    const legalMoves = getLegalMovesForPiece(clickedPiece, selectedSquare, board, getLastMove());

    highlightMoves(legalMoves);
    console.log("✅ Selected square:", selectedSquare, "Legal moves:", legalMoves);
  } else {
    const piece = board[selectedSquare.row][selectedSquare.col];
    const legalMoves = getLegalMovesForPiece(piece, selectedSquare, board, getLastMove());
    const move = legalMoves.find(m => m.row === row && m.col === col);

    if (move) {
      const result = makeMove(selectedSquare, { row, col });

      if (result?.requiresPromotion) {
        console.log("🛑 Promotion required");
        showPromotionModal(player === "white");
        return;
      }

      updateBoard();
    } else {
      console.log("⛔ Invalid move attempt or move not found in legal moves");
    }

    selectedSquare = null;
    clearHighlights();
  }
}





function showPromotionModal(isWhite) {
  promotionModal.setAttribute('aria-hidden', 'false');
  promotionModal.style.display = 'block';

  promotionButtons.forEach(btn => {
    btn.onclick = () => {
      const selected = btn.dataset.piece;
      promotePawn(selected);
      promotionModal.setAttribute('aria-hidden', 'true');
      promotionModal.style.display = 'none';
      updateBoard();
    };
  });
}





export function updateBoard() {
  const board = getBoardState();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const selector = `.square[data-row="${row}"][data-col="${col}"]`;
      const square = boardEl.querySelector(selector);
      if (!square) continue;

      // Reset visual state
      square.textContent = "";
      square.classList.remove(
        "white-piece", "black-piece", "highlight",
        "knight-influence", "influence-tl", "influence-tr",
        "influence-bl", "influence-br"
      );

      // Re-bind click handler to preserve interactivity
      square.replaceWith(square.cloneNode(true));  // Remove existing listeners
      const newSquare = boardEl.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
      if (newSquare) {
        newSquare.addEventListener("click", () => handleClick(row, col));
      }

      const pieceChar = board[row][col];
      if (pieceChar) {
        newSquare.textContent = PIECES[pieceChar] || pieceChar;
        const isWhite = pieceChar === pieceChar.toUpperCase();
        newSquare.classList.add(isWhite ? "white-piece" : "black-piece");
      }
    }
  }

  applyKnightInfluence(board);
  turnIndicator.textContent = `${getCurrentPlayer()}'s Turn`;
  gameStatusDiv.textContent = getGameStatus() || "";
}


document.getElementById("playAgainBtn")?.addEventListener("click", () => {
  resetGame();
  selectedSquare = null;
  updateBoard();
});

document.addEventListener("DOMContentLoaded", () => {
  createBoard();
  initializeGame();
  updateBoard();
});
