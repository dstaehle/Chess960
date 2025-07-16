import { getBoardState, getCurrentPlayer, getGameStatus, getLastMove } from './game.js';
import { buildInfluenceMap } from './engine.js';
import { renderInfluenceMap } from './influenceRenderer.js';
import { handleClick } from './uiHandlers.js';

// No need to re-select boardEl here; we already grab it above
const boardEl = document.getElementById("board");

export function updateBoard(legalMoves = []) {
	const turnIndicator = document.getElementById("turn-indicator");
	const gameStatusDiv = document.getElementById("gameStatus");

	if (!boardEl || !turnIndicator || !gameStatusDiv) return;

	const board = getBoardState();
	const influenceMap = buildInfluenceMap(board);
	const lastMove = getLastMove();

	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const selector = `.square[data-row="${row}"][data-col="${col}"]`;
			const square = boardEl.querySelector(selector);
			if (!square) continue;

			// 🔄 Clear content and reset state
			square.innerHTML = '';
			square.classList.remove(
				"white-piece", "black-piece", "highlight",
				"last-move-from", "last-move-to",
				"knight-influence", "influence-tl", "influence-tr",
				"influence-bl", "influence-br"
			);

			// 🔁 Assign click handler
			square.onclick = () => handleClick(row, col);

			// 🟨 Highlight legal moves
			if (legalMoves.some(m => m.row === row && m.col === col)) {
				square.classList.add("highlight");
			}

			// 🟡 Highlight last move
			if (lastMove) {
				if (lastMove.from.row === row && lastMove.from.col === col) {
					square.classList.add("last-move-from");
				}
				if (lastMove.to.row === row && lastMove.to.col === col) {
					square.classList.add("last-move-to");
				}
			}

			// ➕ Add influence SVG layer
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("width", "60");
			svg.setAttribute("height", "60");
			svg.classList.add("influence-svg");
			square.appendChild(svg);
		}
	}

	// 🎯 Render influence after SVGs exist
	renderInfluenceMap(influenceMap, board, lastMove);

	// ♟️ Draw pieces
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const pieceChar = board[row][col];
			if (!pieceChar) continue;

			const selector = `.square[data-row="${row}"][data-col="${col}"]`;
			const square = boardEl.querySelector(selector);
			if (!square) continue;

			const isWhite = pieceChar === pieceChar.toUpperCase();
			square.classList.add(isWhite ? "white-piece" : "black-piece");

			const pieceImg = document.createElement("img");
			pieceImg.className = "piece-svg";
			const pieceCode = (isWhite ? 'w' : 'b') + pieceChar.toUpperCase();
			pieceImg.src = `pieces/alpha/${pieceCode}.svg`;
			pieceImg.alt = pieceChar;
			square.appendChild(pieceImg);
		}
	}

	turnIndicator.textContent = `${getCurrentPlayer()}'s Turn`;
	gameStatusDiv.textContent = getGameStatus() || "";
}
