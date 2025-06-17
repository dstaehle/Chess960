import tkinter as tk
from PIL import Image, ImageDraw, ImageTk

# Constants
BOARD_SIZE = 8
SQUARE_SIZE = 60
PIECES = {
    'K': '♔', 'Q': '♕', 'R': '♖',
    'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜',
    'b': '♝', 'n': '♞', 'p': '♟',
}

# Globals
selected_piece = None
canvas = None
board = []

def initial_board():
    return [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p'] * 8,
        [None] * 8,
        [None] * 8,
        [None] * 8,
        [None] * 8,
        ['P'] * 8,
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ]

def is_valid_move(from_row, from_col, to_row, to_col):
    piece = board[from_row][from_col]
    target = board[to_row][to_col]
    if not piece:
        return False
    if piece.isupper() and (not target or target.islower()):
        return True
    if piece.islower() and (not target or target.isupper()):
        return True
    return False

def draw_arrow(from_row, from_col, to_row, to_col, color='blue'):
    x1 = from_col * SQUARE_SIZE + SQUARE_SIZE // 2
    y1 = from_row * SQUARE_SIZE + SQUARE_SIZE // 2
    x2 = to_col * SQUARE_SIZE + SQUARE_SIZE // 2
    y2 = to_row * SQUARE_SIZE + SQUARE_SIZE // 2
    canvas.create_line(x1, y1, x2, y2, arrow=tk.LAST, fill=color, width=2)

def draw_symbol(row, col, kind='circle', color='orange'):
    x = col * SQUARE_SIZE + SQUARE_SIZE // 2
    y = row * SQUARE_SIZE + SQUARE_SIZE // 2
    r = SQUARE_SIZE // 3
    if kind == 'circle':
        canvas.create_oval(x - r, y - r, x + r, y + r, outline=color, width=2)
    elif kind == 'cross':
        canvas.create_line(x - r, y - r, x + r, y + r, fill=color, width=2)
        canvas.create_line(x - r, y + r, x + r, y - r, fill=color, width=2)

def draw_board(canvas):
    canvas.delete("all")

    # Draw squares
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            x1 = col * SQUARE_SIZE
            y1 = row * SQUARE_SIZE
            x2 = x1 + SQUARE_SIZE
            y2 = y1 + SQUARE_SIZE
            fill = "#f0d9b5" if (row + col) % 2 == 0 else "#b58863"
            canvas.create_rectangle(x1, y1, x2, y2, fill=fill)

    # Draw overlays
    canvas.create_image(0, 0, image=canvas.WHITE_CONTROL_OVERLAY, anchor='nw')
    canvas.create_image(0, 0, image=canvas.BLACK_CONTROL_OVERLAY, anchor='nw')

    # Draw pieces
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            piece = board[row][col]
            if piece:
                x = col * SQUARE_SIZE + SQUARE_SIZE // 2
                y = row * SQUARE_SIZE + SQUARE_SIZE // 2
                canvas.create_text(x, y, text=PIECES[piece], font=("Arial", 32))

    # Demo arrows and symbols
    draw_arrow(6, 4, 4, 4, 'green')      # Pawn push
    draw_arrow(7, 6, 5, 5, 'purple')     # Knight move
    draw_symbol(4, 4, kind='circle')     # Target
    draw_symbol(0, 3, kind='cross')      # Warning/threat

def on_canvas_click(event):
    global selected_piece
    col = event.x // SQUARE_SIZE
    row = event.y // SQUARE_SIZE

    if selected_piece:
        from_row, from_col = selected_piece
        if is_valid_move(from_row, from_col, row, col):
            board[row][col] = board[from_row][from_col]
            board[from_row][from_col] = None
        selected_piece = None
    elif board[row][col]:
        selected_piece = (row, col)

    draw_board(canvas)

def create_overlay_image(influence_data, color):
    img = Image.new("RGBA", (BOARD_SIZE * SQUARE_SIZE, BOARD_SIZE * SQUARE_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            strength = influence_data[row][col]
            if strength > 0:
                x1 = col * SQUARE_SIZE
                y1 = row * SQUARE_SIZE
                x2 = x1 + SQUARE_SIZE
                y2 = y1 + SQUARE_SIZE
                fill = color + (int(100 + strength * 15),)
                draw.rectangle([x1, y1, x2, y2], fill=fill)

    return ImageTk.PhotoImage(img)

def generate_dummy_influence(player):
    import random
    return [[random.randint(0, 10) for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]

def main():
    global canvas, board

    board = initial_board()

    root = tk.Tk()
    root.title("Chess Control Visualization")

    canvas = tk.Canvas(root, width=BOARD_SIZE*SQUARE_SIZE, height=BOARD_SIZE*SQUARE_SIZE)
    canvas.pack()
    canvas.bind("<Button-1>", on_canvas_click)

    # Influence overlays
    white_influence = generate_dummy_influence("white")
    black_influence = generate_dummy_influence("black")
    canvas.WHITE_CONTROL_OVERLAY = create_overlay_image(white_influence, (0, 255, 0))
    canvas.BLACK_CONTROL_OVERLAY = create_overlay_image(black_influence, (255, 0, 0))

    draw_board(canvas)
    root.mainloop()

if __name__ == "__main__":
    main()
