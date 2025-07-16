console.log("ui.js is loading...");

import {
  initializeGame,
  getBoardState,
  getCurrentPlayer,
  getLegalMovesForPiece,
  getGameStatus,
  resetGame,
  makeMove,
  promotePawn,
  getLastMove,
  getCastlingStatus,
  getCastlingInfo
} from './game.js';

import { buildInfluenceMap, getAllKnightInfluence, isWhitePiece } from './engine.js';

import {
  createBoard,
  handleClick
} from './uiHandlers.js';


import { updateBoard } from './uiBoard.js';

import {
  renderPawnInfluence,
  renderKnightInfluence,
  renderBishopInfluence,
  renderRookInfluence,
  renderQueenInfluence,
  renderKingInfluence
} from './influenceRenderer.js';

// DOM references
const boardEl = document.getElementById("board");
const turnIndicator = document.getElementById("turn-indicator");
const gameStatusDiv = document.getElementById("gameStatus");
const promotionModal = document.getElementById("promotionModal");
const promotionButtons = promotionModal.querySelectorAll("button");
const lastMove = getLastMove();
const influenceStyles = {
  white: {
    stroke: "#00bcd4",
    fill: "#ccf2f9"
  },
  black: {
    stroke: "#8B0000",
    fill: "#f5cccc"
  }
};

let selectedSquare = null;


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


function handleFirstClick(row, col, piece, board, player) {
  if (!piece) {
    console.log("⬜️ Clicked empty square with no piece selected");
    return;
  }

  const isWhite = piece === piece.toUpperCase();
  const isPlayersPiece = (player === "white" && isWhite) || (player === "black" && !isWhite);

  if (!isPlayersPiece) {
    console.log("🚫 Clicked opponent's piece");
    return;
  }

  selectedSquare = { row, col };
  const legalMoves = getLegalMovesForPiece(
    row,
    col,
    board,
    player,
    getLastMove(),
    getCastlingInfo()
  );

  highlightMoves(legalMoves);
  console.log("✅ Selected square:", selectedSquare, "Legal moves:", legalMoves);
}

function handleSecondClick(row, col, board, player) {
  const from = selectedSquare;
  const legalMoves = getLegalMovesForPiece(
    from.row,
    from.col,
    board,
    getCurrentPlayer(),
    getLastMove(),
    getCastlingInfo()
  );

  // Prefer enPassant moves if any target the same destination
  const matchingMoves = legalMoves.filter(m => m.row === row && m.col === col);
  const move = matchingMoves.sort((a, b) => (b.enPassant === true) - (a.enPassant === true))[0];

  if (!move) {
    console.log("⛔ Invalid move attempt or move not found in legal moves");
    resetSelection();
    return;
  }

  const to = { row, col };
  console.log("📦 Making move with metadata:", move);
  console.log("↪️ From:", from, "To:", to);

  const result = makeMove(from, to, move);

  if (result?.requiresPromotion) {
    console.log("🛑 Promotion required");
    showPromotionModal(player === "white");
    return;
  }

  updateBoard();
  resetSelection();
}

function resetSelection() {
  selectedSquare = null;
  clearHighlights();
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

function maybeMakeBotMove() {
  const currentPlayer = getCurrentPlayer();
  if (currentPlayer !== "black") return;

  // Small delay for realism
  setTimeout(() => {
    const board = getBoardState();
    let legalMoves = [];

    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = board[fromRow][fromCol];
        if (!piece || piece !== piece.toLowerCase()) continue; // only black pieces

        const from = { row: fromRow, col: fromCol };
        let moves = [];
        try {
          moves = getLegalMovesForPiece(
            fromRow,
            fromCol,
            board,
            currentPlayer,
            getLastMove(),
            getCastlingInfo()
          ) || [];
        } catch (err) {
          console.warn("Bot move skipped due to error:", err);
          moves = [];
        }

        for (const move of moves) {
          legalMoves.push({ from, to: { row: move.row, col: move.col }, meta: move });
        }
      }
    }

    if (legalMoves.length === 0) return;

    const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    makeMove(move.from, move.to, move.meta);
    updateBoard();
  }, 500); // delay in ms
}

function renderInfluenceMap(influenceMap, board, lastMove) {
  document.querySelectorAll('.influence-svg').forEach(svg => svg.remove());

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
      if (!square) continue;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "influence-svg");
      svg.setAttribute("viewBox", "0 0 60 60");
      svg.setAttribute("width", "60");
      svg.setAttribute("height", "60");

      const cell = influenceMap[row][col];
      const boardPiece = board?.[row]?.[col];

      // Highlight last move (from/to)
      if (lastMove) {
        const isFrom = lastMove.from.row === row && lastMove.from.col === col;
        const isTo = lastMove.to.row === row && lastMove.to.col === col;
        if (isFrom || isTo) {
          const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          rect.setAttribute("x", 1);
          rect.setAttribute("y", 1);
          rect.setAttribute("width", 58);
          rect.setAttribute("height", 58);
          rect.setAttribute("fill", "#f0f54b");
          rect.setAttribute("fill-opacity", ".75");
          svg.appendChild(rect);
        }
      }

      // Dynamic blended tint based on influence
      const whiteInf = cell.white?.length || 0;
      const blackInf = cell.black?.length || 0;
      const totalInf = whiteInf + blackInf;

      if (totalInf > 0) {
        let fill = "";

        if (whiteInf > 0 && blackInf === 0) {
          fill = "rgba(0, 188, 212, " + Math.min(0.1 + 0.05 * whiteInf, 0.4) + ")";
        } else if (blackInf > 0 && whiteInf === 0) {
          fill = "rgba(203, 83, 106, " + Math.min(0.1 + 0.05 * blackInf, 0.4) + ")";
        } else {
          const weightW = whiteInf / totalInf;
          const weightB = blackInf / totalInf;

          const r = Math.round(weightW * 0 + weightB * 203);
          const g = Math.round(weightW * 188 + weightB * 83);
          const b = Math.round(weightW * 212 + weightB * 106);
          const opacity = Math.min(0.1 + 0.05 * totalInf, 0.4);

          fill = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }

        const tint = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        tint.setAttribute("x", 0);
        tint.setAttribute("y", 0);
        tint.setAttribute("width", 60);
        tint.setAttribute("height", 60);
        tint.setAttribute("fill", fill);
        svg.appendChild(tint);
      }

      // Render each piece type influence
      for (const side of ["white", "black"]) {
        const color = influenceStyles[side].stroke;
        renderPawnInfluence(svg, cell, row, col, side, color);
        renderKnightInfluence(svg, cell, row, col, side, color);
        renderBishopInfluence(svg, cell, row, col, side, color, boardPiece);
        renderRookInfluence(svg, cell, row, col, side, color, boardPiece);
        renderQueenInfluence(svg, cell, row, col, side, color, boardPiece);
        renderKingInfluence(svg, cell, row, col, side, color, boardPiece);
      }

      square.appendChild(svg);
    }
  }
}




function createSvgOverlay(square) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "60");
  svg.setAttribute("height", "60");
  svg.setAttribute("viewBox", "0 0 60 60");
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.pointerEvents = "none";
  square.appendChild(svg);
  return svg;
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
 