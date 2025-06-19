
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
  if (gameOver) return;

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

    // Castling options
    if (pieceType === 'k') {
      const row = selectedSquare.row;
      const isWhite = isWhitePiece(piece);

      for (let side = 0; side < 2; side++) {
        const targetCol = side === 0 ? 2 : 6;
        const dummyTo = { row, col: targetCol };
        if (canCastle(piece, selectedSquare, dummyTo, boardState)) {
          legalMoves.push(dummyTo);
        }
      }
    }

    // Generate other legal moves
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const testTo = { row: r, col: c };
        if ((r !== row || c !== col) &&
            isLegalMove(piece, selectedSquare, testTo, boardState)) {
          legalMoves.push(testTo);
        }
      }
    }

    // If in check, filter only moves that resolve check
    if (isInCheck(boardState, currentPlayer)) {
      legalMoves = legalMoves.filter(m => {
        const tempBoard = boardState.map(row => row.slice());
        tempBoard[m.row][m.col] = boardState[selectedSquare.row][selectedSquare.col];
        tempBoard[selectedSquare.row][selectedSquare.col] = null;
        return !isInCheck(tempBoard, currentPlayer);
      });
    }

    highlightLegalMoves();

  } else {
    const from = selectedSquare;
    const to = { row, col };

    const isMoveLegal = legalMoves.some(m => m.row === to.row && m.col === to.col);
    if (!isMoveLegal) {
      selectedSquare = null;
      legalMoves = [];
      updateBoard();
      return;
    }

    const movingPiece = boardState[from.row][from.col];

    if (movingPiece.toLowerCase() === 'k' && from.row === to.row && Math.abs(to.col - from.col) >= 2) {
      performCastle(movingPiece, from, to, boardState);
    } else {
      boardState[to.row][to.col] = movingPiece;
      boardState[from.row][from.col] = null;
    }

    updateMovedFlags(movingPiece, from);

    selectedSquare = null;
    legalMoves = [];

    // Change turn first, update UI after
    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
    currentPlayer = nextPlayer;

    updateBoard();

    const gameStatusDiv = document.getElementById("gameStatus");
    const checkStatusDiv = document.getElementById("checkStatus");

    if (isCheckmate(boardState, currentPlayer)) {
      const winner = currentPlayer === 'white' ? 'Black' : 'White';
      gameStatusDiv.textContent = `Checkmate! ${winner} wins.`;
      console.log("Checkmate!");
      gameOver = true;
      addPlayAgainButton();
      return;
    }

    if (isInCheck(boardState, currentPlayer)) {
      if (checkStatusDiv) checkStatusDiv.textContent = "Check!";
      console.log("Check!");
    } else {
      if (checkStatusDiv) checkStatusDiv.textContent = "";
    }
  }
}





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

function isLegalMove(piece, from, to, board, skipCheckTest = false) {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const pieceType = piece.toLowerCase();
  const isWhite = isWhitePiece(piece);
  const targetPiece = board[to.row][to.col];

  if (targetPiece && (isWhite === isWhitePiece(targetPiece))) {
    return false;
  }

  // --- Existing move legality logic here ---

  if (pieceType === 'p') {
    const direction = isWhite ? -1 : 1;

    // Single forward move
    if (dc === 0 && dr === direction && !board[to.row][to.col]) return true;

    // Double move from starting rank
    if (dc === 0 && dr === 2 * direction) {
      const intermediateRow = from.row + direction;
      if (!board[to.row][to.col] && !board[intermediateRow][to.col]) {
        if ((isWhite && from.row === 6) || (!isWhite && from.row === 1)) return true;
      }
    }

    // Capture diagonally
    if (Math.abs(dc) === 1 && dr === direction) {
      const target = board[to.row][to.col];
      if (target && (isWhitePiece(piece) !== isWhitePiece(target))) return true;
    }

    return false;
  }

  // Other pieces...

  if (pieceType === 'n') {
    return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
  }

  if (pieceType === 'k') {
    if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return true;
    if (dr === 0 && Math.abs(dc) === 2) return canCastle(piece, from, to, board);
    return false;
  }

  if (pieceType === 'r') {
    if (dr === 0 || dc === 0) return isPathClear(from, to, board);
    return false;
  }

  if (pieceType === 'b') {
    if (Math.abs(dr) === Math.abs(dc)) return isPathClear(from, to, board);
    return false;
  }

  if (pieceType === 'q') {
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) return isPathClear(from, to, board);
    return false;
  }

  // --- New addition starts here ---

  // If we are skipping check tests, just return true here (move is structurally legal)
  if (skipCheckTest) return true;

  // Now check if the move leaves own king in check
  // Temporarily make the move on a copied board to test
  const tempBoard = board.map(row => row.slice());
  tempBoard[to.row][to.col] = piece;
  tempBoard[from.row][from.col] = null;

  // Find the king's position after the move (king may move or stay)
  let kingPos;
  if (pieceType === 'k') {
    kingPos = { row: to.row, col: to.col };
  } else {
    // King stays put if not the king moving
    const isWhite = isWhitePiece(piece);
    kingPos = findKingPosition(tempBoard, isWhite);
  }

  // If king is attacked, move is illegal
  if (isSquareAttacked(tempBoard, kingPos.row, kingPos.col, !isWhite)) {
    return false;
  }

  return true;
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

// Checks if the square at (row, col) is attacked by any piece of the specified color (attackerIsWhite)
function isSquareAttacked(board, row, col, attackerIsWhite) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && (attackerIsWhite ? isWhitePiece(piece) : isBlackPiece(piece))) {
        // Use isLegalMove with skipCheckTest=true to avoid infinite recursion
        if (isLegalMove(piece, { row: r, col: c }, { row, col }, board, true)) {
          return true;
        }
      }
    }
  }
  return false;
}

function hasAnyLegalMoves(board, currentPlayer) {
  const isWhite = currentPlayer === 'white';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && (isWhite ? isWhitePiece(piece) : isBlackPiece(piece))) {
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            if (isLegalMove(piece, { row: r, col: c }, { row: tr, col: tc }, board)) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

function isCheckmate(board, currentPlayer) {
  return isInCheck(board, currentPlayer) && !hasAnyLegalMoves(board, currentPlayer);
}

// Finds the position of the king for the specified color on the board
function findKingPosition(board, isWhite) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.toLowerCase() === 'k' && (isWhite ? isWhitePiece(piece) : isBlackPiece(piece))) {
        return { row: r, col: c };
      }
    }
  }
  return null; // King not found (should not happen)
}


// Returns true if currentPlayer's king is under attack
function isInCheck(board, currentPlayer) {
  const isWhite = currentPlayer === 'white';
  const kingPos = findKingPosition(board, isWhite);
  if (!kingPos) return false; // Should not happen
  
  // Check if king's square is attacked by opponent
  return isSquareAttacked(board, kingPos.row, kingPos.col, !isWhite);
}


// Returns true if currentPlayer has any legal move on the board
function hasAnyLegalMoves(board, currentPlayer) {
  const isWhite = currentPlayer === 'white';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && (isWhite ? isWhitePiece(piece) : isBlackPiece(piece))) {
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            if (isLegalMove(piece, { row: r, col: c }, { row: tr, col: tc }, board)) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}


function isCheckmate(board, currentPlayer) {
  return isInCheck(board, currentPlayer) && !hasAnyLegalMoves(board, currentPlayer);
}


const resignBtn = document.getElementById("resignBtn");
const offerDrawBtn = document.getElementById("offerDrawBtn");
const drawOfferDiv = document.getElementById("drawOffer");
const acceptDrawBtn = document.getElementById("acceptDrawBtn");
const declineDrawBtn = document.getElementById("declineDrawBtn");
const gameStatusDiv = document.getElementById("gameStatus");

let gameOver = false;
let drawOfferedBy = null; // 'white' or 'black' or null

resignBtn.onclick = () => {
  if (gameOver) return;
  gameStatusDiv.textContent = currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1) + " resigned. Game over.";
  gameOver = true;
};

offerDrawBtn.onclick = () => {
  if (gameOver) return;
  drawOfferedBy = currentPlayer;
  drawOfferDiv.style.display = "block";
  gameStatusDiv.textContent = currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1) + " offered a draw.";
};

acceptDrawBtn.onclick = () => {
  if (!drawOfferedBy) return;
  gameStatusDiv.textContent = "Draw accepted. Game over.";
  gameOver = true;
  drawOfferDiv.style.display = "none";
};

declineDrawBtn.onclick = () => {
  drawOfferDiv.style.display = "none";
  gameStatusDiv.textContent = "Draw offer declined.";
  drawOfferedBy = null;
};

function generateLegalMovesForPiece(piece, from, board) {
  const moves = [];
  const row = from.row;
  const col = from.col;
  const pieceType = piece.toLowerCase();
  const isWhite = isWhitePiece(piece);
  const direction = isWhite ? -1 : 1;

  // Helper to add a move if on board and not blocked by own piece
  function tryAddMove(r, c) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    const target = board[r][c];
    if (!target) {
      moves.push({ row: r, col: c });
      return true; // can continue sliding (for sliding pieces)
    } else {
      // Can capture opponent piece
      if (isWhitePiece(piece) !== isWhitePiece(target)) {
        moves.push({ row: r, col: c });
      }
      return false; // blocked after capture
    }
  }

  if (pieceType === 'p') {
    // Pawn moves
    // Forward 1
    if (!board[row + direction]?.[col]) {
      moves.push({ row: row + direction, col });
      // Forward 2 if on starting row
      const startRow = isWhite ? 6 : 1;
      if (row === startRow && !board[row + 2 * direction]?.[col]) {
        moves.push({ row: row + 2 * direction, col });
      }
    }
    // Captures
    for (const dc of [-1, 1]) {
      const r = row + direction;
      const c = col + dc;
      if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const target = board[r][c];
        if (target && isWhitePiece(piece) !== isWhitePiece(target)) {
          moves.push({ row: r, col: c });
        }
      }
    }
  } else if (pieceType === 'n') {
    // Knight moves
    const knightMoves = [
      [2, 1], [2, -1], [-2, 1], [-2, -1],
      [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];
    knightMoves.forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const target = board[r][c];
        if (!target || isWhitePiece(piece) !== isWhitePiece(target)) {
          moves.push({ row: r, col: c });
        }
      }
    });
  } else if (pieceType === 'k') {
    // King moves (normal one-step)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
          const target = board[r][c];
          if (!target || isWhitePiece(piece) !== isWhitePiece(target)) {
            moves.push({ row: r, col: c });
          }
        }
      }
    }
    // Castling moves
    for (let side = 0; side < 2; side++) {
      const targetCol = isWhite ? (side === 0 ? 2 : 6) : (side === 0 ? 2 : 6);
      const dummyTo = { row, col: targetCol };
      if (canCastle(piece, from, dummyTo, board)) {
        moves.push(dummyTo);
      }
    }
  } else {
    // Sliding pieces: rook, bishop, queen
    const directions = [];
    if (pieceType === 'r' || pieceType === 'q') {
      directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    }
    if (pieceType === 'b' || pieceType === 'q') {
      directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    }

    directions.forEach(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const target = board[r][c];
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          if (isWhitePiece(piece) !== isWhitePiece(target)) {
            moves.push({ row: r, col: c });
          }
          break; // blocked
        }
        r += dr;
        c += dc;
      }
    });
  }

  return moves;
}

function addPlayAgainButton() {
  const gameStatusDiv = document.getElementById("gameStatus");

  // Avoid duplicate buttons
  if (document.getElementById("playAgainBtn")) return;

  const btn = document.createElement("button");
  btn.id = "playAgainBtn";
  btn.textContent = "Play Again";
  btn.style.marginTop = "10px";
  btn.onclick = () => {
    resetGame();
    gameStatusDiv.textContent = "";
    btn.remove();
  };

  gameStatusDiv.appendChild(document.createElement("br"));
  gameStatusDiv.appendChild(btn);
}
function resetGame() {
  currentPlayer = 'white';
  gameOver = false;
  selectedSquare = null;
  legalMoves = [];
  whiteKingMoved = false;
  blackKingMoved = false;
  whiteRookMoved = [false, false];
  blackRookMoved = [false, false];
  whiteRookCols = [];
  blackRookCols = [];
  whiteKingStartCol = null;
  blackKingStartCol = null;

  // Generate new Chess960 back ranks
  const newWhiteBackRank = generateChess960BackRank().map(p => p.toUpperCase());
  const newBlackBackRank = newWhiteBackRank.map(p => p.toLowerCase());

  for (let i = 0; i < 8; i++) {
    if (newWhiteBackRank[i] === 'R') whiteRookCols.push(i);
    if (newBlackBackRank[i] === 'r') blackRookCols.push(i);
    if (newWhiteBackRank[i] === 'K') whiteKingStartCol = i;
    if (newBlackBackRank[i] === 'k') blackKingStartCol = i;
  }

  // Reset boardState with new positions
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (row === 0) boardState[row][col] = newBlackBackRank[col];
      else if (row === 1) boardState[row][col] = 'p';
      else if (row === 6) boardState[row][col] = 'P';
      else if (row === 7) boardState[row][col] = newWhiteBackRank[col];
      else boardState[row][col] = null;
    }
  }

  updateBoard();

  const checkStatusDiv = document.getElementById("checkStatus");
  if (checkStatusDiv) checkStatusDiv.textContent = "";
}
