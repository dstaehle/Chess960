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
  getLastMove,
  getCastlingStatus
} from './game.js';

import { buildInfluenceMap, getAllKnightInfluence, isWhitePiece } from './engine.js';

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
    stroke: "#00bcd4",  // Outer ring color
    fill: "#ccf2f9"     // Inner fill color
  },
  black: {
    stroke: "#8B0000",
    fill: "#f5cccc"
  }
};




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
      // 🆕 Pass full move metadata for things like castling
      const result = makeMove(selectedSquare, { row, col }, move);

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
  const influenceMap = buildInfluenceMap(board);

  // Step 1: Render influence SVGs FIRST
  renderInfluenceMap(influenceMap,board);

  // Step 2: Then apply piece symbols and handlers
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const selector = `.square[data-row="${row}"][data-col="${col}"]`;
      const square = boardEl.querySelector(selector);
      if (!square) continue;

      // Remove non-SVG children only
      [...square.childNodes].forEach(child => {
        if (!(child instanceof SVGElement)) child.remove();
      });

      square.classList.remove(
        "white-piece", "black-piece", "highlight",
        "knight-influence", "influence-tl", "influence-tr",
        "influence-bl", "influence-br"
      );

      const newSquare = square.cloneNode(true);
      newSquare.addEventListener("click", () => handleClick(row, col));
      square.replaceWith(newSquare);

      const pieceChar = board[row][col];
      if (pieceChar) {
        const isWhite = pieceChar === pieceChar.toUpperCase();
        newSquare.classList.add(isWhite ? "white-piece" : "black-piece");

        const pieceImg = document.createElement("img");
        pieceImg.className = "piece-svg";
        const pieceCode = (isWhite ? 'w' : 'b') + pieceChar.toUpperCase();
        pieceImg.src = `pieces/alpha/${pieceCode}.svg`;
        pieceImg.alt = pieceChar;
        newSquare.appendChild(pieceImg);
      }
    }
  }


  maybeMakeBotMove();
  turnIndicator.textContent = `${getCurrentPlayer()}'s Turn`;
  gameStatusDiv.textContent = getGameStatus() || "";

  const lastMove = getLastMove();
  console.log("📌 Last move:", lastMove);
  renderInfluenceMap(influenceMap, board, lastMove);
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
          moves = getLegalMovesForPiece(piece, from, board, getLastMove()) || [];
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

document.getElementById("castlingStatus").textContent = getCastlingStatus();
 