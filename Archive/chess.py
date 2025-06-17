import tkinter as tk

BOARD_SIZE = 8
SQUARE_SIZE = 60

# Piece positions (row, col)
pawn_position = [6, 4]
bishop_position = [4, 3]
queen_position = [4, 4]
rook_position = [3, 0]
knight_position = [5, 2]
king_position = [7, 4]

selected_piece = None  # Currently selected piece for moving

# Symbols for pieces
PIECE_SYMBOLS = {
    'pawn': '♙',
    'bishop': '♗',
    'queen': '♕',
    'rook': '♖',
    'knight': '♘',
    'king': '♔',
}

# Colors for control symbols
CONTROL_COLOR = {
    'pawn': 'lightblue',
    'bishop': 'purple',
    'queen': 'orange',
    'rook': 'red',
    'knight': 'green',
    'king': 'brown',
}

def draw_arrow(canvas, x1, y1, x2, y2, color):
    canvas.create_line(x1, y1, x2, y2, arrow=tk.LAST, fill=color, width=2)

def draw_control_symbol(canvas, row, col, symbol="•", color="black"):
    x = col * SQUARE_SIZE + SQUARE_SIZE // 2
    y = row * SQUARE_SIZE + SQUARE_SIZE // 2
    canvas.create_text(x, y, text=symbol, fill=color, font=("Arial", 16, "bold"))

def draw_knight_control_symbols(canvas, row, col, color="purple"):
    cx = col * SQUARE_SIZE
    cy = row * SQUARE_SIZE
    offsets = [
        (SQUARE_SIZE // 2, 5),  # top
        (SQUARE_SIZE - 5, SQUARE_SIZE // 2),  # right
        (SQUARE_SIZE // 2, SQUARE_SIZE - 5),  # bottom
        (5, SQUARE_SIZE // 2)  # left
    ]
    for dx, dy in offsets:
        canvas.create_text(cx + dx, cy + dy, text="✕", fill=color, font=("Arial", 10, "bold"))

def draw_board(canvas):
    canvas.delete("all")
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            x1, y1 = col * SQUARE_SIZE, row * SQUARE_SIZE
            x2, y2 = x1 + SQUARE_SIZE, y1 + SQUARE_SIZE

            is_light = (row + col) % 2 == 0
            fill = "#EEEED2" if is_light else "#769656"

            # Highlight legal moves if a piece is selected
            if selected_piece:
                legal_moves = get_legal_moves(selected_piece)
                if (row, col) in legal_moves:
                    fill = "lightgreen"

            # Highlight squares controlled by all pieces (for demo)
            controlled = get_all_controlled_squares()
            if (row, col) in controlled and not (selected_piece and (row, col) in legal_moves):
                fill = "#ADD8E6"  # light blue for controlled squares

            canvas.create_rectangle(x1, y1, x2, y2, fill=fill, outline="black")

    # Draw pieces
    draw_piece(canvas, pawn_position, 'pawn')
    draw_piece(canvas, bishop_position, 'bishop')
    draw_piece(canvas, queen_position, 'queen')
    draw_piece(canvas, rook_position, 'rook')
    draw_piece(canvas, knight_position, 'knight')
    draw_piece(canvas, king_position, 'king')

    # Draw controls
    draw_pawn_control(canvas, pawn_position)
    draw_bishop_control(canvas, bishop_position)
    draw_rook_control(canvas, rook_position)
    draw_queen_control(canvas, queen_position)
    draw_knight_control(canvas, knight_position)
    draw_king_control(canvas, king_position)

def draw_piece(canvas, pos, piece_name):
    row, col = pos
    x = col * SQUARE_SIZE + SQUARE_SIZE // 2
    y = row * SQUARE_SIZE + SQUARE_SIZE // 2
    symbol = PIECE_SYMBOLS[piece_name]
    canvas.create_text(x, y, text=symbol, font=("Arial", 32), fill="black")

def get_all_controlled_squares():
    controlled = set()
    controlled.update(get_pawn_control(pawn_position))
    controlled.update(get_bishop_control(bishop_position))
    controlled.update(get_rook_control(rook_position))
    controlled.update(get_queen_control(queen_position))
    controlled.update(get_knight_control(knight_position))
    controlled.update(get_king_control(king_position))
    return controlled

# ----- Pawn -----
def get_pawn_control(pos):
    row, col = pos
    controls = []
    for dc in [-1, 1]:
        r, c = row - 1, col + dc
        if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
            controls.append((r, c))
    return controls

def draw_pawn_control(canvas, pos):
    for r, c in get_pawn_control(pos):
        draw_control_symbol(canvas, r, c, symbol="•", color=CONTROL_COLOR['pawn'])

def get_pawn_legal_moves(pos):
    row, col = pos
    moves = []
    # Move forward if empty
    if row - 1 >= 0 and not is_occupied((row - 1, col)):
        moves.append((row - 1, col))
    return moves

# ----- Bishop -----
def get_bishop_control(pos):
    directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    controls = set()
    for dr, dc in directions:
        r, c = pos
        while True:
            r += dr
            c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
                controls.add((r, c))
                if (r, c) in all_piece_positions():
                    break
            else:
                break
    return controls

def draw_bishop_control(canvas, pos):
    directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    for dr, dc in directions:
        r, c = pos
        cx1 = (pos[1] + 0.5) * SQUARE_SIZE
        cy1 = (pos[0] + 0.5) * SQUARE_SIZE
        while True:
            r += dr
            c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
                cx2 = (c + 0.5) * SQUARE_SIZE
                cy2 = (r + 0.5) * SQUARE_SIZE
                draw_arrow(canvas, cx1, cy1, cx2, cy2, CONTROL_COLOR['bishop'])
                if (r, c) in all_piece_positions():
                    break
            else:
                break

def get_bishop_legal_moves(pos):
    moves = []
    directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
    for dr, dc in directions:
        r, c = pos
        while True:
            r += dr
            c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
                if is_occupied((r, c)):
                    break
                moves.append((r, c))
            else:
                break
    return moves

# ----- Rook -----
def get_rook_control(pos):
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    controls = set()
    for dr, dc in directions:
        r, c = pos
        while True:
            r += dr
            c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
                controls.add((r, c))
                if (r, c) in all_piece_positions():
                    break
            else:
                break
    return controls

def draw_rook_control(canvas, pos):
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    for dr, dc in directions:
        r, c = pos
        cx1 = (pos[1] + 0.5) * SQUARE_SIZE
        cy1 = (pos[0] + 0.5) * SQUARE_SIZE
        while True:
            r += dr
            c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
                cx2 = (c + 0.5) * SQUARE_SIZE
                cy2 = (r + 0.5) * SQUARE_SIZE
                draw_arrow(canvas, cx1, cy1, cx2, cy2, CONTROL_COLOR['rook'])
                if (r, c) in all_piece_positions():
                    break
            else:
                break

def get_rook_legal_moves(pos):
    moves = []
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    for dr, dc in directions:
        r, c = pos
        while True:
            r += dr
            c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
                if is_occupied((r, c)):
                    break
                moves.append((r, c))
            else:
                break
    return moves

# ----- Queen -----
def get_queen_control(pos):
    directions = [
        (-1, -1), (-1, 1), (1, -1), (1, 1),
        (-1, 0), (1, 0), (0, -1), (0, 1)
    ]
    controls = set()
    for dr, dc in directions:
        r, c = pos
        while True:
            r += dr
            c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
                controls.add((r, c))
                if (r, c) in all_piece_positions():
                    break
            else:
                break
    return controls

def draw_queen_control_symbols(canvas, row, col, color="purple"):
    center_x = col * SQUARE_SIZE + SQUARE_SIZE // 2
    center_y = row * SQUARE_SIZE + SQUARE_SIZE // 2
    radius = 4
    offset = SQUARE_SIZE // 2 - 10  # distance from center to edge

    positions = [
        (center_x, center_y - offset),  # 12 o'clock
        (center_x + offset, center_y),  # 3 o'clock
        (center_x, center_y + offset),  # 6 o'clock
        (center_x - offset, center_y),  # 9 o'clock
    ]

    for (x, y) in positions:
        canvas.create_oval(x - radius, y - radius, x + radius, y + radius, fill=color, outline=color)

def draw_queen_control(canvas, pos):
    directions = [
        (-1, -1), (-1, 1), (1, -1), (1, 1),  # diagonals
        (-1, 0), (1, 0), (0, -1), (0, 1)     # straight lines
    ]
    for dr, dc in directions:
        r, c = pos
        while True:
            r += dr
            c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
                draw_queen_control_symbols(canvas, r, c, color=CONTROL_COLOR['queen'])
                if (r, c) in all_piece_positions():
                    break
            else:
                break


def get_queen_legal_moves(pos):
    moves = []
    directions = [
        (-1, -1), (-1, 1), (1, -1), (1, 1),
        (-1, 0), (1, 0), (0, -1), (0, 1)
    ]
    for dr, dc in directions:
        r, c = pos
        while True:
            r += dr
            c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
                if is_occupied((r, c)):
                    break
                moves.append((r, c))
            else:
                break
    return moves

# ----- Knight -----
def get_knight_control(pos):
    row, col = pos
    candidates = [
        (row-2, col-1), (row-2, col+1),
        (row-1, col-2), (row-1, col+2),
        (row+1, col-2), (row+1, col+2),
        (row+2, col-1), (row+2, col+1)
    ]
    controls = set()
    for r, c in candidates:
        if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
            controls.add((r, c))
    return controls

def draw_knight_control(canvas, pos):
    for r, c in get_knight_control(pos):
        draw_knight_control_symbols(canvas, r, c, color=CONTROL_COLOR['knight'])

def draw_knight_control_symbols(canvas, row, col, color="purple"):
    cx = col * SQUARE_SIZE
    cy = row * SQUARE_SIZE
    offsets = [
        (SQUARE_SIZE // 2, 5),  # top
        (SQUARE_SIZE - 5, SQUARE_SIZE // 2),  # right
        (SQUARE_SIZE // 2, SQUARE_SIZE - 5),  # bottom
        (5, SQUARE_SIZE // 2)  # left
    ]
    for dx, dy in offsets:
        canvas.create_text(cx + dx, cy + dy, text="✕", fill=color, font=("Arial", 10, "bold"))

def get_knight_legal_moves(pos):
    # Knight can jump over pieces, so legal moves are just all in bounds squares not occupied
    moves = []
    for square in get_knight_control(pos):
        if not is_occupied(square):
            moves.append(square)
    return moves

# ----- King -----
def get_king_control(pos):
    row, col = pos
    candidates = [
        (row-1, col-1), (row-1, col), (row-1, col+1),
        (row, col-1),               (row, col+1),
        (row+1, col-1), (row+1, col), (row+1, col+1)
    ]
    controls = set()
    for r, c in candidates:
        if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE:
            controls.add((r, c))
    return controls

def draw_king_control(canvas, pos):
    for r, c in get_king_control(pos):
        draw_control_symbol(canvas, r, c, symbol="♚", color=CONTROL_COLOR['king'])

def get_king_legal_moves(pos):
    moves = []
    for square in get_king_control(pos):
        if not is_occupied(square):
            moves.append(square)
    return moves

def all_piece_positions():
    return {
        tuple(pawn_position),
        tuple(bishop_position),
        tuple(queen_position),
        tuple(rook_position),
        tuple(knight_position),
        tuple(king_position)
    }

def is_occupied(pos):
    return pos in all_piece_positions()

def get_legal_moves(pos):
    if pos == tuple(pawn_position):
        return get_pawn_legal_moves(pos)
    elif pos == tuple(bishop_position):
        return get_bishop_legal_moves(pos)
    elif pos == tuple(rook_position):
        return get_rook_legal_moves(pos)
    elif pos == tuple(queen_position):
        return get_queen_legal_moves(pos)
    elif pos == tuple(knight_position):
        return get_knight_legal_moves(pos)
    elif pos == tuple(king_position):
        return get_king_legal_moves(pos)
    return []

def on_click(event, canvas):
    global selected_piece

    col = event.x // SQUARE_SIZE
    row = event.y // SQUARE_SIZE
    clicked = (row, col)

    pieces = {
        tuple(pawn_position): 'pawn',
        tuple(bishop_position): 'bishop',
        tuple(queen_position): 'queen',
        tuple(rook_position): 'rook',
        tuple(knight_position): 'knight',
        tuple(king_position): 'king',
    }

    if not selected_piece:
        # Select piece if clicked
        if clicked in pieces:
            selected_piece = clicked
    else:
        # Move selected piece if legal move
        if clicked in get_legal_moves(selected_piece):
            # Update the piece position
            if selected_piece == tuple(pawn_position):
                pawn_position[0], pawn_position[1] = clicked
            elif selected_piece == tuple(bishop_position):
                bishop_position[0], bishop_position[1] = clicked
            elif selected_piece == tuple(rook_position):
                rook_position[0], rook_position[1] = clicked
            elif selected_piece == tuple(queen_position):
                queen_position[0], queen_position[1] = clicked
            elif selected_piece == tuple(knight_position):
                knight_position[0], knight_position[1] = clicked
            elif selected_piece == tuple(king_position):
                king_position[0], king_position[1] = clicked
        selected_piece = None

    draw_board(canvas)

def main():
    root = tk.Tk()
    root.title("Chessboard with Multiple Pieces and Move Logic")

    canvas = tk.Canvas(root, width=BOARD_SIZE * SQUARE_SIZE, height=BOARD_SIZE * SQUARE_SIZE)
    canvas.pack()

    canvas.bind("<Button-1>", lambda e: on_click(e, canvas))
    draw_board(canvas)

    root.mainloop()

if __name__ == "__main__":
    main()
