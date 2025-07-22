//ui.js
import { updateBoard } from './uiBoard.js';

import {
  initializeGame,
  promotePawn
} from './game.js';

import {
  createBoard,
  restartGame
} from './uiHandlers.js';

const promotionButtons = document.querySelectorAll('.promotion-btn');

export function showPromotionModal(isWhite) {
  promotionModal.setAttribute('aria-hidden', 'false');
  promotionModal.style.display = 'block';

  promotionButtons.forEach(btn => {
    btn.onclick = () => {
      const selected = btn.dataset.piece;
      promotePawn(selected);
      promotionModal.setAttribute('aria-hidden', 'true');
      promotionModal.style.display = 'none';
      updateBoard();
    };
  });
}

document.addEventListener("DOMContentLoaded", () => {
	initializeGame();
	createBoard();
	updateBoard();

	document.getElementById("restartBtn").addEventListener("click", () => {
		restartGame();
	});
});