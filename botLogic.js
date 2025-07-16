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

export function maybeMakeBotMove() {
  const currentPlayer = getCurrentPlayer();
  if (currentPlayer !== 'black') return; // Bot only plays black for now

  const board = getBoardState();
  const castlingInfo = getCastlingInfo();
  const lastMove = getLastMove();
  const BOT_DELAY_MS = 500;

  const moves = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece !== piece.toLowerCase()) continue; // Only consider black pieces

      const legalMoves = getLegalMovesForPiece(row, col, board, currentPlayer, lastMove, castlingInfo);
      for (const move of legalMoves) {
        moves.push({ from: { row, col }, to: move });
      }
    }
  }

  if (moves.length === 0) return;

  const randomMove = moves[Math.floor(Math.random() * moves.length)];
  setTimeout(() => {
    makeMove(randomMove.from, randomMove.to);
    updateBoard();
  }, BOT_DELAY_MS);
}