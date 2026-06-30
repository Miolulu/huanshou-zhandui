import { getGameMode } from './gameModes.js';
import { getAIDifficultyLabel } from './ai.js';

export class LobbyUI {
  constructor(roomManager, onStartGame, onLeave) {
    this.rm = roomManager;
    this.onStartGame = onStartGame;
    this.onLeave = onLeave;
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-leave-lobby').onclick = () => this.onLeave();
    document.getElementById('btn-copy-code').onclick = () => {
      const code = this.rm.currentRoom?.code;
      if (code) { navigator.clipboard?.writeText(code); showToast(`已复制房间号 ${code}`); }
    };
    document.getElementById('btn-copy-link').onclick = () => {
      const state = this.rm.getLobbyState();
      if (state?.inviteLink) { navigator.clipboard?.writeText(state.inviteLink); showToast('已复制邀请链接'); }
    };
    document.getElementById('btn-fill-ai').onclick = () => {
      if (this.rm.isHost()) this.rm.fillAllAI();
      else showToast('仅房主可操作');
    };
    document.getElementById('btn-toggle-ready').onclick = () => {
      const state = this.rm.getLobbyState();
      const slot = state?.room.slots[state.mySlotIndex];
      if (slot?.type === 'human') {
        this.rm.setReady(!slot.ready);
      }
    };
    document.getElementById('btn-start-match').onclick = () => {
      try {
        const configs = this.rm.startMatch();
        const room = this.rm.currentRoom;
        const mode = getGameMode(room?.modeId || 'custom');
        this.onStartGame(configs, {
          modeId: room?.modeId,
          isRanked: mode.isRanked,
          aiDifficulty: room?.aiDifficulty,
          economy: mode.economy,
          turnInterval: mode.turnInterval,
        });
      } catch (e) {
        showToast(e.message);
      }
    };
  }

  render(state) {
    if (!state) return;
    const { room, isHost, mySlotIndex, occupiedCount } = state;

    document.getElementById('lobby-room-code').textContent = room.code;
    document.getElementById('lobby-player-count').textContent = `${occupiedCount}/8`;

    const mode = getGameMode(room.modeId || 'custom');
    const modeEl = document.getElementById('lobby-mode-info');
    if (modeEl) {
      modeEl.textContent = `模式：${mode.name} · AI难度 ${getAIDifficultyLabel(room.aiDifficulty || 'normal')}`;
    }

    const slotsEl = document.getElementById('lobby-slots');
    slotsEl.innerHTML = room.slots.map((slot, i) => {
      const isMe = i === mySlotIndex;
      let typeLabel = '空位';
      let typeClass = 'empty';
      if (slot.type === 'human') { typeLabel = slot.isHost ? '房主' : '真人'; typeClass = 'human'; }
      if (slot.type === 'ai') { typeLabel = 'AI'; typeClass = 'ai'; }

      const readyMark = slot.type === 'human' ? (slot.ready ? '✓ 已准备' : '未准备') : '';
      const actions = isHost && slot.type === 'empty'
        ? `<button class="btn-small btn-add-ai" data-slot="${i}">+ AI</button>`
        : isHost && slot.type === 'ai'
          ? `<button class="btn-small btn-remove-ai" data-slot="${i}">移除</button>`
          : '';

      return `<div class="lobby-slot ${typeClass} ${isMe ? 'is-me' : ''}">
        <span class="slot-num">${i + 1}</span>
        <span class="slot-name">${slot.name || '等待加入...'}</span>
        <span class="slot-type">${typeLabel}</span>
        <span class="slot-ready">${readyMark}</span>
        ${actions}
      </div>`;
    }).join('');

    slotsEl.querySelectorAll('.btn-add-ai').forEach(btn => {
      btn.onclick = () => this.rm.addAI(parseInt(btn.dataset.slot, 10));
    });
    slotsEl.querySelectorAll('.btn-remove-ai').forEach(btn => {
      btn.onclick = () => this.rm.removeSlot(parseInt(btn.dataset.slot, 10));
    });

    document.getElementById('btn-fill-ai').style.display = isHost ? 'inline-block' : 'none';
    document.getElementById('btn-start-match').style.display = isHost ? 'inline-block' : 'none';
    document.getElementById('btn-start-match').disabled = !this.rm.canStart();

    const mySlot = room.slots[mySlotIndex];
    const readyBtn = document.getElementById('btn-toggle-ready');
    if (mySlot?.type === 'human') {
      readyBtn.style.display = 'inline-block';
      readyBtn.textContent = mySlot.ready ? '取消准备' : '准备';
      readyBtn.classList.toggle('ready', mySlot.ready);
    } else {
      readyBtn.style.display = 'none';
    }

    const statusEl = document.getElementById('lobby-status');
    if (isHost) {
      statusEl.textContent = this.rm.canStart()
        ? '所有真人已准备，可以开始匹配！'
        : `至少需要 2 名玩家，且所有真人点击「准备」（当前 ${occupiedCount} 人）`;
    } else {
      statusEl.textContent = '等待房主开始匹配...';
    }
  }
}
