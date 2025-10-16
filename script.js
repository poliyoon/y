const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const blockSize = 30;
context.scale(blockSize, blockSize);
nextContext.scale(20, 20);

const colors = {
  I: '#00f0f5',
  J: '#0068f5',
  L: '#f59f00',
  O: '#f5d300',
  S: '#00d26a',
  T: '#a44dd0',
  Z: '#f55468',
};

const pieces = 'TJLOSZI'.split('');

const board = createMatrix(10, 20);

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  next: null,
  score: 0,
  level: 1,
  lines: 0,
};

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = true;

function createMatrix(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

function createPiece(type) {
  switch (type) {
    case 'T':
      return [
        [0, type, 0],
        [type, type, type],
      ];
    case 'O':
      return [
        [type, type],
        [type, type],
      ];
    case 'L':
      return [
        [0, 0, type],
        [type, type, type],
      ];
    case 'J':
      return [
        [type, 0, 0],
        [type, type, type],
      ];
    case 'I':
      return [[type, type, type, type]];
    case 'S':
      return [
        [0, type, type],
        [type, type, 0],
      ];
    case 'Z':
      return [
        [type, type, 0],
        [0, type, type],
      ];
    default:
      return [[type]];
  }
}

function collide(board, player) {
  const { matrix, pos } = player;
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (
        matrix[y][x] &&
        (board[y + pos.y] && board[y + pos.y][x + pos.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function merge(board, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach((row) => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerReset() {
  if (!player.next) {
    player.next = createPiece(randomPiece());
  }
  player.matrix = player.next;
  player.next = createPiece(randomPiece());
  player.pos.y = 0;
  player.pos.x = ((board[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);

  if (collide(board, player)) {
    board.forEach((row) => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = 1000;
    updateScore();
  }

  drawNext();
}

function playerDrop() {
  player.pos.y++;
  if (collide(board, player)) {
    player.pos.y--;
    merge(board, player);
    lineSweep();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(board, player)) {
    player.pos.x -= dir;
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(board, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function lineSweep() {
  let linesCleared = 0;
  outer: for (let y = board.length - 1; y >= 0; --y) {
    if (board[y].every((value) => value !== 0)) {
      const row = board.splice(y, 1)[0].fill(0);
      board.unshift(row);
      ++linesCleared;
      ++y;
    }
  }
  if (linesCleared > 0) {
    const linePoints = [0, 40, 100, 300, 1200];
    player.score += linePoints[linesCleared] * player.level;
    player.lines += linesCleared;
    if (player.lines >= player.level * 10) {
      player.level++;
      dropInterval = Math.max(150, dropInterval * 0.85);
    }
    updateScore();
  }
}

function randomPiece() {
  return pieces[(pieces.length * Math.random()) | 0];
}

function drawMatrix(matrix, offset, ctx = context) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) return;
      ctx.fillStyle = colors[value];
      ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 0.05;
      ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
    });
  });
}

function draw() {
  context.fillStyle = '#050914';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(board, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function drawNext() {
  nextContext.fillStyle = '#050914';
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const matrix = player.next;
  const offset = {
    x: Math.floor((4 - matrix[0].length) / 2),
    y: Math.floor((4 - matrix.length) / 2),
  };
  drawMatrix(matrix, offset, nextContext);
}

function updateScore() {
  document.getElementById('score').textContent = player.score;
  document.getElementById('level').textContent = player.level;
  document.getElementById('lines').textContent = player.lines;
}

function update(time = 0) {
  if (isPaused) {
    lastTime = time;
    requestAnimationFrame(update);
    return;
  }
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

function startGame() {
  if (isPaused) {
    isPaused = false;
  }
  if (!player.matrix) {
    playerReset();
  }
}

function pauseGame() {
  isPaused = !isPaused;
}

document.addEventListener('keydown', (event) => {
  if (isPaused && !['Space', 'KeyP'].includes(event.code)) return;
  switch (event.code) {
    case 'ArrowLeft':
      playerMove(-1);
      break;
    case 'ArrowRight':
      playerMove(1);
      break;
    case 'ArrowDown':
      playerDrop();
      break;
    case 'KeyZ':
    case 'ArrowUp':
      playerRotate(-1);
      break;
    case 'KeyX':
      playerRotate(1);
      break;
    case 'Space':
      startGame();
      break;
    case 'KeyP':
      pauseGame();
      break;
  }
});

const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');

startBtn.addEventListener('click', () => {
  startGame();
});

pauseBtn.addEventListener('click', () => {
  pauseGame();
});

playerReset();
updateScore();
draw();
update();
