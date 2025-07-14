import { isLegalMove } from './engine.js';

function makeEmptyBoard() {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

describe('isLegalMove - pawns', () => {
  test('white pawn moves one forward', () => {
    const board = makeEmptyBoard();
    board[6][4] = 'P';
    board[7][4] = 'K'; // white king
    expect(isLegalMove('P', { row: 6, col: 4 }, { row: 5, col: 4 }, board)).toBe(true);
  });

  test('black pawn moves two from start', () => {
    const board = makeEmptyBoard();
    board[1][3] = 'p';
    board[0][4] = 'k'; // black king
    expect(isLegalMove('p', { row: 1, col: 3 }, { row: 3, col: 3 }, board)).toBe(true);
  });

  test('pawn cannot move sideways', () => {
    const board = makeEmptyBoard();
    board[6][4] = 'P';
    board[7][4] = 'K';
    expect(isLegalMove('P', { row: 6, col: 4 }, { row: 6, col: 5 }, board)).toBe(false);
  });
});

describe('isLegalMove - knights', () => {
  test('white knight moves in L shape', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'N';
    board[7][4] = 'K';
    expect(isLegalMove('N', { row: 4, col: 4 }, { row: 6, col: 5 }, board)).toBe(true);
  });

  test('knight cannot move diagonally', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'N';
    board[7][4] = 'K';
    expect(isLegalMove('N', { row: 4, col: 4 }, { row: 5, col: 5 }, board)).toBe(false);
  });
});

describe('isLegalMove - bishops', () => {
  test('bishop moves diagonally', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'B';
    board[7][4] = 'K';
    expect(isLegalMove('B', { row: 4, col: 4 }, { row: 6, col: 6 }, board)).toBe(true);
  });

  test('bishop blocked by piece', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'B';
    board[5][5] = 'P';
    board[7][4] = 'K';
    expect(isLegalMove('B', { row: 4, col: 4 }, { row: 6, col: 6 }, board)).toBe(false);
  });
});

describe('isLegalMove - rooks', () => {
  test('rook moves straight', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'R';
    board[7][4] = 'K';
    expect(isLegalMove('R', { row: 4, col: 4 }, { row: 4, col: 0 }, board)).toBe(true);
  });

  test('rook blocked by piece', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'R';
    board[4][2] = 'P';
    board[7][4] = 'K';
    expect(isLegalMove('R', { row: 4, col: 4 }, { row: 4, col: 0 }, board)).toBe(false);
  });
});

describe('isLegalMove - queens', () => {
  test('queen moves diagonally', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'Q';
    board[7][4] = 'K';
    expect(isLegalMove('Q', { row: 4, col: 4 }, { row: 7, col: 7 }, board)).toBe(true);
  });

  test('queen moves straight', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'Q';
    board[7][4] = 'K';
    expect(isLegalMove('Q', { row: 4, col: 4 }, { row: 1, col: 4 }, board)).toBe(true);
  });
});

describe('isLegalMove - kings', () => {
  test('king moves one square', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'K';
    expect(isLegalMove('K', { row: 4, col: 4 }, { row: 5, col: 4 }, board)).toBe(true);
  });

  test('king cannot move two squares', () => {
    const board = makeEmptyBoard();
    board[4][4] = 'K';
    expect(isLegalMove('K', { row: 4, col: 4 }, { row: 6, col: 4 }, board, false, null, null)).toBe(false);
  });
});
