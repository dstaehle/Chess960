// influenceRenderer.js

export function renderPawnInfluence(svg, cell, row, col, side, color) {
  const sources = cell[side].filter(inf => inf.piece === 'p' && inf.from);

  for (const inf of sources) {
    const from = inf.from;
    const dx = col - from.col;
    const dy = row - from.row;

    const isDiagonalPawnAttack =
      Math.abs(dx) === 1 &&
      ((side === "white" && dy === -1) || (side === "black" && dy === 1));

    if (!isDiagonalPawnAttack) continue;

    const isRight = dx > 0;
    drawPawnInfluenceBand(svg, side, isRight, color);
  }
}

function drawPawnInfluenceBand(svg, side, isRight, color) {
  const spacing = 15;
  const stroke = side === "white" ? "#00bcd4" : "#dc143c";
  const isWhite = side === "white";

  for (let offset = -30; offset <= 30; offset += spacing) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    // Flip direction for left influence
    const flip = !isRight;

    if (isWhite) {
      line.setAttribute("x1", flip ? offset + 60 : offset);
      line.setAttribute("y1", 60);
      line.setAttribute("x2", flip ? offset : offset + 60);
      line.setAttribute("y2", 0);
    } else {
      line.setAttribute("x1", flip ? offset + 60 : offset);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", flip ? offset : offset + 60);
      line.setAttribute("y2", 60);
    }

    line.setAttribute("stroke", stroke);
    line.setAttribute("stroke-width", isRight ? "1.25" : "0.8");
    line.setAttribute("stroke-opacity", "0.4");
    line.setAttribute("stroke-linecap", "round");

    svg.appendChild(line);
  }
}

export function renderKnightInfluence(svg, cell, row, col, side, color) {
  if (!cell[side].some(inf => inf.piece === 'n')) return;
  const positions = side === "white"
    ? [ { x: 30, y: 8 }, { x: 51, y: 30 }, { x: 30, y: 52 }, { x: 11, y: 30 } ]
    : [ { x: 8, y: 8 }, { x: 52, y: 8 }, { x: 8, y: 52 }, { x: 52, y: 52 } ];

  const draw = (cx, cy, type = side === "white" ? "+" : "x") => {
    const size = 3;
    if (type === "+") {
      const h = document.createElementNS("http://www.w3.org/2000/svg", "line");
      h.setAttribute("x1", cx - size);
      h.setAttribute("x2", cx + size);
      h.setAttribute("y1", cy);
      h.setAttribute("y2", cy);
      h.setAttribute("stroke", color);
      h.setAttribute("stroke-width", "1.5");
      svg.appendChild(h);

      const v = document.createElementNS("http://www.w3.org/2000/svg", "line");
      v.setAttribute("x1", cx);
      v.setAttribute("x2", cx);
      v.setAttribute("y1", cy - size);
      v.setAttribute("y2", cy + size);
      v.setAttribute("stroke", color);
      v.setAttribute("stroke-width", "1.5");
      svg.appendChild(v);
    } else {
      const d1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      d1.setAttribute("x1", cx - size);
      d1.setAttribute("y1", cy - size);
      d1.setAttribute("x2", cx + size);
      d1.setAttribute("y2", cy + size);
      d1.setAttribute("stroke", color);
      d1.setAttribute("stroke-width", "1.5");
      svg.appendChild(d1);

      const d2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
      d2.setAttribute("x1", cx + size);
      d2.setAttribute("y1", cy - size);
      d2.setAttribute("x2", cx - size);
      d2.setAttribute("y2", cy + size);
      d2.setAttribute("stroke", color);
      d2.setAttribute("stroke-width", "1.5");
      svg.appendChild(d2);
    }
  };

  for (const pos of positions) draw(pos.x, pos.y);
}

export function renderBishopInfluence(svg, cell, row, col, side, color, boardPiece) {
  const from = cell[side].find(inf => inf.piece === 'b' && inf.from)?.from;
  if (!from) return;
  if (from.row !== row || from.col !== col) {
    const dx = col - from.col;
    const dy = row - from.row;
    const line = dx * dy > 0 ? [5, 5, 55, 55] : [5, 55, 55, 5];
    const bishopLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    bishopLine.setAttribute("x1", line[0]);
    bishopLine.setAttribute("y1", line[1]);
    bishopLine.setAttribute("x2", line[2]);
    bishopLine.setAttribute("y2", line[3]);
    bishopLine.setAttribute("stroke", color);
    bishopLine.setAttribute("stroke-width", "2");
    bishopLine.setAttribute("stroke-linecap", "round");
    svg.appendChild(bishopLine);
  } else {
    const diag1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    diag1.setAttribute("x1", 5);
    diag1.setAttribute("y1", 5);
    diag1.setAttribute("x2", 55);
    diag1.setAttribute("y2", 55);
    diag1.setAttribute("stroke", color);
    diag1.setAttribute("stroke-width", "2");
    diag1.setAttribute("stroke-linecap", "round");
    svg.appendChild(diag1);

    const diag2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    diag2.setAttribute("x1", 5);
    diag2.setAttribute("y1", 55);
    diag2.setAttribute("x2", 55);
    diag2.setAttribute("y2", 5);
    diag2.setAttribute("stroke", color);
    diag2.setAttribute("stroke-width", "2");
    diag2.setAttribute("stroke-linecap", "round");
    svg.appendChild(diag2);
  }
}

export function renderRookInfluence(svg, cell, row, col, side, color, boardPiece) {
  const from = cell[side].find(inf => inf.piece === 'r' && inf.from)?.from;
  if (!from) return;
  const dx = col - from.col;
  const dy = row - from.row;
  if (from.row !== row || from.col !== col) {
    let line = null;
    if (dx === 0 && dy < 0) line = [30, 60, 30, 45];
    else if (dx === 0 && dy > 0) line = [30, 0, 30, 15];
    else if (dy === 0 && dx < 0) line = [60, 30, 45, 30];
    else if (dy === 0 && dx > 0) line = [0, 30, 15, 30];

    if (line) {
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
      arrow.setAttribute("x1", line[0]);
      arrow.setAttribute("y1", line[1]);
      arrow.setAttribute("x2", line[2]);
      arrow.setAttribute("y2", line[3]);
      arrow.setAttribute("stroke", color);
      arrow.setAttribute("stroke-width", "4");
      arrow.setAttribute("stroke-linecap", "round");
      svg.appendChild(arrow);
    }
  } else {
    const yCoords = [20, 40];
    for (const y of yCoords) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", 10);
      line.setAttribute("y1", y);
      line.setAttribute("x2", 50);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-linecap", "round");
      svg.appendChild(line);
    }
  }
}

export function renderQueenInfluence(svg, cell, row, col, side, color, boardPiece) {
  const sources = cell[side].filter(inf => inf.piece === 'q' && inf.from);
  if (sources.length === 0) return;

  for (const inf of sources) {
    const from = inf.from;
    if (!from) continue;

    const isOccupying = from.row === row && from.col === col;

    const positions = isOccupying
      ? [
          { x: 30, y: 8 },
          { x: 52, y: 30 },
          { x: 30, y: 52 },
          { x: 8, y: 30 }
        ]
      : side === "white"
      ? [ { x: 30, y: 8 }, { x: 51, y: 30 }, { x: 30, y: 52 }, { x: 11, y: 30 } ]
      : [ { x: 8, y: 8 }, { x: 52, y: 8 }, { x: 8, y: 52 }, { x: 52, y: 52 } ];

    for (const pos of positions) {
      const inner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      inner.setAttribute("cx", pos.x);
      inner.setAttribute("cy", pos.y);
      inner.setAttribute("r", "3");
      inner.setAttribute("fill", color);
      svg.appendChild(inner);

      const outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      outer.setAttribute("cx", pos.x);
      outer.setAttribute("cy", pos.y);
      outer.setAttribute("r", "4.5");
      outer.setAttribute("fill", "none");
      outer.setAttribute("stroke", color);
      outer.setAttribute("stroke-width", "1.5");
      svg.appendChild(outer);
    }
  }
}


export function renderKingInfluence(svg, cell, row, col, side, color, boardPiece) {
  const kingChar = side === "white" ? 'K' : 'k';
  const isKingHere = boardPiece === kingChar;
  const influencesHere = cell[side].some(inf => inf.piece === 'k');

  if (influencesHere && !isKingHere) {
    const kingOutline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    kingOutline.setAttribute("x", 6);
    kingOutline.setAttribute("y", 6);
    kingOutline.setAttribute("width", 48);
    kingOutline.setAttribute("height", 48);
    kingOutline.setAttribute("fill", "none");
    kingOutline.setAttribute("stroke", color);
    kingOutline.setAttribute("stroke-width", "1");
    kingOutline.setAttribute("stroke-dasharray", "4,2");
    svg.appendChild(kingOutline);
  }

  if (isKingHere) {
    const kingOutline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    kingOutline.setAttribute("x", 16);
    kingOutline.setAttribute("y", 16);
    kingOutline.setAttribute("width", 28);
    kingOutline.setAttribute("height", 28);
    kingOutline.setAttribute("fill", "none");
    kingOutline.setAttribute("stroke", color);
    kingOutline.setAttribute("stroke-width", "2");
    kingOutline.setAttribute("stroke-dasharray", "4,2");
    svg.appendChild(kingOutline);
  }
}

export function renderInfluenceMap(influenceMap, board, lastMove) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
      if (!square) continue;

      const svg = square.querySelector("svg");
      if (!svg) continue;

      const cell = influenceMap[row][col];
      const boardPiece = board[row][col];

      renderQueenInfluence(svg, cell, row, col, "white", "#adc6c9", boardPiece);
      renderQueenInfluence(svg, cell, row, col, "black", "#c75b71", boardPiece);

      renderPawnInfluence(svg, cell, row, col, "white", "#00bcd4");
      renderPawnInfluence(svg, cell, row, col, "black", "#dc143c");

      renderKnightInfluence(svg, cell, row, col, "white", "#00bcd4");
      renderKnightInfluence(svg, cell, row, col, "black", "#dc143c");

      renderBishopInfluence(svg, cell, row, col, "white", "#00bcd4", boardPiece);
      renderBishopInfluence(svg, cell, row, col, "black", "#dc143c", boardPiece);

      renderRookInfluence(svg, cell, row, col, "white", "#00bcd4", boardPiece);
      renderRookInfluence(svg, cell, row, col, "black", "#dc143c", boardPiece);

      renderKingInfluence(svg, cell, row, col, "white", "#00bcd4", boardPiece);
      renderKingInfluence(svg, cell, row, col, "black", "#dc143c", boardPiece);
    }
  }
}
