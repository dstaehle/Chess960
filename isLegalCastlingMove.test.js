import {
  isLegalCastlingMove,
  isInCheck,
} from './engine.js';

function makeEmptyBoard() {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

const whiteCastlingInfo = {
  kingStartCol: 4,
  rookCols: [0, 7],
  kingSideTarget: 6,
  queenSideTarget: 2,
  kingSideRookTarget: 5,
  queenSideRookTarget: 3
};

describe('isLegalCastlingMove - white', () => {
  test('valid kingside castling', () => {
    const board = makeEmptyBoard();
    board[7][4] = 'K';
    board[7][7] = 'R';
    const from = { row: 7, col: 4 };
    const to = { row: 7, col: 6 };
    const result = isLegalCastlingMove(from, to, board, true, null, { white: whiteCastlingInfo });
    expect(result).toBe(true);
  });

  test('valid queenside castling', () => {
    const board = makeEmptyBoard();
    board[7][4] = 'K';
    board[7][0] = 'R';
    const from = { row: 7, col: 4 };
    const to = { row: 7, col: 2 };
    const result = isLegalCastlingMove(from, to, board, true, null, { white: whiteCastlingInfo });
    expect(result).toBe(true);
  });

  test('fails if piece between king and rook', () => {
    const board = makeEmptyBoard();
    board[7][4] = 'K';
    board[7][7] = 'R';
    board[7][5] = 'N'; // blocking piece
    const from = { row: 7, col: 4 };
    const to = { row: 7, col: 6 };
    const result = isLegalCastlingMove(from, to, board, true, null, { white: whiteCastlingInfo });
    expect(result).toBe(false);
  });

  test('fails if king is in check along path', () => {
    const board = makeEmptyBoard();
    board[7][4] = 'K';
    board[7][7] = 'R';
    board[5][5] = 'r'; // black rook attacking f1
    const from = { row: 7, col: 4 };
    const to = { row: 7, col: 6 };
    const result = isLegalCastlingMove(from, to, board, true, null, { white: whiteCastlingInfo });
    expect(result).toBe(false);
  });

  test('fails if castlingInfo is missing', () => {
    const board = makeEmptyBoard();
    board[7][4] = 'K';
    board[7][0] = 'R';
    const from = { row: 7, col: 4 };
    const to = { row: 7, col: 2 };
    const result = isLegalCastlingMove(from, to, board, true, null, null);
    expect(result).toBe(false);
  });
});
