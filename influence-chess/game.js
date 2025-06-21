

// game.js
import {
  PIECES,
  createInitialBoard,
  isLegalMove,
  isInCheck,
  isCheckmate,
  hasAnyLegalMoves,
  isWhitePiece,
  isBlackPiece,
  findKingPosition,
  generateChess960BackRank
} from './engine.js';


// game logic, init, event handlers here


const boardElement = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const gameStatusDiv = document.getElementById('gameStatus');

let boardState, currentPlayer, selectedSquare, legalMoves, gameOver, lastMove, castlingInfo, hasMoved;




function initializeGame() {
  const init = createInitialBoard();
  boardState = init.board;
  castlingInfo = init.castlingInfo; // ← assumes you store this globally
  currentPlayer = 'white';
  selectedSquare = null;
  legalMoves = [];
  gameOver = false;
  lastMove = null;

  // Step 2: Initialize rook movement tracking dynamically
  hasMoved = {
    whiteKing: false,
    blackKing: false,
    whiteRooks: {},
    blackRooks: {}
  };

  for (const col of castlingInfo.white.rookCols) {
    hasMoved.whiteRooks[col] = false;
  }

  for (const col of castlingInfo.black.rookCols) {
    hasMoved.blackRooks[col] = false;
  }

  renderBoard();
  updateTurnIndicator();
  clearGameStatus();
  updateCastlingStatus();
}

function renderBoard() {
  boardElement.innerHTML = ''; // clear existing board
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement('div');
      square.classList.add('square', (r + c) % 2 === 0 ? 'light-square' : 'dark-square');
      square.dataset.row = r;
      square.dataset.col = c;
      square.style.fontSize = '36px';
      const piece = boardState[r][c];
      if (piece) {
        square.textContent = PIECES[piece];
        square.classList.add(isWhitePiece(piece) ? 'white-piece' : 'black-piece');
      }
      square.addEventListener('click', onSquareClick);
      boardElement.appendChild(square);
    }
  }
  highlightLegalMoves();
}

function updateTurnIndicator() {
  turnIndicator.textContent = currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1) + "'s turn";
}

function updateCastlingStatus() {
  const el = document.getElementById("castlingStatus");
  if (!el) return;

  function formatStatus(kingMoved, rooks) {
    const available = [];
    for (const col in rooks) {
      if (!rooks[col]) available.push(col);
    }
    return kingMoved ? "X" : available.length ? `Rooks @ [${available.join(", ")}]` : "None";
  }

  const white = formatStatus(hasMoved.whiteKing, hasMoved.whiteRooks);
  const black = formatStatus(hasMoved.blackKing, hasMoved.blackRooks);

  el.textContent = `Castling rights — White: ${white} | Black: ${black}`;
}


function clearGameStatus() {
  gameStatusDiv.textContent = '';
}

function highlightLegalMoves() {
  const squares = document.querySelectorAll('.square');
  squares.forEach(sq => {
    sq.style.outline = '';
  });
  legalMoves.forEach(move => {
    const selector = `.square[data-row="${move.row}"][data-col="${move.col}"]`;
    const sq = document.querySelector(selector);
    if (sq) sq.style.outline = '2px dashed orange';
  });
}

function onSquareClick(e) {
  if (gameOver) return;

  const row = +e.currentTarget.dataset.row;
  const col = +e.currentTarget.dataset.col;
  const clickedPiece = boardState[row][col];

  if (selectedSquare === null) {
    if (!clickedPiece) return;
    if ((currentPlayer === 'white' && !isWhitePiece(clickedPiece)) ||
        (currentPlayer === 'black' && !isBlackPiece(clickedPiece))) return;

    selectedSquare = { row, col };
    legalMoves = getLegalMovesForPiece(clickedPiece, selectedSquare, boardState);
    legalMoves = legalMoves.filter(move => {
      // filter moves that leave king safe
      const testBoard = copyBoard(boardState);
      testBoard[move.row][move.col] = clickedPiece;
      testBoard[selectedSquare.row][selectedSquare.col] = null;
      return !isInCheck(testBoard, currentPlayer, lastMove);
    });
    highlightLegalMoves();
  } else {
    // Attempt move
    const move = legalMoves.find(m => m.row === row && m.col === col);
    if (!move) {
      selectedSquare = null;
      legalMoves = [];
      renderBoard();
      return;
    }

    makeMove(selectedSquare, move);
  }

  console.log('Clicked square', row, col, 'Piece:', clickedPiece);
  console.log('Current player:', currentPlayer);
}


function makeMove(from, to) {
  const piece = boardState[from.row][from.col];

  // === Handle castling move ===
  if (piece.toLowerCase() === 'k' && to.isCastle && typeof to.rookCol === 'number') {
    const direction = to.rookCol < from.col ? -1 : 1;
    const rookFromCol = to.rookCol;
    const rookToCol = from.col + direction;

    // Move the rook
    const rook = boardState[from.row][rookFromCol];
    boardState[from.row][rookFromCol] = null;
    boardState[from.row][rookToCol] = rook;
  }

  // === Update king or rook movement flags ===
  if (piece.toLowerCase() === 'k') {
    if (isWhitePiece(piece)) {
      hasMoved.whiteKing = true;
    } else {
      hasMoved.blackKing = true;
    }
  }

  if (piece.toLowerCase() === 'r') {
    const rookCol = from.col;
    if (isWhitePiece(piece) && hasMoved.whiteRooks.hasOwnProperty(rookCol)) {
      hasMoved.whiteRooks[rookCol] = true;
    }
    if (isBlackPiece(piece) && hasMoved.blackRooks.hasOwnProperty(rookCol)) {
      hasMoved.blackRooks[rookCol] = true;
    }
  }

  // === En passant logic ===
  if (
    piece.toLowerCase() === 'p' &&
    Math.abs(to.col - from.col) === 1 &&
    !boardState[to.row][to.col] &&
    lastMove &&
    lastMove.piece.toLowerCase() === 'p' &&
    Math.abs(lastMove.to.row - lastMove.from.row) === 2 &&
    lastMove.to.row === from.row &&
    lastMove.to.col === to.col
  ) {
    const dir = currentPlayer === 'white' ? 1 : -1;
    const capturedRow = to.row + dir;
    boardState[capturedRow][to.col] = null;
  }

  // === Execute standard move ===
  boardState[to.row][to.col] = piece;
  boardState[from.row][from.col] = null;
  lastMove = { piece, from, to };

  selectedSquare = null;
  legalMoves = [];

  const opponent = currentPlayer === 'white' ? 'black' : 'white';

  if (isCheckmate(boardState, opponent)) {
    gameStatusDiv.textContent = `Checkmate! ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins.`;
    gameOver = true;
  } else if (isInCheck(boardState, opponent)) {
    gameStatusDiv.textContent = 'Check!';
  } else {
    gameStatusDiv.textContent = '';
  }

  currentPlayer = opponent;
  updateTurnIndicator();
  renderBoard();
  updateCastlingStatus();

  console.log(`Move made by ${currentPlayer}: ${piece} from`, from, 'to', to);
  console.log('Next player:', currentPlayer === 'white' ? 'black' : 'white');
}




function getLegalMovesForPiece(piece, from, board) {
  const moves = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isLegalMove(piece, from, { row: r, col: c }, board, false, lastMove)) 
        {
        moves.push({ row: r, col: c });
      }

    }
  }
  // Add castling options if this is the king
  if (piece.toLowerCase() === 'k') {
    const isWhite = isWhitePiece(piece);
    const row = from.row;
    const rookFlags = isWhite ? hasMoved.whiteRooks : hasMoved.blackRooks;
    const kingMoved = isWhite ? hasMoved.whiteKing : hasMoved.blackKing;

    if (!kingMoved) {
      // Look for unmoved rooks
      for (const rookColStr in rookFlags) {
        const rookCol = parseInt(rookColStr);
        if (!rookFlags[rookCol]) {
          // Check that there's a rook there of the right color
          const rook = board[row][rookCol];
          if (
            rook &&
            rook.toLowerCase() === 'r' &&
            (isWhitePiece(rook) === isWhite)
          ) {
            const direction = rookCol < from.col ? -1 : 1;
            const pathCols = [];

            // All squares between king and rook must be empty
            for (let c = from.col + direction; c !== rookCol; c += direction) {
              pathCols.push(c);
            }

            const pathClear = pathCols.every(c => !board[row][c]);
            const safeSquares = [from.col, from.col + direction, from.col + 2 * direction];

            const noChecks = safeSquares.every(c => {
              const testBoard = copyBoard(board);
              testBoard[row][c] = piece;
              testBoard[from.row][from.col] = null;
              return !isInCheck(testBoard, isWhite ? 'white' : 'black', lastMove);
            });

            if (pathClear && noChecks) {
              // Valid castling: king moves two squares toward rook
              moves.push({ row, col: from.col + 2 * direction, isCastle: true, rookCol });
            }
          }
        }
      }
    }
  }

  return moves;

  
}


function copyBoard(board) {
  return board.map(row => row.slice());
}

// Initialize game on load
initializeGame();
