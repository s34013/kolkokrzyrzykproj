

(function () {
  const boardEl = document.getElementById('board');
  const messageEl = document.getElementById('message');
  const restartBtn = document.getElementById('restart');
  const difficultyEl = document.getElementById('difficulty');
  const starterEl = document.getElementById('starter');

  const PLAYER = 'X';
  const BOT = 'O';
  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  let board = Array(9).fill(null);
  let gameOver = false;
  let playerTurn = true; // true = player (X), false = bot (O)
  let busy = false; // blokada na czas ruchu bota/animacji

  // Tworzenie planszy 3x3
  function buildBoard() {
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.className = 'cell';
      cell.type = 'button';
      cell.setAttribute('data-index', String(i));
      cell.setAttribute('aria-label', `Pole ${i + 1}`);
      cell.addEventListener('click', onCellClick);
      boardEl.appendChild(cell);
    }
  }

  function onCellClick(e) {
    if (gameOver || busy) return;
    const idx = Number(e.currentTarget.getAttribute('data-index'));
    if (!playerTurn || board[idx]) return;

    makeMove(idx, PLAYER);
    playerTurn = false;
    updateMessage();
    checkGameProgressAndMaybeBot();
  }

  function makeMove(index, symbol) {
    if (board[index] || gameOver) return false;
    board[index] = symbol;
    renderCell(index, symbol);
    const win = checkWin(board);
    if (win) {
      gameOver = true;
      highlightWin(win.line);
      messageEl.textContent = win.winner === PLAYER ? 'Wygrywasz! 🎉' : 'Bot wygrywa! 🤖';
      boardEl.classList.remove('bot-turn');
      return true;
    }
    if (board.every(Boolean)) {
      gameOver = true;
      messageEl.textContent = 'Remis.';
      boardEl.classList.remove('bot-turn');
      return true;
    }
    return true;
  }

  function renderBoard() {
    for (let i = 0; i < 9; i++) {
      renderCell(i, board[i]);
    }
  }

  function renderCell(index, symbol) {
    const cell = boardEl.querySelector(`.cell[data-index="${index}"]`);
    if (!cell) return;
    cell.textContent = symbol ? symbol : '';
    if (symbol) {
      cell.classList.add('placed');
    }
  }

  function highlightWin(line) {
    line.forEach((i) => {
      const cell = boardEl.querySelector(`.cell[data-index="${i}"]`);
      if (cell) cell.classList.add('win');
    });
  }

  function updateMessage() {
    if (gameOver) return;
    if (playerTurn) {
      messageEl.textContent = 'Twoja kolej — grasz jako X';
      boardEl.classList.remove('bot-turn');
    } else {
      // Uproszczony komunikat — bez poziomów trudności
      messageEl.textContent = 'Ruch bota...';
      boardEl.classList.add('bot-turn');
    }
  }

  function checkWin(b) {
    for (const [a, c, d] of LINES) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return { winner: b[a], line: [a, c, d] };
      }
    }
    return null;
  }

  function emptyIndices(b) {
    const res = [];
    for (let i = 0; i < 9; i++) if (!b[i]) res.push(i);
    return res;
  }

  function checkGameProgressAndMaybeBot() {
    if (gameOver) return;
    if (!playerTurn) {
      busy = true;
      updateMessage();
      setTimeout(() => {
        const move = chooseBotMove(board);
        if (move != null) makeMove(move, BOT);
        playerTurn = !gameOver; // jeśli gra nie skończona — kolej gracza
        busy = false;
        updateMessage();
      }, 600);
    }
  }

  // Bot — prosta heurystyka (zwycięż, zablokuj, środek, róg, losowe)
  function chooseBotMove(b) {
    const empties = emptyIndices(b);
    if (empties.length === 0) return null;

    // 1) Jeśli bot może wygrać — zrób to
    for (const i of empties) {
      const tmp = b.slice();
      tmp[i] = BOT;
      const winTry = checkWin(tmp);
      if (winTry && winTry.winner === BOT) return i;
    }

    // 2) Zablokuj zwycięstwo gracza
    for (const i of empties) {
      const tmp = b.slice();
      tmp[i] = PLAYER;
      const blockTry = checkWin(tmp);
      if (blockTry && blockTry.winner === PLAYER) return i;
    }

    // 3) Środek
    if (b[4] == null) return 4;

    // 4) Rogi
    const corners = [0, 2, 6, 8].filter((i) => b[i] == null);
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

    // 5) Inne — losowe z pustych
    return empties[Math.floor(Math.random() * empties.length)];
  }

  function resetGame({ keepDifficulty = true } = {}) {
    board = Array(9).fill(null);
    gameOver = false;
    busy = false;
    // restart klas animacji
    buildBoard();
    renderBoard();
    if (!keepDifficulty) difficultyEl.value = 'medium';

    const starter = starterEl.value;
    playerTurn = starter !== 'bot';
    updateMessage();

    // jeśli zaczyna bot
    if (!playerTurn) {
      setTimeout(() => {
        checkGameProgressAndMaybeBot();
      }, 500);
    }
  }

  // Zdarzenia UI
  if (restartBtn) restartBtn.addEventListener('click', () => resetGame());
  if (difficultyEl) difficultyEl.addEventListener('change', () => {
    // przy zmianie trudności nie resetujemy z automatu, ale komunikat się zaktualizuje
    updateMessage();
  });
  if (starterEl) starterEl.addEventListener('change', () => {
    resetGame();
  });

  // Inicjalizacja
  buildBoard();
  resetGame({ keepDifficulty: true });
})();
