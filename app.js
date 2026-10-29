/**
 * ApostaMaster - Simulador de Apostas
 * HTML, CSS e JavaScript Vanilla
 */

// --- ESTADO GLOBAL DO APLICATIVO ---
const AppState = {
  balance: 1000.0,
  totalBets: 0,
  wins: 0,
  netProfit: 0.0,
  activeGame: 'crash',
  history: [],
  isGameRunning: false
};

// --- ÁUDIO COM WEB AUDIO API (Sem arquivos externos) ---
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCoin() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.15); // E6
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playWin() {
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.08);
      osc.stop(this.ctx.currentTime + i * 0.08 + 0.25);
    });
  }

  playLose() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playTick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  playJackpot() {
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.09);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.09 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.09);
      osc.stop(this.ctx.currentTime + i * 0.09 + 0.4);
    });
  }
}

const sounds = new SoundEffects();

// --- FORMATAÇÃO DE MOEDA ---
function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

// --- ELEMENTOS DO DOM ---
const DOM = {
  balanceDisplay: document.getElementById('balanceDisplay'),
  btnResetBalance: document.getElementById('btnResetBalance'),
  betAmount: document.getElementById('betAmount'),
  quickBetBtns: document.querySelectorAll('.btn-quick'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  stages: document.querySelectorAll('.game-stage'),
  specificControls: document.querySelectorAll('.specific-controls'),
  statTotalBets: document.getElementById('statTotalBets'),
  statWins: document.getElementById('statWins'),
  statProfit: document.getElementById('statProfit'),
  historyTableBody: document.getElementById('historyTableBody'),
  btnClearHistory: document.getElementById('btnClearHistory'),
  toastContainer: document.getElementById('toastContainer'),

  // Crash
  btnCrashAction: document.getElementById('btnCrashAction'),
  crashStatus: document.getElementById('crashStatus'),
  crashMultiplierText: document.getElementById('crashMultiplierText'),
  rocket: document.getElementById('rocket'),
  crashHistory: document.getElementById('crashHistory'),

  // Roulette
  btnRouletteSpin: document.getElementById('btnRouletteSpin'),
  rouletteStrip: document.getElementById('rouletteStrip'),
  rouletteStatus: document.getElementById('rouletteStatus'),
  rouletteLastDrawn: document.getElementById('rouletteLastDrawn'),
  rouletteColorBtns: document.querySelectorAll('.btn-color-pick'),
  rouletteHistory: document.getElementById('rouletteHistory'),

  // Coinflip
  btnCoinFlip: document.getElementById('btnCoinFlip'),
  coin: document.getElementById('coin'),
  coinStatus: document.getElementById('coinStatus'),
  coinSideBtns: document.querySelectorAll('.btn-coin-pick'),
  coinHistory: document.getElementById('coinHistory'),

  // Slots (Caça-Níquel)
  btnSpinSlots: document.getElementById('btnSpinSlots'),
  slotStatus: document.getElementById('slotStatus'),
  slotResultBanner: document.getElementById('slotResultBanner'),
  reelStrip1: document.getElementById('reelStrip1'),
  reelStrip2: document.getElementById('reelStrip2'),
  reelStrip3: document.getElementById('reelStrip3')
};

// --- PERSISTÊNCIA LOCAL ---
function loadStorage() {
  const savedBalance = localStorage.getItem('aposta_balance');
  if (savedBalance !== null) {
    AppState.balance = parseFloat(savedBalance) || 1000.0;
  }
  const savedProfit = localStorage.getItem('aposta_profit');
  if (savedProfit !== null) {
    AppState.netProfit = parseFloat(savedProfit) || 0.0;
  }
  const savedTotal = localStorage.getItem('aposta_totalBets');
  if (savedTotal !== null) {
    AppState.totalBets = parseInt(savedTotal, 10) || 0;
  }
  const savedWins = localStorage.getItem('aposta_wins');
  if (savedWins !== null) {
    AppState.wins = parseInt(savedWins, 10) || 0;
  }
}

function saveStorage() {
  localStorage.setItem('aposta_balance', AppState.balance.toFixed(2));
  localStorage.setItem('aposta_profit', AppState.netProfit.toFixed(2));
  localStorage.setItem('aposta_totalBets', AppState.totalBets);
  localStorage.setItem('aposta_wins', AppState.wins);
}

// --- ATUALIZAÇÃO DA INTERFACE ---
function updateUI() {
  DOM.balanceDisplay.textContent = formatCurrency(AppState.balance);
  DOM.statTotalBets.textContent = AppState.totalBets;
  DOM.statWins.textContent = AppState.wins;
  
  DOM.statProfit.textContent = formatCurrency(AppState.netProfit);
  if (AppState.netProfit > 0) {
    DOM.statProfit.className = 'stat-value text-green';
  } else if (AppState.netProfit < 0) {
    DOM.statProfit.className = 'stat-value text-red';
  } else {
    DOM.statProfit.className = 'stat-value';
  }

  saveStorage();
}

// --- SISTEMA DE TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '🎉';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);

  // Trigger anim
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// --- HISTÓRICO DE APOSTAS ---
function addHistoryRecord({ game, detail, betAmount, outcome, profit }) {
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const record = { time, game, detail, betAmount, outcome, profit };
  AppState.history.unshift(record);

  if (AppState.history.length > 30) AppState.history.pop();

  renderHistoryTable();
}

function renderHistoryTable() {
  if (AppState.history.length === 0) {
    DOM.historyTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Nenhuma aposta realizada ainda. Boa sorte!</td>
      </tr>`;
    return;
  }

  DOM.historyTableBody.innerHTML = AppState.history.map(item => {
    const isWin = item.outcome === 'win';
    const profitClass = isWin ? 'profit-won' : 'profit-lost';
    const profitSign = item.profit >= 0 ? `+${formatCurrency(item.profit)}` : formatCurrency(item.profit);

    return `
      <tr>
        <td>${item.time}</td>
        <td><strong>${item.game}</strong></td>
        <td>${item.detail}</td>
        <td>${formatCurrency(item.betAmount)}</td>
        <td>
          <span class="recent-badge ${isWin ? 'badge-green' : 'badge-red'}">
            ${isWin ? 'VITÓRIA' : 'DERROTA'}
          </span>
        </td>
        <td class="${profitClass}">${profitSign}</td>
      </tr>
    `;
  }).join('');
}

// --- VALIDAÇÃO DE APOSTA ---
function getValidBetAmount() {
  const amount = parseFloat(DOM.betAmount.value);
  if (isNaN(amount) || amount <= 0) {
    showToast('Informe um valor de aposta válido (mínimo R$ 1,00)!', 'error');
    return null;
  }
  if (amount > AppState.balance) {
    showToast('Saldo insuficiente para esta aposta!', 'error');
    return null;
  }
  return amount;
}

// --- CONTROLES DE QUANTIA DE APOSTA ---
DOM.quickBetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    let current = parseFloat(DOM.betAmount.value) || 10;
    const action = btn.dataset.action;

    switch (action) {
      case 'half':
        current = Math.max(1, Math.floor(current / 2));
        break;
      case 'double':
        current = Math.min(AppState.balance, current * 2);
        break;
      case 'min':
        current = 5;
        break;
      case 'add10':
        current = Math.min(AppState.balance, current + 10);
        break;
      case 'add50':
        current = Math.min(AppState.balance, current + 50);
        break;
      case 'max':
        current = Math.max(1, Math.floor(AppState.balance));
        break;
    }

    DOM.betAmount.value = current;
  });
});

// --- TROCA DE ABAS / JOGOS ---
DOM.tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (AppState.isGameRunning) {
      showToast('Aguarde a rodada atual terminar para trocar de jogo!', 'error');
      return;
    }

    const game = btn.dataset.game;
    AppState.activeGame = game;

    DOM.tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Trocar palco
    DOM.stages.forEach(st => {
      st.classList.toggle('active', st.id === `stage-${game}`);
    });

    // Trocar controles específicos
    DOM.specificControls.forEach(ctrl => {
      ctrl.classList.toggle('hidden', ctrl.id !== `controls-${game}`);
    });
  });
});

// --- RECARREGAR SALDO ---
DOM.btnResetBalance.addEventListener('click', () => {
  if (AppState.isGameRunning) {
    showToast('Aguarde o encerramento da rodada!', 'error');
    return;
  }
  AppState.balance = 1000.0;
  updateUI();
  showToast('Saldo virtual restaurado para R$ 1.000,00!', 'success');
  sounds.playCoin();
});

// --- LIMPAR HISTÓRICO ---
DOM.btnClearHistory.addEventListener('click', () => {
  AppState.history = [];
  renderHistoryTable();
  showToast('Histórico de apostas limpo.', 'info');
});

// ==========================================
// 🚀 JOGO 1: CRASH MULTIPLIER (FOGUETINHO)
// ==========================================
const CrashGame = {
  state: 'idle', // 'idle' | 'running' | 'crashed' | 'cashed_out'
  betAmount: 0,
  currentMultiplier: 1.00,
  crashPoint: 1.00,
  startTime: null,
  animationFrame: null,
  recentCrashList: [1.94, 3.42, 1.15, 7.80, 2.05],

  init() {
    this.renderRecent();
    DOM.btnCrashAction.addEventListener('click', () => this.handleAction());
  },

  renderRecent() {
    DOM.crashHistory.innerHTML = this.recentCrashList.slice(-6).map(m => {
      const cls = m >= 2.0 ? 'badge-green' : 'badge-red';
      return `<span class="recent-badge ${cls}">${m.toFixed(2)}x</span>`;
    }).join('');
  },

  calculateCrashPoint() {
    // Curva realista com vantagem da casa (96% RTP)
    const rand = Math.random();
    if (rand < 0.05) {
      // 5% de chance de crash instantâneo em 1.00x
      return 1.00;
    }
    // Distribuição inversa proporcional
    const crash = 0.96 / (1 - rand);
    return Math.max(1.01, Math.min(100.0, parseFloat(crash.toFixed(2))));
  },

  handleAction() {
    if (this.state === 'idle') {
      this.startRound();
    } else if (this.state === 'running') {
      this.cashout();
    }
  },

  startRound() {
    const bet = getValidBetAmount();
    if (bet === null) return;

    sounds.init();
    this.betAmount = bet;
    AppState.balance -= bet;
    AppState.totalBets++;
    AppState.isGameRunning = true;
    updateUI();

    this.state = 'running';
    this.currentMultiplier = 1.00;
    this.crashPoint = this.calculateCrashPoint();
    this.startTime = performance.now();

    // Atualiza botão para saque
    DOM.btnCrashAction.textContent = `Sacar ${formatCurrency(this.betAmount * 1.00)} (1.00x)`;
    DOM.btnCrashAction.className = 'btn-play btn-crash-cashout';
    DOM.crashStatus.textContent = 'Foguete em voo... Boa sorte!';
    DOM.crashMultiplierText.className = 'crash-multiplier';
    DOM.crashMultiplierText.textContent = '1.00x';

    // Posição inicial do foguete
    DOM.rocket.style.left = '20px';
    DOM.rocket.style.bottom = '20px';
    DOM.rocket.textContent = '🚀';

    this.loop();
  },

  loop() {
    this.animationFrame = requestAnimationFrame((now) => {
      const elapsedSeconds = (now - this.startTime) / 1000;
      
      // Curva exponencial suave de crescimento
      const mult = 1.0 + Math.pow(elapsedSeconds * 0.45, 1.8);
      this.currentMultiplier = parseFloat(mult.toFixed(2));

      if (this.currentMultiplier >= this.crashPoint) {
        this.triggerCrash();
        return;
      }

      // Renderiza multiplicador
      DOM.crashMultiplierText.textContent = `${this.currentMultiplier.toFixed(2)}x`;

      if (this.state === 'running') {
        const potentialReturn = this.betAmount * this.currentMultiplier;
        DOM.btnCrashAction.textContent = `Sacar ${formatCurrency(potentialReturn)} (${this.currentMultiplier.toFixed(2)}x)`;
      }

      // Animação de subida do foguete na arena
      const progress = Math.min(1, (this.currentMultiplier - 1.0) / 10);
      const arenaWidth = DOM.rocket.parentElement.clientWidth - 70;
      const arenaHeight = DOM.rocket.parentElement.clientHeight - 70;
      
      const posX = 20 + (arenaWidth * Math.min(1, elapsedSeconds * 0.15));
      const posY = 20 + (arenaHeight * Math.min(0.9, Math.pow(progress, 0.7)));

      DOM.rocket.style.left = `${posX}px`;
      DOM.rocket.style.bottom = `${posY}px`;

      this.loop();
    });
  },

  cashout() {
    if (this.state !== 'running') return;
    this.state = 'cashed_out';

    const winMultiplier = this.currentMultiplier;
    const totalReturn = this.betAmount * winMultiplier;
    const netWin = totalReturn - this.betAmount;

    AppState.balance += totalReturn;
    AppState.wins++;
    AppState.netProfit += netWin;
    updateUI();

    sounds.playWin();
    showToast(`Parabéns! Você sacou em ${winMultiplier.toFixed(2)}x e ganhou ${formatCurrency(totalReturn)}!`, 'success');

    DOM.btnCrashAction.textContent = 'Ganhador! Aguarde...';
    DOM.btnCrashAction.disabled = true;
    DOM.btnCrashAction.className = 'btn-play';

    addHistoryRecord({
      game: 'Crash',
      detail: `Sacou em ${winMultiplier.toFixed(2)}x`,
      betAmount: this.betAmount,
      outcome: 'win',
      profit: netWin
    });
  },

  triggerCrash() {
    cancelAnimationFrame(this.animationFrame);
    
    DOM.crashMultiplierText.textContent = `${this.crashPoint.toFixed(2)}x`;
    DOM.crashMultiplierText.className = 'crash-multiplier crashed';
    DOM.rocket.textContent = '💥';

    // Salvar recente
    this.recentCrashList.push(this.crashPoint);
    this.renderRecent();

    if (this.state === 'running') {
      // Jogador não sacou a tempo
      this.state = 'crashed';
      AppState.netProfit -= this.betAmount;
      updateUI();

      sounds.playLose();
      showToast(`O foguete explodiu em ${this.crashPoint.toFixed(2)}x! Você perdeu a aposta.`, 'error');

      addHistoryRecord({
        game: 'Crash',
        detail: `Explodiu em ${this.crashPoint.toFixed(2)}x`,
        betAmount: this.betAmount,
        outcome: 'loss',
        profit: -this.betAmount
      });
    }

    DOM.crashStatus.textContent = `Crashou em ${this.crashPoint.toFixed(2)}x`;

    setTimeout(() => {
      this.resetRound();
    }, 2500);
  },

  resetRound() {
    this.state = 'idle';
    AppState.isGameRunning = false;
    DOM.btnCrashAction.textContent = 'Começar Rodada 🚀';
    DOM.btnCrashAction.className = 'btn-play btn-crash-start';
    DOM.btnCrashAction.disabled = false;
    DOM.crashStatus.textContent = 'Pronto para decolar';
    DOM.rocket.textContent = '🚀';
    DOM.rocket.style.left = '20px';
    DOM.rocket.style.bottom = '20px';
  }
};

// ==========================================
// 🎯 JOGO 2: ROLETA DOUBLE
// ==========================================
const RouletteGame = {
  selectedColor: 'red',
  isSpinning: false,
  tileWidth: 88, // 80px width + 8px margin
  totalTiles: 15,
  recentResults: ['red', 'black', 'black', 'red', 'gold'],

  // Padrão clássico: 0 (Dourado), 1-7 (Vermelho), 8-14 (Preto)
  tilesData: [
    { num: 0, color: 'gold' },
    { num: 1, color: 'red' },
    { num: 2, color: 'black' },
    { num: 3, color: 'red' },
    { num: 4, color: 'black' },
    { num: 5, color: 'red' },
    { num: 6, color: 'black' },
    { num: 7, color: 'red' },
    { num: 8, color: 'black' },
    { num: 9, color: 'red' },
    { num: 10, color: 'black' },
    { num: 11, color: 'red' },
    { num: 12, color: 'black' },
    { num: 13, color: 'red' },
    { num: 14, color: 'black' }
  ],

  init() {
    this.renderTiles();
    this.renderRecent();

    DOM.rouletteColorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isSpinning) return;
        DOM.rouletteColorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedColor = btn.dataset.color;
      });
    });

    DOM.btnRouletteSpin.addEventListener('click', () => this.spin());
  },

  renderTiles() {
    // Criamos 6 repetições da sequência para rotação fluida
    let html = '';
    for (let loop = 0; loop < 6; loop++) {
      this.tilesData.forEach(item => {
        html += `<div class="roulette-tile tile-${item.color}" data-num="${item.num}" data-color="${item.color}">${item.num}</div>`;
      });
    }
    DOM.rouletteStrip.innerHTML = html;
  },

  renderRecent() {
    DOM.rouletteHistory.innerHTML = this.recentResults.slice(-5).map(c => {
      let badgeClass = 'badge-red';
      let label = 'VERM';
      if (c === 'black') { badgeClass = 'badge-black'; label = 'PRET'; }
      if (c === 'gold') { badgeClass = 'badge-gold'; label = 'OURO'; }
      return `<span class="recent-badge ${badgeClass}">${label}</span>`;
    }).join('');
  },

  spin() {
    if (this.isSpinning) return;
    const bet = getValidBetAmount();
    if (bet === null) return;

    sounds.init();
    this.isSpinning = true;
    AppState.isGameRunning = true;
    AppState.balance -= bet;
    AppState.totalBets++;
    updateUI();

    DOM.btnRouletteSpin.disabled = true;
    DOM.rouletteStatus.textContent = 'Girando a roleta...';

    // Sorteia índice de 0 a 14
    const winningIndex = Math.floor(Math.random() * this.tilesData.length);
    const winningTile = this.tilesData[winningIndex];

    // O ponteiro central está em 50% da largura do contêiner
    const containerWidth = DOM.rouletteStrip.parentElement.clientWidth;
    const centerOffset = (containerWidth / 2) - (this.tileWidth / 2);

    // Parar na 4ª volta completa para efeito longo e dramático
    const targetSetIndex = (3 * this.totalTiles) + winningIndex;
    const targetPixel = (targetSetIndex * this.tileWidth) - centerOffset + (Math.random() * 20 - 10);

    // Reseta posição instantânea
    DOM.rouletteStrip.style.transition = 'none';
    DOM.rouletteStrip.style.transform = 'translateX(0px)';

    // Força reflow
    void DOM.rouletteStrip.offsetWidth;

    // Aplica animação suave
    DOM.rouletteStrip.style.transition = 'transform 4s cubic-bezier(0.12, 0.8, 0.22, 1)';
    DOM.rouletteStrip.style.transform = `translateX(-${targetPixel}px)`;

    // Efeito sonoro de giro
    let tickCount = 0;
    const ticker = setInterval(() => {
      sounds.playTick();
      tickCount++;
      if (tickCount > 25) clearInterval(ticker);
    }, 120);

    setTimeout(() => {
      this.evaluateResult(bet, winningTile);
    }, 4100);
  },

  evaluateResult(bet, winningTile) {
    this.isSpinning = false;
    AppState.isGameRunning = false;
    DOM.btnRouletteSpin.disabled = false;

    const won = winningTile.color === this.selectedColor;
    const multiplier = winningTile.color === 'gold' ? 14 : 2;

    this.recentResults.push(winningTile.color);
    this.renderRecent();

    const colorName = winningTile.color === 'red' ? 'Vermelho' : winningTile.color === 'black' ? 'Preto' : 'Dourado';
    DOM.rouletteLastDrawn.textContent = `${winningTile.num} (${colorName})`;

    if (won) {
      const totalWin = bet * multiplier;
      const netWin = totalWin - bet;
      AppState.balance += totalWin;
      AppState.wins++;
      AppState.netProfit += netWin;
      updateUI();

      sounds.playWin();
      DOM.rouletteStatus.textContent = `🎯 Vitória! Saiu ${winningTile.num} (${colorName})!`;
      showToast(`Você acertou no ${colorName} e ganhou ${formatCurrency(totalWin)}!`, 'success');

      addHistoryRecord({
        game: 'Roleta',
        detail: `${colorName} (${multiplier}x)`,
        betAmount: bet,
        outcome: 'win',
        profit: netWin
      });
    } else {
      AppState.netProfit -= bet;
      updateUI();

      sounds.playLose();
      DOM.rouletteStatus.textContent = `❌ Derrota! Saiu ${winningTile.num} (${colorName}).`;
      showToast(`A roleta parou em ${colorName}. Mais sorte na próxima!`, 'error');

      addHistoryRecord({
        game: 'Roleta',
        detail: `Escolha ${this.selectedColor} / Saiu ${winningTile.color}`,
        betAmount: bet,
        outcome: 'loss',
        profit: -bet
      });
    }
  }
};

// ==========================================
// 🪙 JOGO 3: CARA OU COROA (COIN FLIP)
// ==========================================
const CoinFlipGame = {
  selectedSide: 'cara',
  isFlipping: false,
  currentRotation: 0,
  recentFlips: ['cara', 'coroa', 'cara'],

  init() {
    this.renderRecent();

    DOM.coinSideBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isFlipping) return;
        DOM.coinSideBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedSide = btn.dataset.side;
      });
    });

    DOM.btnCoinFlip.addEventListener('click', () => this.flip());
  },

  renderRecent() {
    DOM.coinHistory.innerHTML = this.recentFlips.slice(-5).map(side => {
      const icon = side === 'cara' ? '👑 CARA' : '⚔️ COROA';
      return `<span class="recent-badge badge-gold">${icon}</span>`;
    }).join('');
  },

  flip() {
    if (this.isFlipping) return;
    const bet = getValidBetAmount();
    if (bet === null) return;

    sounds.init();
    this.isFlipping = true;
    AppState.isGameRunning = true;
    AppState.balance -= bet;
    AppState.totalBets++;
    updateUI();

    DOM.btnCoinFlip.disabled = true;
    DOM.coinStatus.textContent = 'Moeda no ar... girando!';

    // Sorteio
    const isCara = Math.random() < 0.5;
    const winningSide = isCara ? 'cara' : 'coroa';

    // Calcula voltas (mínimo 5 rotações completas)
    const baseSpins = 1800; // 5 x 360deg
    const targetOffset = isCara ? 0 : 180;
    
    // Garante que gire sempre para frente
    this.currentRotation += baseSpins + (360 - (this.currentRotation % 360)) + targetOffset;
    DOM.coin.style.transform = `rotateY(${this.currentRotation}deg)`;

    // Sons de giro de moeda
    sounds.playCoin();

    setTimeout(() => {
      this.evaluateResult(bet, winningSide);
    }, 1500);
  },

  evaluateResult(bet, winningSide) {
    this.isFlipping = false;
    AppState.isGameRunning = false;
    DOM.btnCoinFlip.disabled = false;

    this.recentFlips.push(winningSide);
    this.renderRecent();

    const won = winningSide === this.selectedSide;
    const sideName = winningSide === 'cara' ? 'Cara 👑' : 'Coroa ⚔️';

    if (won) {
      const totalWin = bet * 2.0;
      const netWin = totalWin - bet;
      AppState.balance += totalWin;
      AppState.wins++;
      AppState.netProfit += netWin;
      updateUI();

      sounds.playWin();
      DOM.coinStatus.textContent = `🎉 Deu ${sideName}! Você venceu!`;
      showToast(`Deu ${sideName}! Você faturou ${formatCurrency(totalWin)}!`, 'success');

      addHistoryRecord({
        game: 'Cara ou Coroa',
        detail: `${sideName} (2x)`,
        betAmount: bet,
        outcome: 'win',
        profit: netWin
      });
    } else {
      AppState.netProfit -= bet;
      updateUI();

      sounds.playLose();
      DOM.coinStatus.textContent = `❌ Deu ${sideName}! Você perdeu.`;
      showToast(`Deu ${sideName}! Tente novamente.`, 'error');

      addHistoryRecord({
        game: 'Cara ou Coroa',
        detail: `Escolha: ${this.selectedSide} / Deu: ${winningSide}`,
        betAmount: bet,
        outcome: 'loss',
        profit: -bet
      });
    }
  }
};

// ==========================================
// 🎰 JOGO 4: CAÇA-NÍQUEL (SLOT MACHINE)
// ==========================================
const SlotMachineGame = {
  isSpinning: false,
  symbolHeight: 120,
  stripLength: 30,
  targetIndex: 24,

  symbols: [
    { id: '7', char: '7️⃣', name: 'Sete da Sorte', mult: 25, weight: 2 },
    { id: 'diamond', char: '💎', name: 'Diamante', mult: 15, weight: 4 },
    { id: 'bell', char: '🔔', name: 'Sino Dourado', mult: 10, weight: 7 },
    { id: 'grape', char: '🍇', name: 'Uva Roxa', mult: 5, weight: 12 },
    { id: 'lemon', char: '🍋', name: 'Limão Siciliano', mult: 3, weight: 18 },
    { id: 'cherry', char: '🍒', name: 'Cereja', mult: 2, weight: 25 }
  ],

  reels: [],

  init() {
    this.reels = [
      { strip: DOM.reelStrip1, currentOffset: 0 },
      { strip: DOM.reelStrip2, currentOffset: 0 },
      { strip: DOM.reelStrip3, currentOffset: 0 }
    ];

    this.buildReels();
    DOM.btnSpinSlots.addEventListener('click', () => this.spin());
  },

  getRandomSymbol() {
    const totalWeight = this.symbols.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const s of this.symbols) {
      if (rand < s.weight) return s;
      rand -= s.weight;
    }
    return this.symbols[this.symbols.length - 1];
  },

  buildReels() {
    this.reels.forEach((reel, rIndex) => {
      let html = '';
      for (let i = 0; i < this.stripLength; i++) {
        const randSym = this.getRandomSymbol();
        html += `<div class="slot-symbol" data-sym-id="${randSym.id}">${randSym.char}</div>`;
      }
      reel.strip.innerHTML = html;
      reel.strip.style.transform = 'translateY(0px)';
    });
  },

  spin() {
    if (this.isSpinning) return;
    const bet = getValidBetAmount();
    if (bet === null) return;

    sounds.init();
    this.isSpinning = true;
    AppState.isGameRunning = true;
    AppState.balance -= bet;
    AppState.totalBets++;
    updateUI();

    DOM.btnSpinSlots.disabled = true;
    DOM.slotStatus.textContent = 'Rolos girando... Torcendo pelo 7️⃣ 7️⃣ 7️⃣!';
    DOM.slotResultBanner.className = 'slots-result-banner';
    DOM.slotResultBanner.textContent = 'Girando...';

    // Determina o resultado de cada rolo
    const outcome1 = this.getRandomSymbol();
    const outcome2 = this.getRandomSymbol();
    const outcome3 = this.getRandomSymbol();
    const outcomes = [outcome1, outcome2, outcome3];

    // Injeta os símbolos vencedores na posição de parada de cada rolo
    this.reels.forEach((reel, rIndex) => {
      const symbolsElements = reel.strip.querySelectorAll('.slot-symbol');
      if (symbolsElements[this.targetIndex]) {
        symbolsElements[this.targetIndex].textContent = outcomes[rIndex].char;
        symbolsElements[this.targetIndex].dataset.symId = outcomes[rIndex].id;
      }

      // Reinicia animação
      reel.strip.style.transition = 'none';
      reel.strip.style.transform = 'translateY(0px)';
      void reel.strip.offsetWidth; // Força reflow
    });

    // Inicia rotação com frenagem escalonada
    const durations = [1.4, 1.9, 2.4];
    const targetTranslateY = -(this.targetIndex * this.symbolHeight);

    // Efeito de som de giro contínuo
    let spinTickCount = 0;
    const spinTicker = setInterval(() => {
      sounds.playTick();
      spinTickCount++;
      if (spinTickCount > 18) clearInterval(spinTicker);
    }, 110);

    this.reels.forEach((reel, rIndex) => {
      reel.strip.style.transition = `transform ${durations[rIndex]}s cubic-bezier(0.12, 0.85, 0.25, 1)`;
      reel.strip.style.transform = `translateY(${targetTranslateY}px)`;
    });

    // Paradas individuais com som
    setTimeout(() => sounds.playTick(), 1400);
    setTimeout(() => sounds.playTick(), 1900);
    setTimeout(() => sounds.playTick(), 2400);

    // Avaliação final do resultado
    setTimeout(() => {
      this.evaluateResult(bet, outcomes);
    }, 2600);
  },

  evaluateResult(bet, outcomes) {
    this.isSpinning = false;
    AppState.isGameRunning = false;
    DOM.btnSpinSlots.disabled = false;

    const [o1, o2, o3] = outcomes;
    const lineString = `${o1.char} ${o2.char} ${o3.char}`;

    const isTriple = (o1.id === o2.id && o2.id === o3.id);
    const isPair = !isTriple && (o1.id === o2.id || o2.id === o3.id || o1.id === o3.id);

    if (isTriple) {
      const multiplier = o1.mult;
      const totalWin = bet * multiplier;
      const netWin = totalWin - bet;

      AppState.balance += totalWin;
      AppState.wins++;
      AppState.netProfit += netWin;
      updateUI();

      if (o1.id === '7') {
        sounds.playJackpot();
        DOM.slotResultBanner.className = 'slots-result-banner jackpot';
        DOM.slotResultBanner.textContent = `💥 JACKPOT 777! (${lineString}) Ganhou ${formatCurrency(totalWin)}!`;
        DOM.slotStatus.textContent = `🏆 MEGA JACKPOT DE ${multiplier}X! INCRÍVEL!`;
        showToast(`💥 JACKPOT 777! Você faturou incríveis ${formatCurrency(totalWin)}!`, 'success');
      } else {
        sounds.playWin();
        DOM.slotResultBanner.className = 'slots-result-banner win';
        DOM.slotResultBanner.textContent = `🎉 TRIO DE ${o1.name.toUpperCase()}! (${lineString}) Ganhou ${formatCurrency(totalWin)}!`;
        DOM.slotStatus.textContent = `🎯 Vitória! Trio de ${o1.name} (${multiplier}x)!`;
        showToast(`Trio de ${o1.name}! Você ganhou ${formatCurrency(totalWin)}!`, 'success');
      }

      addHistoryRecord({
        game: 'Caça-Níquel',
        detail: `Trio: ${lineString} (${multiplier}x)`,
        betAmount: bet,
        outcome: 'win',
        profit: netWin
      });

    } else if (isPair) {
      const multiplier = 1.5;
      const totalWin = bet * multiplier;
      const netWin = totalWin - bet;

      AppState.balance += totalWin;
      AppState.wins++;
      AppState.netProfit += netWin;
      updateUI();

      sounds.playWin();
      DOM.slotResultBanner.className = 'slots-result-banner win';
      DOM.slotResultBanner.textContent = `✨ PAR FORMADO! (${lineString}) Ganhou ${formatCurrency(totalWin)}!`;
      DOM.slotStatus.textContent = `✨ Par premiado! Retorno de 1.5x da aposta!`;
      showToast(`Par formado! Você recuperou a aposta com lucro de ${formatCurrency(totalWin)}!`, 'success');

      addHistoryRecord({
        game: 'Caça-Níquel',
        detail: `Par: ${lineString} (1.5x)`,
        betAmount: bet,
        outcome: 'win',
        profit: netWin
      });

    } else {
      AppState.netProfit -= bet;
      updateUI();

      sounds.playLose();
      DOM.slotResultBanner.className = 'slots-result-banner';
      DOM.slotResultBanner.textContent = `❌ ${lineString} - Nenhum par formado.`;
      DOM.slotStatus.textContent = `❌ Quase lá! Tente mais uma vez.`;
      showToast(`Nenhuma combinação premiada (${lineString}). Tente de novo!`, 'error');

      addHistoryRecord({
        game: 'Caça-Níquel',
        detail: `Sem combinação: ${lineString}`,
        betAmount: bet,
        outcome: 'loss',
        profit: -bet
      });
    }
  }
};

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
  loadStorage();
  updateUI();
  renderHistoryTable();

  CrashGame.init();
  RouletteGame.init();
  CoinFlipGame.init();
  SlotMachineGame.init();
});
