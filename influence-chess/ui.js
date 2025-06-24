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

  renderInfluenceMap(influenceMap);
  turnIndicator.textContent = `${getCurrentPlayer()}'s Turn`;
  gameStatusDiv.textContent = getGameStatus() || "";
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

        if (piece.toLowerCase() === 'n') {
          const positions = side === "white"
            ? [ // White knight '+' markers
                { x: 30, y: 10 }, { x: 50, y: 30 }, { x: 30, y: 54 }, { x: 10, y: 30 }
              ]
            : [ // Black knight '×' markers
                { x: 4, y: 10 }, { x: 46, y: 10 }, { x: 4, y: 54 }, { x: 46, y: 54 }
              ];

          const symbol = side === "white" ? "+" : "×";
          for (const pos of positions) {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", pos.x);
            text.setAttribute("y", pos.y);
            text.setAttribute("fill", color);
            text.setAttribute("font-size", "12");
            text.textContent = symbol;
            svg.appendChild(text);
          }
        }

        if (piece === 'p') {
        const lines = side === "white"
          ? [
              [20, 55, 40, 55], // full-width line at bottom edge of controlled square
              [20, 55, 40, 55]
            ]
          : [
              [20, 5, 40, 5],   // full-width line at top edge of controlled square
              [20, 5, 40, 5]
            ];

        for (const [x1, y1, x2, y2] of lines) {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", x1);
          line.setAttribute("y1", y1);
          line.setAttribute("x2", x2);
          line.setAttribute("y2", y2);
          line.setAttribute("stroke", color);
          line.setAttribute("stroke-width", "2");
          line.setAttribute("stroke-linecap", "round");
          svg.appendChild(line);
        }
      }

      if (piece === 'b') {
        const from = cell[side].find(inf => inf.piece === 'b' && inf.from)?.from;
        if (!from) return;

        const dx = col - from.col;
        const dy = row - from.row;

        // Determine slash direction based on relative position
        let line;
        if (dx * dy > 0) {
          // same sign: draw top-left to bottom-right
          line = [5, 5, 55, 55];
        } else {
          // opposite sign: draw bottom-left to top-right
          line = [5, 55, 55, 5];
        }

        const bishopLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        bishopLine.setAttribute("x1", line[0]);
        bishopLine.setAttribute("y1", line[1]);
        bishopLine.setAttribute("x2", line[2]);
        bishopLine.setAttribute("y2", line[3]);
        bishopLine.setAttribute("stroke", color);
        bishopLine.setAttribute("stroke-width", "2");
        bishopLine.setAttribute("stroke-linecap", "round");
        svg.appendChild(bishopLine);
      }

      if (piece === 'q') {
        const positions = side === "white"
          ? [ { x: 30, y: 10 }, { x: 50, y: 30 }, { x: 30, y: 54 }, { x: 10, y: 30 } ] // centered on sides
          : [ { x: 4, y: 10 }, { x: 46, y: 10 }, { x: 4, y: 54 }, { x: 46, y: 54 } ];   // corners

        for (const pos of positions) {
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", pos.x);
          circle.setAttribute("cy", pos.y);
          circle.setAttribute("r", "3");
          circle.setAttribute("fill", color);
          svg.appendChild(circle);
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
        rect.setAttribute("fill", side === "white" ? "#00bcd4" : "#8B0000");
        rect.setAttribute("fill-opacity", "0.3");
        svg.appendChild(rect);
      }



      };

      cell.white.forEach((inf, i) => drawSymbol("white", inf.piece, i));
      cell.black.forEach((inf, i) => drawSymbol("black", inf.piece, i));

      square.appendChild(svg);
    }
  }
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
