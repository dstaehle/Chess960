// engine.js

function getPieceSVG(piece) {
  if (!piece) return null;
  const code = piece.toLowerCase();
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  return `pieces/${color}${code}.svg`; // Example: pieces/alpha/wk.svg
}

function isWhitePiece(p) {
  return p && p === p.toUpperCase();
}

function isBlackPiece(p) {
  return p && p === p.toLowerCase();
}

function generateChess960BackRank() {
  const pieces = Array(8).fill(null);
  const dark = [0, 2, 4, 6], light = [1, 3, 5, 7];
  
  pieces[dark[Math.floor(Math.random() * dark.length)]] = 'b';
  pieces[light[Math.floor(Math.random() * light.length)]] = 'b';

  while (true) {
    const i = Math.floor(Math.random() * 8);
    if (!pieces[i]) {
      pieces[i] = 'q';
      break;
    }
  }

  let knightsPlaced = 0;
  while (knightsPlaced < 2) {
    const i = Math.floor(Math.random() * 8);
    if (!pieces[i]) {
      pieces[i] = 'n';
      knightsPlaced++;
    }
  }

  const empty = pieces.map((p, i) => p === null ? i : -1).filter(i => i !== -1).sort();
  const [r1, k, r2] = [empty[0], empty[1], empty[2]];
  pieces[r1] = 'r';
  pieces[k] = 'k';
  pieces[r2] = 'r';

  return pieces;
}

function createInitialBoard() {
  const whiteBack = generateChess960BackRank().map(p => p.toUpperCase());
  const blackBack = whiteBack.map(p => p.toLowerCase());
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let col = 0; col < 8; col++) {
    board[0][col] = blackBack[col];
    board[1][col] = 'p';
    board[6][col] = 'P';
    board[7][col] = whiteBack[col];
  }

  // Get start positions
  const whiteKingCol = whiteBack.findIndex(p => p === 'K');
  const whiteRookCols = whiteBack.map((p, i) => (p === 'R' ? i : null)).filter(i => i !== null);

  const blackKingCol = blackBack.findIndex(p => p === 'k');
  const blackRookCols = blackBack.map((p, i) => (p === 'r' ? i : null)).filter(i => i !== null);

  const castlingInfo = {
    white: {
      kingStartCol: whiteKingCol,
      rookCols: whiteRookCols,
      kingSideTarget: 6, // g1
      queenSideTarget: 2 // c1
    },
    black: {
      kingStartCol: blackKingCol,
      rookCols: blackRookCols,
      kingSideTarget: 6, // g8
      queenSideTarget: 2 // c8
    }
  };

  return { board, whiteBack, blackBack, castlingInfo };
}


function isPathClear(from, to, board) {
  const stepRow = Math.sign(to.row - from.row);
  const stepCol = Math.sign(to.col - from.col);
  let r = from.row + stepRow;
  let c = from.col + stepCol;
  while (r !== to.row || c !== to.col) {
    if (board[r][c]) return false;
    r += stepRow;
    c += stepCol;
  }
  return true;
}

function isSquareAttacked(board, row, col, attackerIsWhite, lastMove = null) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && (attackerIsWhite ? isWhitePiece(piece) : isBlackPiece(piece))) {
        const from = { row: r, col: c };
        const to = { row, col };
        if (isLegalMove(piece, from, to, board, true, lastMove)) {
          return true;
        }
      }
    }
  }
  return false;
}


function findKingPosition(board, isWhite) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (
        piece &&
        piece.toLowerCase() === 'k' &&
        (isWhite ? isWhitePiece(piece) : isBlackPiece(piece))
      ) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function isLegalMove(piece, from, to, board, skipCheckTest = false, lastMove = null) {
  if (!from || !to || !board || !piece) return false;
  if (typeof from.row !== "number" || typeof from.col !== "number" ||
      typeof to.row !== "number" || typeof to.col !== "number") return false;

  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const pieceType = piece.toLowerCase();
  const isWhite = isWhitePiece(piece);
  const target = board[to.row][to.col];

  if (target && isWhitePiece(target) === isWhite) return false;

  let valid = false;
  let enPassantCapture = false;

  switch (pieceType) {
    case 'p': {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      if (dc === 0 && dr === dir && !target) valid = true;
      else if (dc === 0 && dr === 2 * dir && from.row === startRow && !target && !board[from.row + dir][from.col]) valid = true;
      else if (Math.abs(dc) === 1 && dr === dir && target && isWhitePiece(target) !== isWhite) valid = true;
      else if (Math.abs(dc) === 1 && dr === dir &&
        lastMove?.piece?.toLowerCase?.() === 'p' &&
        Math.abs(lastMove.to.row - lastMove.from.row) === 2 &&
        lastMove.to.row === from.row &&
        lastMove.to.col === to.col) {
        valid = true;
        enPassantCapture = true;
      }
      break;
    }

    case 'n':
      valid = (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      break;

    case 'b':
      valid = Math.abs(dr) === Math.abs(dc) && isPathClear(from, to, board);
      break;

    case 'r':
      valid = (dr === 0 || dc === 0) && isPathClear(from, to, board);
      break;

    case 'q':
      valid = (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) && isPathClear(from, to, board);
      break;

    case 'k': {
      if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) {
        valid = true;
        break;
      }

      // Handle Chess960 castling
      const castlingTargets = {
        white: { kingSide: 6, queenSide: 2, row: 7 },
        black: { kingSide: 6, queenSide: 2, row: 0 }
      };
      const side = isWhite ? 'white' : 'black';
      const castlingRow = castlingTargets[side].row;
      const kingsideTarget = castlingTargets[side].kingSide;
      const queensideTarget = castlingTargets[side].queenSide;

      if (from.row === castlingRow && to.row === castlingRow && (to.col === kingsideTarget || to.col === queensideTarget)) {
        const kingStartCol = from.col;
        const rookCol = to.col === kingsideTarget
          ? board[castlingRow].findIndex(p => p?.toLowerCase() === 'r' && (to.col > kingStartCol ? true : false))
          : board[castlingRow].findIndex(p => p?.toLowerCase() === 'r' && (to.col < kingStartCol ? true : false));

        const rook = board[castlingRow][rookCol];
        if (!rook || rook.toLowerCase() !== 'r') return false;

        // Check path is clear between king and rook
        const step = to.col > kingStartCol ? 1 : -1;
        for (let c = kingStartCol + step; c !== rookCol; c += step) {
          if (board[castlingRow][c]) return false;
        }

        // Simulate intermediate king moves to ensure not in check
        const pathCols = [kingStartCol, kingStartCol + step, to.col];
        for (const c of pathCols) {
          const temp = board.map(r => r.slice());
          temp[castlingRow][kingStartCol] = null;
          temp[castlingRow][c] = piece;
          if (isInCheck(temp, isWhite ? 'white' : 'black')) return false;
        }

        valid = true;
      }
      break;
    }

    default:
      return false;
  }

  if (!valid) return false;

  if (skipCheckTest) return true;

  const temp = board.map(row => row.slice());
  if (enPassantCapture) temp[from.row][to.col] = null;

  temp[to.row][to.col] = piece;
  temp[from.row][from.col] = null;

  const kingPos = pieceType === 'k' ? to : findKingPosition(temp, isWhite);
  return !isSquareAttacked(temp, kingPos.row, kingPos.col, !isWhite);
}




function getAllKnightInfluence(board) {
  const influence = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.toLowerCase() === 'n') {
        const moves = getKnightInfluenceAt(row, col, board);
        influence.push(...moves);
      }
    }
  }
  return influence;
}

function getKnightInfluenceAt(row, col, board) {
  const moves = [
    { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
    { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
    { dr: 1, dc: -2 },  { dr: 1, dc: 2 },
    { dr: 2, dc: -1 },  { dr: 2, dc: 1 }
  ];

  const influence = [];

  for (const move of moves) {
    const newRow = row + move.dr;
    const newCol = col + move.dc;

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      influence.push({ row: newRow, col: newCol });
    }
  }

  return influence;
}



function isInCheck(board, currentPlayer, lastMove = null) {
  const isWhite = currentPlayer === 'white';
  const kingPos = findKingPosition(board, isWhite);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos.row, kingPos.col, !isWhite);
}

function hasAnyLegalMoves(board, currentPlayer) {
  const isWhite = currentPlayer === 'white';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && isWhitePiece(piece) === isWhite) {
        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            if (isLegalMove(piece, { row: r, col: c }, { row: tr, col: tc }, board)) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

function isCheckmate(board, currentPlayer) {
  return isInCheck(board, currentPlayer) && !hasAnyLegalMoves(board, currentPlayer);
}

function getPawnInfluenceAt(row, col, piece, board) {
  const isWhite = isWhitePiece(piece);
  const dir = isWhite ? -1 : 1;
  const influence = [];

  for (let dc of [-1, 1]) {
    const r = row + dir;
    const c = col + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      influence.push({ row: r, col: c });
    }
  }

  return influence;
}

export function getBishopInfluenceAt(row, col, board) {
  const directions = [
    [-1, -1], [-1, 1], [1, -1], [1, 1]  // NW, NE, SW, SE
  ];
  const influence = [];

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;

    while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
      influence.push({ row: r, col: c });
      if (board[r][c]) break;  // Stop on first piece (still add it)
      r += dr;
      c += dc;
    }
  }

  return influence;
}

function getRookInfluenceAt(row, col, board) {
  const moves = [];
  const directions = [
    { dr: -1, dc: 0 }, // up
    { dr: 1, dc: 0 },  // down
    { dr: 0, dc: -1 }, // left
    { dr: 0, dc: 1 }   // right
  ];

  for (const { dr, dc } of directions) {
    let r = row + dr;
    let c = col + dc;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      if (board[r][c]) {
        // Stop at first occupied square
        moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
  }

  return moves;
}

function getKingInfluenceAt(row, col, board) {
  const moves = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
  ];

  return moves
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter(({ row, col }) => row >= 0 && row < 8 && col >= 0 && col < 8);
}

function getQueenInfluenceAt(row, col, board) {
  const influence = [];

  // Combine bishop-like moves
  const deltas = [
    [-1, -1], [-1, 1], [1, -1], [1, 1], // diagonals
    [-1, 0], [1, 0], [0, -1], [0, 1]    // straight lines
  ];

  for (const [dr, dc] of deltas) {
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      influence.push({ row: r, col: c });
      if (board[r][c]) break; // Stop if there's a piece in the way
      r += dr;
      c += dc;
    }
  }

  return influence;
}


function buildInfluenceMap(board) {
  const influenceMap = [...Array(8)].map(() =>
    [...Array(8)].map(() => ({
      white: [],
      black: []
    }))
  );

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const isWhite = isWhitePiece(piece);
      const type = piece.toLowerCase();

      let influenceSquares = [];

      switch (type) {
        case 'n':
          influenceSquares = getKnightInfluenceAt(row, col, board);
          break;
        case 'p':
          influenceSquares = getPawnInfluenceAt(row, col, piece, board);
          break;
        case 'b':
          influenceSquares = getBishopInfluenceAt(row, col, board);
          break;
        case 'r':
          influenceSquares = getRookInfluenceAt(row, col, board);
          break;
        case 'q':
          influenceSquares = getQueenInfluenceAt(row, col, board);
          break;
        case 'k':
          influenceSquares = getKingInfluenceAt(row, col, board);
          break;
        default:
          break;

  break;
      }

      for (const { row: r, col: c } of influenceSquares) {
        if (r < 0 || r > 7 || c < 0 || c > 7) continue;
        const entry = { piece: type, from: { row, col } };
        if (isWhite) influenceMap[r][c].white.push(entry);
        else influenceMap[r][c].black.push(entry);
      }
    }
  }

  return influenceMap;
}


export {
  isWhitePiece,
  isBlackPiece,
  generateChess960BackRank,
  createInitialBoard,
  isLegalMove,
  isInCheck,
  isCheckmate,
  hasAnyLegalMoves,
  findKingPosition,
  isSquareAttacked,
  isPathClear,
  getKnightInfluenceAt,
  getAllKnightInfluence,
  buildInfluenceMap,
  getPawnInfluenceAt,
  getPieceSVG
};
