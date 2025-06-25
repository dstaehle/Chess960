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

  // 🏰 Handle castling BEFORE king move (Chess960 logic)
  if (lowerPiece === 'k' && moveMeta.isCastle && typeof moveMeta.rookCol === 'number') {
    const direction = moveMeta.rookCol < from.col ? -1 : 1;
    const rookFromCol = moveMeta.rookCol;
    const rookToCol = to.col + (direction === -1 ? 1 : -1); // Rook lands on the other side of king

    const rook = boardState[from.row][rookFromCol];
    if (rook && rook.toLowerCase() === 'r') {
      boardState[from.row][rookFromCol] = null;
      boardState[from.row][rookToCol] = rook;
      console.log("✅ Rook moved for castling from", rookFromCol, "to", rookToCol);
    } else {
      console.warn("⚠️ Expected rook not found at column", rookFromCol);
    }
  }

  // 🧩 Pawn promotion logic
  if (
    lowerPiece === 'p' &&
    ((isWhitePiece(piece) && to.row === 0) || (isBlackPiece(piece) && to.row === 7))
  ) {
    pendingPromotion = { from, to, piece };
    return { requiresPromotion: true };
  }

  // 👑 Move the king or other piece
  boardState[to.row][to.col] = piece;
  boardState[from.row][from.col] = null;
  lastMove = { piece, from, to };
  selectedSquare = null;
  legalMoves = [];

  // 📌 Mark moved king or rook
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
  console.log("✅ Move made:", from, "to", to, "by", currentPlayer);
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


function getLegalMovesForPiece(piece, from, board, lastMove) {
  const moves = [];

  if (!piece || !from || typeof from.row !== 'number' || typeof from.col !== 'number') return moves;

  const isWhite = isWhitePiece(piece);
  const side = isWhite ? 'white' : 'black';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isLegalMove(piece, from, { row: r, col: c }, board, false, lastMove)) {
        moves.push({ row: r, col: c });
      }
    }
  }

  // ♟ En Passant
  if (piece.toLowerCase() === 'p' && lastMove?.piece?.toLowerCase() === 'p') {
    const dir = isWhite ? -1 : 1;
    const startRow = isWhite ? 3 : 4;

    if (from.row === startRow && Math.abs(lastMove.to.row - lastMove.from.row) === 2) {
      const oppCol = lastMove.to.col;
      if (Math.abs(oppCol - from.col) === 1 && lastMove.to.row === from.row) {
        moves.push({ row: from.row + dir, col: oppCol });
      }
    }
  }

  // 🏰 Castling (Chess960-style)
  if (piece.toLowerCase() === 'k') {
    const row = from.row;
    const kingMoved = isWhite ? hasMoved.whiteKing : hasMoved.blackKing;
    const rookFlags = isWhite ? hasMoved.whiteRooks : hasMoved.blackRooks;
    const info = castlingInfo[side];

    if (!kingMoved) {
      for (const rookCol of info.rookCols) {
        if (rookFlags[rookCol]) continue;

        const rook = board[row][rookCol];
        if (!rook || rook.toLowerCase() !== 'r') continue;

        const isKingside = rookCol > from.col;
        const targetCol = isKingside ? info.kingSideTarget : info.queenSideTarget;
        const direction = Math.sign(targetCol - from.col);
        const pathCols = [];

        for (let c = from.col + direction; c !== rookCol; c += direction) {
          pathCols.push(c);
        }

        const pathClear = pathCols.every(c => !board[row][c]);

        const checkCols = [from.col, from.col + direction, targetCol];
        const notInCheck = checkCols.every(c => {
          const tempBoard = copyBoard(board);
          tempBoard[row][from.col] = null;
          tempBoard[row][c] = piece;
          return !isInCheck(tempBoard, side, lastMove);
        });

        if (pathClear && notInCheck) {
          const castleMove = {
            row,
            col: targetCol,
            isCastle: true,
            rookCol
          };
          console.log("🏰 Castling move added:", castleMove);
          moves.push(castleMove);
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
  hasMoved
};
