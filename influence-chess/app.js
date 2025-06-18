let currentPlayer = 'white';
let boardState = Array.from({ length: 8 }, () => Array(8).fill(null));
let selectedSquare = null;
let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookMoved = [false, false];
let blackRookMoved = [false, false];
let legalMoves = [];

let whiteKingStartCol = null;
let blackKingStartCol = null;
let whiteRookCols = [];
let blackRookCols = [];

const PIECES = {
  'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
  'p': '♟', 'P': '♙'
};

function isWhitePiece(p) { return p && p === p.toUpperCase(); }
function isBlackPiece(p) { return p && p === p.toLowerCase(); }

const board = document.getElementById("board");
const whiteBackRank = generateChess960BackRank().map(p => p.toUpperCase());
const blackBackRank = whiteBackRank.map(p => p.toLowerCase());

for (let i = 0; i < 8; i++) {
  if (whiteBackRank[i] === 'R') whiteRookCols.push(i);
  if (blackBackRank[i] === 'r') blackRookCols.push(i);
  if (whiteBackRank[i] === 'K') whiteKingStartCol = i;
  if (blackBackRank[i] === 'k') blackKingStartCol = i;
}

for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    const square = document.createElement("div");
    square.classList.add("square", (row + col) % 2 === 0 ? "light-square" : "dark-square");
    square.dataset.row = row;
    square.dataset.col = col;
    square.style.display = "flex";
    square.style.justifyContent = "center";
    square.style.alignItems = "center";
    square.style.fontSize = "36px";

    let piece = null;
    if (row === 0) piece = blackBackRank[col];
    else if (row === 1) piece = 'p';
    else if (row === 6) piece = 'P';
    else if (row === 7) piece = whiteBackRank[col];

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
  const dark = [0, 2, 4, 6], light = [1, 3, 5, 7];
  pieces[dark[Math.floor(Math.random() * dark.length)]] = 'b';
  pieces[light[Math.floor(Math.random() * light.length)]] = 'b';

  while (true) {
    const i = Math.floor(Math.random() * 8);
    if (!pieces[i]) { pieces[i] = 'q'; break; }
  }

  let k = 0;
  while (k < 2) {
    const i = Math.floor(Math.random() * 8);
    if (!pieces[i]) { pieces[i] = 'n'; k++; }
  }

  const empty = pieces.map((p, i) => p === null ? i : -1).filter(i => i !== -1).sort((a, b) => a - b);
  const [r1, k1, r2] = [empty[0], empty[1], empty[2]];
  pieces[r1] = 'r'; pieces[k1] = 'k'; pieces[r2] = 'r';
  return pieces;
}

//Part 2
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

function highlightLegalMoves() {
  const squares = document.querySelectorAll(".square");
  squares.forEach(sq => {
    const r = parseInt(sq.dataset.row);
    const c = parseInt(sq.dataset.col);
    const match = legalMoves.find(m => m.row === r && m.col === c);
    if (match) {
      sq.style.outline = "2px dashed orange";
    }
  });
}

function handleSquareClick(e) {
  const square = e.currentTarget;
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const piece = boardState[row][col];

  if (selectedSquare === null) {
    if (!piece) return;
    if ((currentPlayer === 'white' && !isWhitePiece(piece)) ||
        (currentPlayer === 'black' && !isBlackPiece(piece))) return;

    selectedSquare = { row, col };
    square.style.outline = "2px solid red";
    legalMoves = [];

    const pieceType = piece.toLowerCase();
    if (pieceType === 'k') {
      const row = selectedSquare.row;
      const isWhite = isWhitePiece(piece);

      for (let side = 0; side < 2; side++) {
        const targetCol = isWhite ? (side === 0 ? 2 : 6) : (side === 0 ? 2 : 6);
        const dummyTo = { row, col: targetCol };
        if (canCastle(piece, selectedSquare, dummyTo, boardState)) {
          legalMoves.push(dummyTo);
        }
      }
    }

    // Optional: Add legal non-castle moves here

    highlightLegalMoves();

  } else {
    const from = selectedSquare;
    const to = { row, col };
    const movingPiece = boardState[from.row][from.col];
    const targetPiece = boardState[to.row][to.col];

    if (from.row === to.row && from.col === to.col) {
      selectedSquare = null;
      legalMoves = [];
      updateBoard();
      return;
    }

    if (targetPiece &&
        ((isWhitePiece(movingPiece) && isWhitePiece(targetPiece)) ||
         (isBlackPiece(movingPiece) && isBlackPiece(targetPiece)))) {
      selectedSquare = null;
      legalMoves = [];
      updateBoard();
      return;
    }

    if (!isLegalMove(movingPiece, from, to, boardState)) {
      selectedSquare = null;
      legalMoves = [];
      updateBoard();
      return;
    }

    const dr = to.row - from.row;
    const dc = to.col - from.col;

    if (movingPiece.toLowerCase() === 'k' && dr === 0 && Math.abs(dc) >= 2) {
      performCastle(movingPiece, from, to, boardState);
    } else {
      boardState[to.row][to.col] = movingPiece;
      boardState[from.row][from.col] = null;
    }

    updateMovedFlags(movingPiece, from);
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

    selectedSquare = null;
    legalMoves = [];
    updateBoard();
  }
}

//Part 3
function canCastle(piece, from, to, board) {
  const isWhite = isWhitePiece(piece);
  const row = from.row;
  const kingStartCol = isWhite ? whiteKingStartCol : blackKingStartCol;
  const rookCols = isWhite ? whiteRookCols : blackRookCols;
  const rookMoved = isWhite ? whiteRookMoved : blackRookMoved;
  const kingMoved = isWhite ? whiteKingMoved : blackKingMoved;

  if (kingMoved) return false;

  const targetCol = to.col;
  const kingside = targetCol === 6;
  const rookIndex = kingside ? 1 : 0;
  const rookCol = rookCols[rookIndex];
  if (rookMoved[rookIndex]) return false;

  // Squares between king and rook must be clear
  const minCol = Math.min(kingStartCol, rookCol);
  const maxCol = Math.max(kingStartCol, rookCol);
  for (let c = minCol + 1; c < maxCol; c++) {
    if (board[row][c]) return false;
  }

  // Path the king travels must also be clear
  const kingEndCol = kingside ? 6 : 2;
  const step = kingEndCol > kingStartCol ? 1 : -1;
  for (let c = kingStartCol + step; c !== kingEndCol + step; c += step) {
    if (board[row][c] && c !== rookCol) return false;
  }

  // NOTE: For full legality, you'd check check conditions here (not implemented yet)

  return true;
}

function performCastle(king, from, to, board) {
  const isWhite = isWhitePiece(king);
  const row = from.row;
  const kingside = to.col === 6;
  const kingStartCol = isWhite ? whiteKingStartCol : blackKingStartCol;
  const rookCols = isWhite ? whiteRookCols : blackRookCols;
  const rookIndex = kingside ? 1 : 0;
  const rookCol = rookCols[rookIndex];

  const rook = board[row][rookCol];

  const kingFinalCol = kingside ? 6 : 2;
  const rookFinalCol = kingside ? 5 : 3;

  // Move king
  board[row][kingFinalCol] = king;
  board[row][kingStartCol] = null;

  // Move rook
  board[row][rookFinalCol] = rook;
  board[row][rookCol] = null;

  updateMovedFlags(king, { row, col: kingStartCol });
  updateMovedFlags(rook, { row, col: rookCol });

  updateBoard();
}

function updateMovedFlags(piece, from) {
  const isWhite = isWhitePiece(piece);
  const pieceType = piece.toLowerCase();

  if (pieceType === 'k') {
    if (isWhite) whiteKingMoved = true;
    else blackKingMoved = true;
  }

  if (pieceType === 'r') {
    const col = from.col;
    const rookCols = isWhite ? whiteRookCols : blackRookCols;
    const moved = isWhite ? whiteRookMoved : blackRookMoved;
    if (col === rookCols[0]) moved[0] = true;
    if (col === rookCols[1]) moved[1] = true;
  }
}

function isLegalMove(piece, from, to, board) {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);
  const pieceType = piece.toLowerCase();

  if (pieceType === 'p') {
    const isWhite = isWhitePiece(piece);
    const direction = isWhite ? -1 : 1;

    // Normal one-square move
    if (dc === 0 && dr === direction && !board[to.row][to.col]) return true;

    // Double move from starting rank
    if (dc === 0 && dr === 2 * direction) {
      const midRow = from.row + direction;
      if (!board[midRow][to.col] && !board[to.row][to.col]) {
        if ((isWhite && from.row === 6) || (!isWhite && from.row === 1)) return true;
      }
    }

    // Captures
    if (Math.abs(dc) === 1 && dr === direction) {
      const target = board[to.row][to.col];
      if (target && isWhitePiece(piece) !== isWhitePiece(target)) return true;
    }

    return false;
  }

  if (pieceType === 'n') {
    return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
  }

  if (pieceType === 'k') {
    // Standard king move (non-castling)
    if (absDr <= 1 && absDc <= 1) return true;

    // Castling handled separately
    if (dr === 0 && absDc >= 2) {
      return canCastle(piece, from, to, board);
    }

    return false;
  }

  if (pieceType === 'b') {
    return absDr === absDc && isPathClear(from, to, board);
  }

  if (pieceType === 'r') {
    return (dr === 0 || dc === 0) && isPathClear(from, to, board);
  }

  if (pieceType === 'q') {
    return (dr === 0 || dc === 0 || absDr === absDc) && isPathClear(from, to, board);
  }

  return false;
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
