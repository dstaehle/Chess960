import { isWhitePiece, isBlackPiece } from './engine.js';

describe('isWhitePiece()', () => {
  test('returns true for uppercase (white) pieces', () => {
    expect(isWhitePiece('P')).toBe(true);
  });

  test('returns false for lowercase (black) pieces', () => {
    expect(isWhitePiece('p')).toBe(false);
  });

  test('returns false for invalid inputs', () => {
    expect(isWhitePiece(null)).toBe(false);
    expect(isWhitePiece('')).toBe(false);
  });
});

describe('isBlackPiece()', () => {
  test('returns true for lowercase (black) pieces', () => {
    expect(isBlackPiece('p')).toBe(true);
    expect(isBlackPiece('k')).toBe(true);
  });

  test('returns false for uppercase (white) pieces', () => {
    expect(isBlackPiece('P')).toBe(false);
    expect(isBlackPiece('Q')).toBe(false);
  });

  test('returns false for invalid inputs', () => {
    expect(isBlackPiece(null)).toBe(false);
    expect(isBlackPiece('')).toBe(false);
  });
});
