// moveExecutor.js
import { isWhitePiece, isBlackPiece, isInCheck, isCheckmate } from './engine.js';

export function makeMove(from, to, moveMeta, state) {
  const {
    boardState,
    currentPlayer,
    hasMoved,
    castlingInfo,
    lastMove
  } = state;

  const piece = boardState[from.row][from.col];
  const lowerPiece = piece.toLowerCase();
  const newBoard = boardState.map(row => row.slice());
  let updatedHasMoved = JSON.parse(JSON.stringify(hasMoved));
  let pendingPromotion = null;
  let result = {};

  // Castling
  if (lowerPiece === 'k' && moveMeta?.isCastle) {
    const rookFromCol = moveMeta.rookCol;
    const rook = newBoard[from.row][rookFromCol];
    const kingTargetCol = to.col;
    const rookTargetCol = kingTargetCol > from.col ? kingTargetCol - 1 : kingTargetCol + 1;

    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    newBoard[from.row][rookFromCol] = null;
    newBoard[from.row][rookTargetCol] = rook;

    if (isWhitePiece(piece)) updatedHasMoved.whiteKing = true;
    else updatedHasMoved.blackKing = true;

    return {
      updatedBoard: newBoard,
      updatedPlayer: currentPlayer === 'white' ? 'black' : 'white',
      updatedHasMoved,
      lastMove: { piece, from, to, isCastle: true }
    };
  }

  // En Passant
  if (moveMeta?.enPassant) {
    const dir = isWhitePiece(piece) ? 1 : -1;
    const capturedRow = to.row + dir;

    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    newBoard[capturedRow][to.col] = null;

    return {
      updatedBoard: newBoard,
      updatedPlayer: currentPlayer === 'white' ? 'black' : 'white',
      updatedHasMoved,
      lastMove: { piece, from, to, enPassant: true }
    };
  }

  // Promotion
  if (
    lowerPiece === 'p' &&
    ((isWhitePiece(piece) && to.row === 0) || (isBlackPiece(piece) && to.row === 7))
  ) {
    pendingPromotion = { from, to, piece };
    return { requiresPromotion: true, pendingPromotion };
  }

  // ✅ Regular move
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  if (lowerPiece === 'k') {
    isWhitePiece(piece)
      ? (updatedHasMoved.whiteKing = true)
      : (updatedHasMoved.blackKing = true);
  } else if (lowerPiece === 'r') {
    const rookCol = from.col;
    if (isWhitePiece(piece) && updatedHasMoved.whiteRooks.hasOwnProperty(rookCol)) {
      updatedHasMoved.whiteRooks[rookCol] = true;
    }
    if (isBlackPiece(piece) && updatedHasMoved.blackRooks.hasOwnProperty(rookCol)) {
      updatedHasMoved.blackRooks[rookCol] = true;
    }
  }

  const opponent = currentPlayer === 'white' ? 'black' : 'white';
  const check = isInCheck(newBoard, opponent);
  const checkmate = isCheckmate(newBoard, opponent);

  return {
    updatedBoard: newBoard,
    updatedPlayer: opponent,
    updatedHasMoved,
    lastMove: { piece, from, to },
    isCheck: check,
    isCheckmate: checkmate,
    gameOver: checkmate,
    pendingPromotion
  };
}

export function promotePawn(newPieceChar, pendingPromotion, boardState, currentPlayer) {
  if (!pendingPromotion) return { boardState, currentPlayer };

  const { from, to, piece } = pendingPromotion;
  const finalPiece = isWhitePiece(piece)
    ? newPieceChar.toUpperCase()
    : newPieceChar.toLowerCase();

  const newBoard = boardState.map(row => row.slice());
  newBoard[to.row][to.col] = finalPiece;
  newBoard[from.row][from.col] = null;

  const opponent = currentPlayer === 'white' ? 'black' : 'white';
  const checkmate = isCheckmate(newBoard, opponent);

  return {
    boardState: newBoard,
    currentPlayer: opponent,
    gameOver: checkmate,
    lastMove: { piece: finalPiece, from, to },
    pendingPromotion: null
  };
}