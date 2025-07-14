// game.js
import {
  createInitialBoard,
  isLegalMove,
  isInCheck,
  isCheckmate,
  isWhitePiece,
  isBlackPiece,
} from './engine.js';
import { makeMove as executeMove, promotePawn as executePromotion } from './moveExecutor.js';

let boardState, currentPlayer, selectedSquare, legalMoves, gameOver, castlingInfo;
let pendingPromotion = null;
let lastMove = null;
let hasMoved = {
  whiteKing: false,
  blackKing: false,
  whiteRooks: {},
  blackRooks: {}
};

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

function makeMove(from, to, moveMeta = {}) {
  const state = {
    boardState,
    currentPlayer,
    hasMoved,
    castlingInfo,
    lastMove
  };

  const result = executeMove(from, to, moveMeta, state);

  if (result.requiresPromotion) {
    pendingPromotion = result.pendingPromotion;
    return { requiresPromotion: true };
  }

  boardState = result.updatedBoard;
  currentPlayer = result.updatedPlayer;
  hasMoved = result.updatedHasMoved;
  lastMove = result.lastMove;
  selectedSquare = null;
  legalMoves = [];
  gameOver = result.gameOver || false;

  return {
    move: lastMove,
    isCheck: result.isCheck,
    isCheckmate: result.isCheckmate,
    currentPlayer,
    gameOver
  };
}

export function getCastlingStatus() {
  const white = [];
  const black = [];

  for (const col in hasMoved.whiteRooks) {
    if (!hasMoved.whiteRooks[col]) white.push(col);
  }
  if (!hasMoved.whiteKing) white.push('K');

  for (const col in hasMoved.blackRooks) {
    if (!hasMoved.blackRooks[col]) black.push(col);
  }
  if (!hasMoved.blackKing) black.push('k');

  return `Castling rights - White: ${white.join(', ') || 'None'}, Black: ${black.join(', ') || 'None'}`;
}

function promotePawn(newPieceChar) {
  const result = executePromotion(newPieceChar, pendingPromotion, boardState, currentPlayer);
  boardState = result.boardState;
  currentPlayer = result.currentPlayer;
  lastMove = result.lastMove;
  gameOver = result.gameOver || false;
  pendingPromotion = result.pendingPromotion;

  selectedSquare = null;
  legalMoves = [];
}

function getLegalMovesForPiece(row, col, board, currentPlayer, lastMove, castlingInfo) {
  const piece = board[row][col];
  if (!piece) return [];

  const isWhite = isWhitePiece(piece);
  if ((currentPlayer === 'white' && !isWhite) || (currentPlayer === 'black' && isWhite)) {
    return [];
  }

  const moves = [];
  const lower = piece.toLowerCase();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const from = { row, col };
      const to = { row: r, col: c };
      if (isLegalMove(piece, from, to, board, false, lastMove)) {
        moves.push(to);
      }
    }
  }

  // ♟️ En Passant logic
  if (lower === 'p' && lastMove?.piece?.toLowerCase() === 'p') {
    const isWhitePawn = isWhitePiece(piece);
    const dir = isWhitePawn ? -1 : 1;

    if (
      Math.abs(lastMove.to.row - lastMove.from.row) === 2 &&
      lastMove.to.row === row &&
      Math.abs(lastMove.to.col - col) === 1
    ) {
      moves.push({
        row: row + dir,
        col: lastMove.to.col,
        enPassant: true
      });
    }
  }

  // Castling
  if (lower === 'k') {
    const side = isWhite ? 'white' : 'black';
    const info = castlingInfo[side];
    const kingStartCol = info.kingStartCol;
    const rookCols = info.rookCols;
    const castlingRow = isWhite ? 7 : 0;

    if (col === kingStartCol && row === castlingRow) {
      for (const rookCol of rookCols) {
        const rook = board[castlingRow][rookCol];
        if (!rook || rook.toLowerCase() !== 'r') continue;

        const direction = rookCol > kingStartCol ? 1 : -1;
        const targetCol = rookCol > kingStartCol ? info.kingSideTarget : info.queenSideTarget;

        if (targetCol === rookCol) continue;

        let clear = true;
        for (let c = kingStartCol + direction; c !== rookCol; c += direction) {
          if (board[castlingRow][c]) {
            clear = false;
            break;
          }
        }

        const intermediateCols = [kingStartCol + direction, targetCol];
        let safe = clear;
        for (const c of intermediateCols) {
          const tempBoard = board.map(r => r.slice());
          tempBoard[castlingRow][kingStartCol] = null;
          tempBoard[castlingRow][c] = piece;
          if (isInCheck(tempBoard, side)) {
            safe = false;
            break;
          }
        }

        if (safe) {
          moves.push({
            row: castlingRow,
            col: targetCol,
            isCastle: true,
            rookCol
          });
        }
      }
    }
  }

  return moves;
}

function getLegalMoves() {
  if (selectedSquare === null) return [];

  const { row, col } = selectedSquare;
  const piece = boardState[row][col];
  if (!piece) return [];

  const moves = getLegalMovesForPiece(
    row,
    col,
    boardState,
    currentPlayer,
    lastMove,
    castlingInfo
  );

  return moves.map(to => ({ from: selectedSquare, to }));
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
function getLastMove() {
  return lastMove;
}
function resetGame() {
  initializeGame();
}
function getCastlingInfo() {
  return castlingInfo;
}

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
  hasMoved,
  getCastlingInfo
};
