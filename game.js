// game.js
import {
  createInitialBoard,
  isLegalMove,
  isInCheck,
  isCheckmate,
  isWhitePiece,
  isBlackPiece,
} from './engine.js';

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
  const piece = boardState[from.row][from.col];
  const lowerPiece = piece.toLowerCase();

  console.log("📥 makeMove called with from:", from, "to:", to, "meta:", moveMeta);
  console.log("🔍 Checking enPassant status:", moveMeta?.enPassant);
  if (moveMeta && typeof moveMeta === 'object') {
    console.log("🧪 moveMeta keys:", Object.keys(moveMeta));
  }

  // 🏰 Handle castling
  if (lowerPiece === 'k' && moveMeta?.isCastle) {
    const rookFromCol = moveMeta.rookCol;
    const rook = boardState[from.row][rookFromCol];

    const kingTargetCol = to.col;
    const rookTargetCol = kingTargetCol > from.col ? kingTargetCol - 1 : kingTargetCol + 1;

    if (!rook || rook.toLowerCase() !== 'r') {
      console.warn("⚠️ No rook found at expected position during castling");
      return;
    }

    if (rookTargetCol === rookFromCol) {
      console.warn("⚠️ Invalid castling: rook target is same as origin");
      return;
    }

    if (
      boardState[from.row][rookTargetCol] &&
      boardState[from.row][rookTargetCol] !== rook
    ) {
      console.warn("⚠️ Castling blocked: destination square occupied");
      return;
    }

    boardState[to.row][to.col] = piece;
    boardState[from.row][from.col] = null;
    boardState[from.row][rookFromCol] = null;
    boardState[from.row][rookTargetCol] = rook;

    lastMove = { piece, from, to, isCastle: true };
    selectedSquare = null;
    legalMoves = [];

    if (isWhitePiece(piece)) hasMoved.whiteKing = true;
    else hasMoved.blackKing = true;

    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    boardState = boardState.map(row => row.slice());
    console.log(`🏰 Castled: king to ${to.col}, rook from ${rookFromCol} to ${rookTargetCol}`);
    return;
  }

  // ♟️ Handle en passant
  if (moveMeta?.enPassant) {
    const dir = isWhitePiece(piece) ? 1 : -1;
    const capturedRow = to.row + dir;

    console.log("🟦 En passant capture occurred");
    console.log("  ↪️ Capturing pawn at:", { row: capturedRow, col: to.col });

    boardState[to.row][to.col] = piece;
    boardState[from.row][from.col] = null;
    boardState[capturedRow][to.col] = null;

    lastMove = { piece, from, to, enPassant: true };
    selectedSquare = null;
    legalMoves = [];
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    boardState = boardState.map(row => row.slice());
    return;
  }

  // 🧩 Handle promotion
  if (
    lowerPiece === 'p' &&
    ((isWhitePiece(piece) && to.row === 0) || (isBlackPiece(piece) && to.row === 7))
  ) {
    pendingPromotion = { from, to, piece };
    return { requiresPromotion: true };
  }

  // ✅ Regular move
  boardState[to.row][to.col] = piece;
  boardState[from.row][from.col] = null;
  lastMove = { piece, from, to };
  selectedSquare = null;
  legalMoves = [];

  if (lowerPiece === 'k') {
    isWhitePiece(piece) ? hasMoved.whiteKing = true : hasMoved.blackKing = true;
  }
  if (lowerPiece === 'r') {
    const rookCol = from.col;
    if (isWhitePiece(piece) && hasMoved.whiteRooks.hasOwnProperty(rookCol)) {
      hasMoved.whiteRooks[rookCol] = true;
    }
    if (isBlackPiece(piece) && hasMoved.blackRooks.hasOwnProperty(rookCol)) {
      hasMoved.blackRooks[rookCol] = true;
    }
  }

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
  boardState = boardState.map(row => row.slice());
  return result;
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

  // ♟️ En Passant logic (fixed to use lastMove.piece directly)
  if (lower === 'p' && lastMove?.piece?.toLowerCase() === 'p') {
    const isWhitePawn = isWhitePiece(piece);
    const dir = isWhitePawn ? -1 : 1;

    // Check if last move was a 2-square pawn advance adjacent to this one
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

  // ♚ Chess960 Castling logic
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