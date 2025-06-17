let boardState = Array.from({ length: 8 }, () => Array(8).fill(null));
let selectedSquare = null;



// Unicode symbols for pieces
const PIECES = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
  'p': '♟', 'P': '♙'
};


// app.js
console.log("Influence Chess is loading...");

const board = document.getElementById("board");

// Generate random Chess960 back rank
const whiteBackRank = generateChess960BackRank();
const blackBackRank = whiteBackRank.map(p => p.toUpperCase()); // white is uppercase

for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    const square = document.createElement("div");
    square.classList.add("square");
    square.dataset.row = row;
    square.dataset.col = col;

    const isLight = (row + col) % 2 === 0;
    square.style.backgroundColor = isLight ? "#eee" : "#555";
    square.style.display = "flex";
    square.style.justifyContent = "center";
    square.style.alignItems = "center";
    square.style.fontSize = "36px";
    square.style.color = isLight ? "#000" : "#fff";

    let piece = null;
    if (row === 0) piece = blackBackRank[col];     // Black back rank
    else if (row === 1) piece = 'P';                // Black pawns
    else if (row === 6) piece = 'p';                // White pawns
    else if (row === 7) piece = whiteBackRank[col]; // White back rank

    boardState[row][col] = piece;
    if (piece) square.textContent = PIECES[piece];

    square.addEventListener("click", handleSquareClick);
    board.appendChild(square);
  }
}



function generateChess960BackRank() {
  const pieces = Array(8).fill(null);
  let positions = [];

  // 1. Place bishops on opposite colors
  const darkSquares = [0, 2, 4, 6];
  const lightSquares = [1, 3, 5, 7];
  const b1 = darkSquares[Math.floor(Math.random() * darkSquares.length)];
  const b2 = lightSquares[Math.floor(Math.random() * lightSquares.length)];
  pieces[b1] = 'b';
  pieces[b2] = 'b';

  // 2. Place queen
  do {
    const q = Math.floor(Math.random() * 8);
    if (!pieces[q]) {
      pieces[q] = 'q';
      break;
    }
  } while (true);

  // 3. Place knights
  let knightsPlaced = 0;
  while (knightsPlaced < 2) {
    const i = Math.floor(Math.random() * 8);
    if (!pieces[i]) {
      pieces[i] = 'n';
      knightsPlaced++;
    }
  }

  // 4. Place rooks and king (RKR order with king between rooks)
  const empty = pieces.map((p, i) => p === null ? i : -1).filter(i => i !== -1);
  empty.sort((a, b) => a - b);
  const [r1, k, r2] = [empty[0], empty[1], empty[2]];
  pieces[r1] = 'r';
  pieces[k] = 'k';
  pieces[r2] = 'r';

  return pieces;
}

function updateBoard() {
  const squares = document.querySelectorAll(".square");
  squares.forEach(sq => {
    const r = parseInt(sq.dataset.row);
    const c = parseInt(sq.dataset.col);
    const piece = boardState[r][c];
    sq.textContent = piece ? PIECES[piece] : "";
    sq.style.outline = "";
  });
}

function handleSquareClick(e) {
  const square = e.currentTarget;
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const piece = boardState[row][col];

  if (selectedSquare === null) {
    if (!piece) return; // Ignore empty square
    selectedSquare = { row, col };
    square.style.outline = "2px solid red";
  } else {
    const from = selectedSquare;
    const to = { row, col };

    // Move piece in board state
    boardState[to.row][to.col] = boardState[from.row][from.col];
    boardState[from.row][from.col] = null;

    updateBoard();
    selectedSquare = null;
  }
}

