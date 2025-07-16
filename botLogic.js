// botLogic.js

import {
  getCurrentPlayer,
  getBoardState,
  getLegalMovesForPiece,
  makeMove,
  getLastMove,
  getCastlingInfo
} from './game.js';

import { updateBoard } from './uiBoard.js';

function evaluateBoard(board) {
  const pieceValues = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 100,
  };

  let score = 0;

  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue;
      const val = pieceValues[piece.toLowerCase()] || 0;
      score += piece === piece.toLowerCase() ? val : -val;
    }
  }

  return score;
}

function minimax(state, depth, maximizingPlayer) {
  const { board, currentPlayer, lastMove, castlingInfo } = state;

  if (depth === 0) return { score: evaluateBoard(board) };

  const moves = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      if (maximizingPlayer && piece !== piece.toLowerCase()) continue;
      if (!maximizingPlayer && piece !== piece.toUpperCase()) continue;

      const legalMoves = getLegalMovesForPiece(row, col, board, currentPlayer, lastMove, castlingInfo);
      for (const move of legalMoves) {
        moves.push({ from: { row, col }, to: move });
      }
    }
  }

  if (moves.length === 0) return { score: evaluateBoard(board) };

  let best = maximizingPlayer ? -Infinity : Infinity;
  let bestMove = null;

  for (const { from, to } of moves) {
    const simulatedState = simulateMove(from, to, state);
    const { score } = minimax(simulatedState, depth - 1, !maximizingPlayer);

    if (
      (maximizingPlayer && score > best) ||
      (!maximizingPlayer && score < best)
    ) {
      best = score;
      bestMove = { from, to };
    }
  }

  return { score: best, move: bestMove };
}

function simulateMove(from, to, state) {
  const {
    board,
    currentPlayer,
    castlingInfo,
    lastMove,
    hasMoved,
  } = state;

  const simulatedBoard = board.map(row => row.slice());
  simulatedBoard[to.row][to.col] = simulatedBoard[from.row][from.col];
  simulatedBoard[from.row][from.col] = null;

  return {
    board: simulatedBoard,
    currentPlayer: currentPlayer === 'white' ? 'black' : 'white',
    lastMove: { from, to, piece: simulatedBoard[to.row][to.col] },
    castlingInfo,
    hasMoved,
  };
}

export function maybeMakeBotMove() {
  const currentPlayer = getCurrentPlayer();
  if (currentPlayer !== 'black') return;

  const board = getBoardState();
  const castlingInfo = getCastlingInfo();
  const lastMove = getLastMove();
  const BOT_DELAY_MS = 500;

  const state = {
    board,
    currentPlayer,
    lastMove,
    castlingInfo,
  };

  const { move } = minimax(state, 2, true); // depth 2 is decent for speed

  if (!move) return;

  setTimeout(() => {
    makeMove(move.from, move.to);
    updateBoard();
  }, BOT_DELAY_MS);
}
