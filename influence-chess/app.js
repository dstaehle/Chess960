let currentPlayer = 'white'; // 'white' or 'black'
let boardState = Array.from({ length: 8 }, () => Array(8).fill(null));
let selectedSquare = null;



// Unicode symbols for pieces
const PIECES = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
  'p': '♟', 'P': '♙'
};


//
function isWhitePiece(piece) {
  return piece && piece === piece.toUpperCase();
}

function isBlackPiece(piece) {
  return piece && piece === piece.toLowerCase();
}


// app.js
console.log("Influence Chess is loading...");

const board = document.getElementById("board");

// Generate random Chess960 back rank
const whiteBackRank = generateChess960BackRank().map(p => p.toUpperCase());
const blackBackRank = whiteBackRank.map(p => p.toLowerCase()); // black is lowercase

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
    square.classList.add(isLight ? "light-square" : "dark-square");


    let piece = null;
    if (row === 0) piece = blackBackRank[col];     // Black back rank (lowercase)
    else if (row === 1) piece = 'p';                // Black pawns (lowercase)
    else if (row === 6) piece = 'P';                // White pawns (uppercase)
    else if (row === 7) piece = whiteBackRank[col]; // White back rank (uppercase)


    boardState[row][col] = piece;
    if (piece) {
      square.textContent = PIECES[piece];
      square.classList.add(isWhitePiece(piece) ? "white-piece" : "black-piece");
    }


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
    sq.textContent = "";
    sq.classList.remove("white-piece", "black-piece");
    sq.style.outline = "";

    if (piece) {
      sq.textContent = PIECES[piece];
      sq.classList.add(isWhitePiece(piece) ? "white-piece" : "black-piece");
    }
  });

  const turnIndicator = document.getElementById("turn-indicator");
  if (turnIndicator) {
    turnIndicator.textContent = currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1) + "'s turn";
  }
}


function handleSquareClick(e) {
  const square = e.currentTarget;
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const piece = boardState[row][col];

  if (selectedSquare === null) {
    if (!piece) return;

    // Use helper functions
    if ((currentPlayer === 'white' && !isWhitePiece(piece)) ||
        (currentPlayer === 'black' && !isBlackPiece(piece))) {
      return; // Not your piece
    }

    selectedSquare = { row, col };
    square.style.outline = "2px solid red";
  } else {
    const from = selectedSquare;
    const to = { row, col };

    // Clicking same square deselects
    if (from.row === to.row && from.col === to.col) {
      selectedSquare = null;
      updateBoard();
      return;
    }

    const movingPiece = boardState[from.row][from.col];
    const targetPiece = boardState[to.row][to.col];

    // Can't capture own piece
    if (targetPiece) {
      if ((isWhitePiece(movingPiece) && isWhitePiece(targetPiece)) ||
          (isBlackPiece(movingPiece) && isBlackPiece(targetPiece))) {
        selectedSquare = null;
        updateBoard();
        return;
      }
    }

    // Validate move by piece type
    if (!isLegalMove(movingPiece, from, to, boardState)) {
      // Illegal move — do nothing or show message
      selectedSquare = null;
      updateBoard();
      return;
    }

    // Move piece
    boardState[to.row][to.col] = movingPiece;
    boardState[from.row][from.col] = null;

    currentPlayer = currentPlayer === 'white' ? 'black' : 'white'; // switch turns
    selectedSquare = null;
    updateBoard();
  }
}

function isLegalMove(piece, from, to, board) {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const pieceType = piece.toLowerCase();

  if (pieceType === 'p') {
    const isWhite = isWhitePiece(piece);
    const direction = isWhite ? -1 : 1; // White pawns move up (-1), black move down (+1)

    // Normal move forward one
    if (dc === 0 && dr === direction && !board[to.row][to.col]) {
      return true;
    }
    // First move: two steps forward
    if (dc === 0 && dr === 2 * direction) {
      const intermediateRow = from.row + direction;
      if (!board[to.row][to.col] && !board[intermediateRow][to.col]) {
        // Pawns can only do this from starting rank
        if ((isWhite && from.row === 6) || (!isWhite && from.row === 1)) {
          return true;
        }
      }
    }
    // Capture move (diagonal by 1)
    if (Math.abs(dc) === 1 && dr === direction) {
      const target = board[to.row][to.col];
      if (target && (isWhitePiece(piece) !== isWhitePiece(target))) {
        return true;
      }
    }

    // Otherwise illegal
    return false;
  }

    // Direction deltas
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    // Knight (L-shape: 2 by 1 or 1 by 2)
    if (pieceType === 'n') {
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    }

    // King (one square in any direction)
    if (pieceType === 'k') {
      return absDr <= 1 && absDc <= 1;
    }

    // Rook (straight lines)
    if (pieceType === 'r') {
      if (dr === 0 || dc === 0) {
        return isPathClear(from, to, board);
      }
      return false;
    }

    // Bishop (diagonal)
    if (pieceType === 'b') {
      if (absDr === absDc) {
        return isPathClear(from, to, board);
      }
      return false;
    }

    // Queen (rook or bishop movement)
    if (pieceType === 'q') {
      if (dr === 0 || dc === 0 || absDr === absDc) {
        return isPathClear(from, to, board);
      }
      return false;
    }


      return false; // Default to illegal for unimplemented pieces
    }


function isPathClear(from, to, board) {
  const stepRow = Math.sign(to.row - from.row);
  const stepCol = Math.sign(to.col - from.col);
  let r = from.row + stepRow;
  let c = from.col + stepCol;

  while (r !== to.row || c !== to.col) {
    if (board[r][c]) return false;
    r += stepRow;
    c += stepCol;
  }

  return true;
}

