// ============================================================
// bitcointetris — Tetris engine with BIP-39 4-letter word mapping
// SAFETY: No real seeds. No keys. No storage of mnemonic data.
// ============================================================

const SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
};

const COLORS = {
  I: "#5ac8ff", O: "#ffd23f", T: "#c084fc",
  S: "#7be495", Z: "#ff7a90", J: "#5b8def", L: "#ff9f43",
};

const COLS = 10;
const ROWS = 20;

function emptyBoard() {
  return Array.from({length: ROWS}, () => Array(COLS).fill(null));
}

function rotateShape(shape) {
  const rows = shape.length, cols = shape[0].length;
  const out = Array.from({length: cols}, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows-1-r] = shape[r][c];
  return out;
}

function getCells(piece) {
  // Return [{r, c, letterIdx}] in fixed order so letters travel with rotation
  const cells = [];
  let idx = 0;
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[0].length; c++) {
      if (piece.shape[r][c]) {
        cells.push({ r: piece.r + r, c: piece.c + c, localR: r, localC: c, letterIdx: idx++ });
      }
    }
  }
  return cells;
}

function collides(board, piece) {
  for (const cell of getCells(piece)) {
    if (cell.c < 0 || cell.c >= COLS || cell.r >= ROWS) return true;
    if (cell.r >= 0 && board[cell.r][cell.c]) return true;
  }
  return false;
}

function pickWord(pool) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return pool[arr[0] % pool.length];
}

function spawnPiece(pool) {
  const types = Object.keys(SHAPES);
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const type = types[arr[0] % types.length];
  const shape = SHAPES[type].map(r => [...r]);
  const word = pickWord(pool);
  // Each occupied cell gets one letter; word has 3 or 4 letters and shapes have 4 cells
  const letters = word.split("");
  if (letters.length === 3) {
    letters.push("");
  }
  return {
    type, shape, color: COLORS[type], word,
    letters,
    pieceId: crypto.randomUUID(),
    r: -1, c: Math.floor(COLS/2) - Math.ceil(shape[0].length/2),
  };
}

function lockPiece(board, piece) {
  // Place cells onto the board, tagging each with pieceId + letter + word
  const newBoard = board.map(r => [...r]);
  for (const cell of getCells(piece)) {
    if (cell.r < 0) continue;
    newBoard[cell.r][cell.c] = {
      color: piece.color,
      letter: piece.letters[cell.letterIdx],
      word: piece.word,
      pieceId: piece.pieceId,
    };
  }
  return newBoard;
}

function clearLines(board) {
  const remaining = [];
  const clearedWordsSet = new Set();
  for (let r = 0; r < ROWS; r++) {
    if (board[r].every(c => c !== null)) {
      board[r].forEach(c => { if (c.word) clearedWordsSet.add(`${c.pieceId}::${c.word}`); });
    } else {
      remaining.push(board[r]);
    }
  }
  const cleared = ROWS - remaining.length;
  while (remaining.length < ROWS) remaining.unshift(Array(COLS).fill(null));
  // Dedupe by piece-instance, return just words
  const collectedWords = [...clearedWordsSet].map(s => s.split("::")[1]);
  return { board: remaining, cleared, collectedWords };
}

function scoreFor(lines, level) {
  return [0,100,300,500,800][lines] * (level || 1);
}

window.TetrisEngine = {
  COLS, ROWS, COLORS, emptyBoard, rotateShape, getCells, collides,
  spawnPiece, lockPiece, clearLines, scoreFor,
};
