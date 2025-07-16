// uiHandlers.js

import { updateBoard } from './uiBoard.js';
import {
	makeMove,
	promotePawn,
	getCurrentPlayer,
	getGameStatus,
	getLegalMovesForPiece,
	getBoardState,
	getLastMove,
	getCastlingInfo
} from './game.js';
import { maybeMakeBotMove } from './botLogic.js';

let selectedSquare = null;
let cachedLegalMoves = [];
let clickCooldown = false;

export function handleClick(row, col) {
	// Prevent accidental double execution
	if (clickCooldown) return;
	clickCooldown = true;
	setTimeout(() => (clickCooldown = false), 20);

	const currentPlayer = getCurrentPlayer();
	const board = getBoardState();
	const piece = board[row][col];

	const isFirstClick = selectedSquare === null;

	if (isFirstClick) {
		handleFirstClick(row, col, piece, board, currentPlayer);
	} else {
		handleSecondClick(row, col, board, currentPlayer);
	}
}

function handleFirstClick(row, col, piece, board, player) {
	if (!piece) {
		console.log("⬜️ Clicked empty square with no piece selected");
		return;
	}

	const isWhite = piece === piece.toUpperCase();
	const isPlayersPiece = (player === "white" && isWhite) || (player === "black" && !isWhite);

	if (!isPlayersPiece) {
		console.log("🚫 Clicked opponent's piece");
		return;
	}

	selectedSquare = { row, col };
	cachedLegalMoves = getLegalMovesForPiece(
		row,
		col,
		board,
		player,
		getLastMove(),
		getCastlingInfo()
	);

	console.log("✅ Selected square:", selectedSquare, "Legal moves:", cachedLegalMoves);
	updateBoard(cachedLegalMoves);
}

function handleSecondClick(row, col, board, player) {
	const from = selectedSquare;

	// Cancel if clicking same square again
	if (from.row === row && from.col === col) {
		console.log("🔄 Clicked same square — resetting selection");
		resetSelection();
		updateBoard();
		return;
	}

	const matchingMoves = cachedLegalMoves.filter(m => m.row === row && m.col === col);
	const moveMeta = matchingMoves.sort((a, b) => (b.enPassant === true) - (a.enPassant === true))[0];

	if (!moveMeta) {
		console.log("⛔ Invalid move attempt or move not found in legal moves");
		resetSelection();
		updateBoard();
		return;
	}

	const to = { row, col };
	console.log("↪️ From:", from, "To:", to);
	console.log("📦 Making move with metadata:", moveMeta);

	const result = makeMove(from, to, moveMeta);

	if (result?.requiresPromotion) {
		console.log("🛑 Promotion required");
		showPromotionModal(player === "white");
		return;
	}

	updateBoard();
	resetSelection();
	maybeMakeBotMove();
}

function resetSelection() {
	selectedSquare = null;
	cachedLegalMoves = [];
	updateBoard(); // Clears highlights
}

export function createBoard() {
	const boardEl = document.getElementById("board");
	if (!boardEl) return;

	boardEl.innerHTML = "";

	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const square = document.createElement("div");
			square.className = "square";
			square.dataset.row = row;
			square.dataset.col = col;

			const color = (row + col) % 2 === 0 ? "light" : "dark";
			square.classList.add(color);

			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("width", "60");
			svg.setAttribute("height", "60");
			svg.classList.add("influence-svg");
			square.appendChild(svg);

			boardEl.appendChild(square);
		}
	}

	// Attach single delegated handler for the board
	boardEl.onclick = e => {
		const square = e.target.closest(".square");
		if (!square) return;

		const row = parseInt(square.dataset.row, 10);
		const col = parseInt(square.dataset.col, 10);
		handleClick(row, col);
	};
}
