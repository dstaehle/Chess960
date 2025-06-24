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

import { PIECES, buildInfluenceMap, getAllKnightInfluence, isWhitePiece } from './engine.js';

// DOM references
const boardEl = document.getElementById("board");
const turnIndicator = document.getElementById("turn-indicator");
const gameStatusDiv = document.getElementById("gameStatus");
const promotionModal = document.getElementById("promotionModal");
const promotionButtons = promotionModal.querySelectorAll("button");
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
  renderInfluenceMap(influenceMap);

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

        const pieceSpan = document.createElement("span");
        pieceSpan.className = "piece-symbol";
        pieceSpan.textContent = PIECES[pieceChar] || pieceChar;
        newSquare.appendChild(pieceSpan); // Appending AFTER SVG keeps it on top
      }
    }
  }

  maybeMakeBotMove();
  turnIndicator.textContent = `${getCurrentPlayer()}'s Turn`;
  gameStatusDiv.textContent = getGameStatus() || "";
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


function renderInfluenceMap(influenceMap) {
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

      const drawSymbol = (side, piece, index) => {
        const color = side === "white" ? "#00bcd4" : "#8B0000";
        const style = influenceStyles?.[side] || { fill: color, stroke: color };

        if (piece === 'p') {
          const sources = cell[side].filter(inf => inf.piece === 'p' && inf.from);
          for (const inf of sources) {
            const from = inf.from;
            const dx = col - from.col;
            const dy = row - from.row;

            if (Math.abs(dx) === 1 && ((side === "white" && dy === -1) || (side === "black" && dy === 1))) {
              const isRight = dx > 0;
              const line = side === "white"
                ? isRight ? [0, 60, 30, 30] : [60, 60, 30, 30]
                : isRight ? [0, 0, 30, 30] : [60, 0, 30, 30];

              const path = document.createElementNS("http://www.w3.org/2000/svg", "line");
              path.setAttribute("x1", line[0]);
              path.setAttribute("y1", line[1]);
              path.setAttribute("x2", line[2]);
              path.setAttribute("y2", line[3]);
              path.setAttribute("stroke", style.stroke);
              path.setAttribute("stroke-width", "1");
              path.setAttribute("stroke-linecap", "round");
              svg.appendChild(path);
            }
          }
        }

        if (piece === 'b') {
          const from = cell[side].find(inf => inf.piece === 'b' && inf.from)?.from;

          if (!from || (from.row !== row || from.col !== col)) {
            // Normal bishop control (not occupying the square)
            const dx = col - from.col;
            const dy = row - from.row;

            const line = dx * dy > 0 ? [5, 5, 55, 55] : [5, 55, 55, 5];
            const bishopLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            bishopLine.setAttribute("x1", line[0]);
            bishopLine.setAttribute("y1", line[1]);
            bishopLine.setAttribute("x2", line[2]);
            bishopLine.setAttribute("y2", line[3]);
            bishopLine.setAttribute("stroke", color);
            bishopLine.setAttribute("stroke-width", "2");
            bishopLine.setAttribute("stroke-linecap", "round");
            svg.appendChild(bishopLine);
          } else {
            // Bishop is on this square — draw both diagonals
            const diag1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            diag1.setAttribute("x1", 5);
            diag1.setAttribute("y1", 5);
            diag1.setAttribute("x2", 55);
            diag1.setAttribute("y2", 55);
            diag1.setAttribute("stroke", color);
            diag1.setAttribute("stroke-width", "2");
            diag1.setAttribute("stroke-linecap", "round");
            svg.appendChild(diag1);

            const diag2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            diag2.setAttribute("x1", 5);
            diag2.setAttribute("y1", 55);
            diag2.setAttribute("x2", 55);
            diag2.setAttribute("y2", 5);
            diag2.setAttribute("stroke", color);
            diag2.setAttribute("stroke-width", "2");
            diag2.setAttribute("stroke-linecap", "round");
            svg.appendChild(diag2);
          }
        }

        if (piece === 'q') {
          const positions = side === "white"
            ? [ { x: 30, y: 8 }, { x: 51, y: 30 }, { x: 30, y: 52 }, { x: 11, y: 30 } ]
            : [ { x: 8, y: 8 }, { x: 52, y: 8 }, { x: 8, y: 52 }, { x: 52, y: 52 } ];

          for (const pos of positions) {
            const inner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            inner.setAttribute("cx", pos.x);
            inner.setAttribute("cy", pos.y);
            inner.setAttribute("r", "3");
            inner.setAttribute("fill", style.fill);
            svg.appendChild(inner);

            const outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            outer.setAttribute("cx", pos.x);
            outer.setAttribute("cy", pos.y);
            outer.setAttribute("r", "4.5");
            outer.setAttribute("fill", "none");
            outer.setAttribute("stroke", style.stroke);
            outer.setAttribute("stroke-width", "1.5");
            svg.appendChild(outer);
          }
        }

        if (piece.toLowerCase() === 'n') {
          const positions = side === "white"
            ? [ { x: 30, y: 8 }, { x: 51, y: 30 }, { x: 30, y: 52 }, { x: 11, y: 30 } ]
            : [ { x: 8, y: 8 }, { x: 52, y: 8 }, { x: 8, y: 52 }, { x: 52, y: 52 } ];

          const drawCross = (cx, cy, size = 4) => {
            const h = document.createElementNS("http://www.w3.org/2000/svg", "line");
            h.setAttribute("x1", cx - size);
            h.setAttribute("x2", cx + size);
            h.setAttribute("y1", cy);
            h.setAttribute("y2", cy);
            h.setAttribute("stroke", color);
            h.setAttribute("stroke-width", "1.5");
            svg.appendChild(h);

            const v = document.createElementNS("http://www.w3.org/2000/svg", "line");
            v.setAttribute("x1", cx);
            v.setAttribute("x2", cx);
            v.setAttribute("y1", cy - size);
            v.setAttribute("y2", cy + size);
            v.setAttribute("stroke", color);
            v.setAttribute("stroke-width", "1.5");
            svg.appendChild(v);
          };

          const drawX = (cx, cy, size = 4) => {
            const d1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            d1.setAttribute("x1", cx - size);
            d1.setAttribute("y1", cy - size);
            d1.setAttribute("x2", cx + size);
            d1.setAttribute("y2", cy + size);
            d1.setAttribute("stroke", color);
            d1.setAttribute("stroke-width", "1.5");
            svg.appendChild(d1);

            const d2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            d2.setAttribute("x1", cx + size);
            d2.setAttribute("y1", cy - size);
            d2.setAttribute("x2", cx - size);
            d2.setAttribute("y2", cy + size);
            d2.setAttribute("stroke", color);
            d2.setAttribute("stroke-width", "1.5");
            svg.appendChild(d2);
          };

          for (const pos of positions) {
            side === "white" ? drawCross(pos.x, pos.y) : drawX(pos.x, pos.y);
          }
        }

        if (piece === 'r') {
          const from = cell[side].find(inf => inf.piece === 'r' && inf.from)?.from;
          if (!from) return;
          const dx = col - from.col;
          const dy = row - from.row;

          let line = null;
          if (dx === 0 && dy < 0) line = [30, 5, 30, 25];     // up
          else if (dx === 0 && dy > 0) line = [30, 55, 30, 35]; // down
          else if (dy === 0 && dx < 0) line = [5, 30, 25, 30];  // left
          else if (dy === 0 && dx > 0) line = [55, 30, 35, 30]; // right

          if (line) {
            const arrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
            arrow.setAttribute("x1", line[0]);
            arrow.setAttribute("y1", line[1]);
            arrow.setAttribute("x2", line[2]);
            arrow.setAttribute("y2", line[3]);
            arrow.setAttribute("stroke", color);
            arrow.setAttribute("stroke-width", "2");
            arrow.setAttribute("stroke-linecap", "round");
            svg.appendChild(arrow);
          }
        }

        if (piece === 'k') {
          const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          rect.setAttribute("x", 0);
          rect.setAttribute("y", 0);
          rect.setAttribute("width", 60);
          rect.setAttribute("height", 60);
          rect.setAttribute("fill", color);
          rect.setAttribute("fill-opacity", "0.2");
          svg.appendChild(rect);
        }
      };
      const orderedPieces = ['p', 'k', 'r', 'q', 'b', 'n'];

      for (const pieceType of orderedPieces) {
        cell.white
          .filter(inf => inf.piece === pieceType)
          .forEach((inf, i) => drawSymbol("white", pieceType, i));
          
        cell.black
          .filter(inf => inf.piece === pieceType)
          .forEach((inf, i) => drawSymbol("black", pieceType, i));
      }

      cell.white.forEach((inf, i) => drawSymbol("white", inf.piece, i));
      cell.black.forEach((inf, i) => drawSymbol("black", inf.piece, i));
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
 