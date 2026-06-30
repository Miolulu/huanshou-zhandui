import { peekRoom } from './roomManager.js';
import { showScreen, getNickname, setMenuError, renderElementChart, showToast } from './appShell.js';

export function initMenu(onCreateRoom, onJoinRoom) {
  renderElementChart(document.getElementById('menu-element-chart'));

  document.getElementById('btn-create-room').onclick = () => {
    setMenuError('');
    try {
      onCreateRoom(getNickname());
    } catch (e) {
      setMenuError(e.message);
    }
  };

  document.getElementById('btn-show-join').onclick = () => {
    document.getElementById('join-panel').classList.toggle('hidden');
  };

  document.getElementById('btn-join-room').onclick = () => {
    setMenuError('');
    const code = document.getElementById('input-room-code').value.trim();
    if (!code) { setMenuError('请输入房间号'); return; }
    try {
      onJoinRoom(code, getNickname());
    } catch (e) {
      setMenuError(e.message);
    }
  };

  const params = new URLSearchParams(location.search);
  const roomCode = params.get('room');
  if (roomCode) {
    document.getElementById('join-panel').classList.remove('hidden');
    document.getElementById('input-room-code').value = roomCode;
    if (peekRoom(roomCode)) {
      showToast(`检测到房间 ${roomCode.toUpperCase()}，输入昵称后点击加入`);
    }
  }
}
