

// game.js
import {
  PIECES,
  createInitialBoard,
  isLegalMove,
  isInCheck,
  isCheckmate,
  hasAnyLegalMoves,
  isWhitePiece,
  isBlackPiece,
  findKingPosition,
  generateChess960BackRank
} from './engine.js';


// game logic, init, event handlers here


const boardElement = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const gameStatusDiv = document.getElementById('gameStatus');

let boardState, currentPlayer, selectedSquare, legalMoves, gameOver, lastMove;

function initializeGame() {
  const init = createInitialBoard();
  boardState = init.board;
  currentPlayer = 'white';
  selectedSquare = null;
  legalMoves = [];
  gameOver = false;
  lastMove = null;


  renderBoard();
  updateTurnIndicator();
  clearGameStatus();
}

function renderBoard() {
  boardElement.innerHTML = ''; // clear existing board
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement('div');
      square.classList.add('square', (r + c) % 2 === 0 ? 'light-square' : 'dark-square');
      square.dataset.row = r;
      square.dataset.col = c;
      square.style.fontSize = '36px';
      const piece = boardState[r][c];
      if (piece) {
        square.textContent = PIECES[piece];
        square.classList.add(isWhitePiece(piece) ? 'white-piece' : 'black-piece');
      }
      square.addEventListener('click', onSquareClick);
      boardElement.appendChild(square);
    }
  }
  highlightLegalMoves();
}

function updateTurnIndicator() {
  turnIndicator.textContent = currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1) + "'s turn";
}

function clearGameStatus() {
  gameStatusDiv.textContent = '';
}

function highlightLegalMoves() {
  const squares = document.querySelectorAll('.square');
  squares.forEach(sq => {
    sq.style.outline = '';
  });
  legalMoves.forEach(move => {
    const selector = `.square[data-row="${move.row}"][data-col="${move.col}"]`;
    const sq = document.querySelector(selector);
    if (sq) sq.style.outline = '2px dashed orange';
  });
}

function onSquareClick(e) {
  if (gameOver) return;

  const row = +e.currentTarget.dataset.row;
  const col = +e.currentTarget.dataset.col;
  const clickedPiece = boardState[row][col];

  if (selectedSquare === null) {
    if (!clickedPiece) return;
    if ((currentPlayer === 'white' && !isWhitePiece(clickedPiece)) ||
        (currentPlayer === 'black' && !isBlackPiece(clickedPiece))) return;

    selectedSquare = { row, col };
    legalMoves = getLegalMovesForPiece(clickedPiece, selectedSquare, boardState);
    legalMoves = legalMoves.filter(move => {
      // filter moves that leave king safe
      const testBoard = copyBoard(boardState);
      testBoard[move.row][move.col] = clickedPiece;
      testBoard[selectedSquare.row][selectedSquare.col] = null;
      return !isInCheck(testBoard, currentPlayer, lastMove);
    });
    highlightLegalMoves();
  } else {
    // Attempt move
    const moveIsLegal = legalMoves.some(m => m.row === row && m.col === col);
    if (!moveIsLegal) {
      selectedSquare = null;
      legalMoves = [];
      renderBoard();
      return;
    }

    makeMove(selectedSquare, { row, col });
  }
  console.log('Clicked square', row, col, 'Piece:', clickedPiece);
  console.log('Current player:', currentPlayer);

}

function makeMove(from, to) {
  const piece = boardState[from.row][from.col];

  // En passant logic
  if (
    piece.toLowerCase() === 'p' &&
    Math.abs(to.col - from.col) === 1 &&
    !boardState[to.row][to.col] &&
    lastMove &&
    lastMove.piece.toLowerCase() === 'p' &&
    Math.abs(lastMove.to.row - lastMove.from.row) === 2 &&
    lastMove.to.row === from.row &&
    lastMove.to.col === to.col
  ) 

  {
    const dir = currentPlayer === 'white' ? 1 : -1;
    const capturedRow = to.row + dir;
    boardState[capturedRow][to.col] = null;
  }


  boardState[to.row][to.col] = piece;
  boardState[from.row][from.col] = null;
  lastMove = { piece, from, to };

  selectedSquare = null;
  legalMoves = [];

  const opponent = currentPlayer === 'white' ? 'black' : 'white';

  if (isCheckmate(boardState, opponent)) {
    gameStatusDiv.textContent = `Checkmate! ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins.`;
    gameOver = true;
  } else if (isInCheck(boardState, opponent)) {
    gameStatusDiv.textContent = 'Check!';
  } else {
    gameStatusDiv.textContent = '';
  }

  currentPlayer = opponent;
  updateTurnIndicator();
  renderBoard();
  console.log(`Move made by ${currentPlayer}: ${piece} from`, from, 'to', to);
  console.log('Next player:', currentPlayer === 'white' ? 'black' : 'white');

}



function getLegalMovesForPiece(piece, from, board) {
  const moves = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isLegalMove(piece, from, { row: r, col: c }, board, false, lastMove)) 
        {
        moves.push({ row: r, col: c });
      }

    }
  }

  return moves;
}


function copyBoard(board) {
  return board.map(row => row.slice());
}

// Initialize game on load
initializeGame();
