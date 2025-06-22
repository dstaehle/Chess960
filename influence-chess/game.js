// game.js
import {
  PIECES,
  createInitialBoard,
  isLegalMove,
  isInCheck,
  isCheckmate,
  isWhitePiece,
  isBlackPiece,
} from './engine.js';

let boardState, currentPlayer, selectedSquare, legalMoves, gameOver, castlingInfo, hasMoved;
let pendingPromotion = null;
let lastMove = null;


function initializeGame() {
  const init = createInitialBoard();
  boardState = init.board;
  castlingInfo = init.castlingInfo;
  currentPlayer = 'white';
  selectedSquare = null;
  legalMoves = [];
  gameOver = false;
  lastMove = null;

  hasMoved = {
    whiteKing: false,
    blackKing: false,
    whiteRooks: {},
    blackRooks: {}
  };

  for (const col of castlingInfo.white.rookCols) hasMoved.whiteRooks[col] = false;
  for (const col of castlingInfo.black.rookCols) hasMoved.blackRooks[col] = false;
}

function makeMove(from, to) {
  const piece = boardState[from.row][from.col];

  // Check for promotion before committing the move
  if (
    piece.toLowerCase() === 'p' &&
    ((isWhitePiece(piece) && to.row === 0) || (isBlackPiece(piece) && to.row === 7))
  ) {
    pendingPromotion = { from, to, piece };
    return { requiresPromotion: true };  // signal UI to show modal
  }

  // Proceed with normal move logic...
  boardState[to.row][to.col] = piece;
  boardState[from.row][from.col] = null;
  lastMove = { piece, from, to };
  selectedSquare = null;
  legalMoves = [];

  const opponent = currentPlayer === 'white' ? 'black' : 'white';
  const result = {
    move: { from, to, piece },
    isCheck: isInCheck(boardState, opponent),
    isCheckmate: isCheckmate(boardState, opponent),
    currentPlayer: opponent,
    gameOver: false
  };

  if (result.isCheckmate) {
    gameOver = true;
    result.gameOver = true;
  }

  currentPlayer = opponent;
  return result;
}


function promotePawn(newPieceChar) {
  if (!pendingPromotion) return;

  const { from, to, piece } = pendingPromotion;
  const finalPiece = isWhitePiece(piece) ? newPieceChar.toUpperCase() : newPieceChar.toLowerCase();

  boardState[to.row][to.col] = finalPiece;
  boardState[from.row][from.col] = null;
  lastMove = { piece: finalPiece, from, to };
  pendingPromotion = null;

  selectedSquare = null;
  legalMoves = [];

  const opponent = currentPlayer === 'white' ? 'black' : 'white';

  if (isCheckmate(boardState, opponent)) {
    gameOver = true;
  }

  currentPlayer = opponent;
}


function getLegalMovesForPiece(piece, from, board, lastMove) {
  const moves = [];

  // Ensure 'from' is valid
  if (!from || typeof from.row !== 'number' || typeof from.col !== 'number') {
    return moves;
  }

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isLegalMove(piece, from, { row: r, col: c }, board, false, lastMove)) {
        moves.push({ row: r, col: c });
      }
    }
  }

  // En Passant logic
  if (piece.toLowerCase() === 'p' && lastMove?.piece?.toLowerCase() === 'p') {
    const isWhite = isWhitePiece(piece);
    const dir = isWhite ? -1 : 1;
    const startRow = isWhite ? 3 : 4;

    if (from.row === startRow && Math.abs(lastMove.to.row - lastMove.from.row) === 2) {
      const opponentCol = lastMove.to.col;
      if (Math.abs(opponentCol - from.col) === 1 && lastMove.to.row === from.row) {
        moves.push({ row: from.row + dir, col: opponentCol });
      }
    }
  }

  // Castling logic
  if (piece.toLowerCase() === 'k') {
    const isWhite = isWhitePiece(piece);
    const row = from.row;
    const rookFlags = isWhite ? hasMoved.whiteRooks : hasMoved.blackRooks;
    const kingMoved = isWhite ? hasMoved.whiteKing : hasMoved.blackKing;

    if (!kingMoved) {
      for (const rookColStr in rookFlags) {
        const rookCol = parseInt(rookColStr);
        if (!rookFlags[rookCol]) {
          const rook = board[row][rookCol];
          if (rook && rook.toLowerCase() === 'r' && isWhitePiece(rook) === isWhite) {
            const dir = rookCol < from.col ? -1 : 1;
            const pathCols = [];
            for (let c = from.col + dir; c !== rookCol; c += dir) pathCols.push(c);
            const pathClear = pathCols.every(c => !board[row][c]);

            const safeSquares = [from.col, from.col + dir, from.col + 2 * dir];
            const noChecks = safeSquares.every(c => {
              const testBoard = copyBoard(board);
              testBoard[row][c] = piece;
              testBoard[from.row][from.col] = null;
              return !isInCheck(testBoard, isWhite ? 'white' : 'black', lastMove);
            });

            if (pathClear && noChecks) {
              moves.push({ row, col: from.col + 2 * dir, isCastle: true, rookCol });
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
function getBoardState() {
  return boardState;
}

function getCurrentPlayer() {
return currentPlayer;
}

function getGameStatus() {
  if (gameOver) {
    return `Game over. ${currentPlayer === 'white' ? 'Black' : 'White'} wins!`;
  }
  return null;
}
function getLegalMoves() {
  if (selectedSquare === null) return [];

  const piece = boardState[selectedSquare.row][selectedSquare.col];
  if (!piece) return [];

  return getLegalMovesForPiece(piece, selectedSquare, boardState).map(to => ({
    from: selectedSquare,
    to
  }));
}

function getLastMove() {
  return lastMove;
}

function resetGame() {
  initializeGame();
}


// Public API
export {
  initializeGame,
  makeMove,
  promotePawn,
  getBoardState,
  getCurrentPlayer,
  getLegalMovesForPiece,
  getGameStatus,
  getLegalMoves,
  resetGame,
  getLastMove,
};
