import { generateChess960BackRank } from './engine.js';

function isDarkSquare(index) {
  return index % 2 === 0;
}

function isLightSquare(index) {
  return index % 2 === 1;
}

test('returns an array of length 8', () => {
  const rank = generateChess960BackRank();
  expect(rank).toHaveLength(8);
});

test('includes exactly 1 king', () => {
  const rank = generateChess960BackRank();
  const kingCount = rank.filter(p => p === 'k').length;
  expect(kingCount).toBe(1);
});

test('includes exactly 2 rooks', () => {
  const rank = generateChess960BackRank();
  const rookCount = rank.filter(p => p === 'r').length;
  expect(rookCount).toBe(2);
});

test('king is between the rooks', () => {
  const rank = generateChess960BackRank();
  const kingIndex = rank.indexOf('k');
  const rookIndexes = rank
    .map((p, i) => (p === 'r' ? i : -1))
    .filter(i => i !== -1);
  expect(rookIndexes[0] < kingIndex && kingIndex < rookIndexes[1]).toBe(true);
});

test('includes 2 bishops on opposite-colored squares', () => {
  const rank = generateChess960BackRank();
  const bishopIndexes = rank
    .map((p, i) => (p === 'b' ? i : -1))
    .filter(i => i !== -1);
  expect(bishopIndexes.length).toBe(2);
  const [i1, i2] = bishopIndexes;
  expect((i1 % 2) !== (i2 % 2)).toBe(true);
});

test('includes 2 knights', () => {
  const rank = generateChess960BackRank();
  const knightCount = rank.filter(p => p === 'n').length;
  expect(knightCount).toBe(2);
});

test('includes 1 queen', () => {
  const rank = generateChess960BackRank();
  const queenCount = rank.filter(p => p === 'q').length;
  expect(queenCount).toBe(1);
});

test('total of 8 pieces', () => {
  const rank = generateChess960BackRank();
  expect(rank.length).toBe(8);
  expect(rank.filter(Boolean).length).toBe(8);
});
