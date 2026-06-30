import { CONFIG } from './config.js';

const STORAGE_KEY = 'hszd_rooms_v1';
const CHANNEL_NAME = 'hszd_room_sync';

const AI_NAMES = [
  'AI·赤焰', 'AI·苍蓝', 'AI·翠风', 'AI·紫电',
  'AI·金光', 'AI·暗影', 'AI·虚空', 'AI·风暴',
];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function loadAllRooms() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAllRooms(rooms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

function saveRoom(room) {
  const rooms = loadAllRooms();
  rooms[room.code] = { ...room, updatedAt: Date.now() };
  saveAllRooms(rooms);
}

function loadRoom(code) {
  const rooms = loadAllRooms();
  const room = rooms[code?.toUpperCase()];
  if (!room) return null;
  if (Date.now() - (room.updatedAt || 0) > 3600000) {
    delete rooms[code.toUpperCase()];
    saveAllRooms(rooms);
    return null;
  }
  return room;
}

function createEmptySlot() {
  return { id: null, name: null, type: 'empty', ready: false, isHost: false };
}

export class RoomManager {
  constructor(onRoomUpdate) {
    this.onRoomUpdate = onRoomUpdate;
    this.playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.currentRoom = null;
    this.mySlotIndex = -1;
    this.channel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(CHANNEL_NAME)
      : null;
    if (this.channel) {
      this._channelHandlers = [];
      this.channel.onmessage = (e) => this._channelHandlers.forEach(h => h(e));
    }
    this._pollTimer = setInterval(() => this.pollRoom(), 2000);
  }

  onChannelMessage(handler) {
    this._channelHandlers?.push(handler);
  }

  destroy() {
    clearInterval(this._pollTimer);
    this.channel?.close();
  }

  pollRoom() {
    if (!this.currentRoom) return;
    const fresh = loadRoom(this.currentRoom.code);
    if (fresh && fresh.updatedAt !== this.currentRoom.updatedAt) {
      this.currentRoom = fresh;
      this.mySlotIndex = fresh.slots.findIndex(s => s.id === this.playerId);
      this.onRoomUpdate?.(this.getLobbyState());
    }
  }

  broadcast(room) {
    saveRoom(room);
    this.channel?.postMessage({ code: room.code, room });
  }

  getLobbyState() {
    if (!this.currentRoom) return null;
    return {
      room: this.currentRoom,
      isHost: this.currentRoom.hostId === this.playerId,
      mySlotIndex: this.mySlotIndex,
      playerId: this.playerId,
      occupiedCount: this.currentRoom.slots.filter(s => s.type !== 'empty').length,
      inviteLink: `${location.origin}${location.pathname}?room=${this.currentRoom.code}`,
    };
  }

  createRoom(hostName, options = {}) {
    const code = generateCode();
    const slots = Array(CONFIG.MAX_PLAYERS).fill(null).map((_, i) =>
      i === 0
        ? { id: this.playerId, name: hostName.trim() || '玩家', type: 'human', ready: true, isHost: true }
        : createEmptySlot()
    );
    const room = {
      code, hostId: this.playerId, slots, status: 'waiting',
      modeId: options.modeId || 'custom',
      aiDifficulty: options.aiDifficulty || 'normal',
    };
    this.currentRoom = room;
    this.mySlotIndex = 0;
    this.broadcast(room);
    return this.getLobbyState();
  }

  joinRoom(code, playerName) {
    const room = loadRoom(code?.trim().toUpperCase());
    if (!room) throw new Error('房间不存在或已过期');
    if (room.status !== 'waiting') throw new Error('对局已开始');
    const existing = room.slots.findIndex(s => s.id === this.playerId);
    if (existing >= 0) {
      this.currentRoom = room;
      this.mySlotIndex = existing;
      return this.getLobbyState();
    }
    const slotIdx = room.slots.findIndex(s => s.type === 'empty');
    if (slotIdx === -1) throw new Error('房间已满');
    room.slots[slotIdx] = {
      id: this.playerId,
      name: playerName.trim() || '玩家',
      type: 'human',
      ready: false,
      isHost: false,
    };
    this.currentRoom = room;
    this.mySlotIndex = slotIdx;
    this.broadcast(room);
    return this.getLobbyState();
  }

  addAI(slotIndex) {
    if (!this.isHost()) return false;
    const room = { ...this.currentRoom, slots: [...this.currentRoom.slots] };
    if (room.slots[slotIndex]?.type !== 'empty') return false;
    const usedNames = room.slots.filter(s => s.type !== 'empty').map(s => s.name);
    const name = AI_NAMES.find(n => !usedNames.includes(n)) || `AI·${slotIndex}`;
    room.slots[slotIndex] = {
      id: `ai_${slotIndex}_${Date.now()}`,
      name,
      type: 'ai',
      ready: true,
      isHost: false,
      aiDifficulty: room.aiDifficulty || 'normal',
    };
    this.currentRoom = room;
    this.broadcast(room);
    this.onRoomUpdate?.(this.getLobbyState());
    return true;
  }

  fillAllAI() {
    if (!this.isHost()) return;
    const room = { ...this.currentRoom, slots: [...this.currentRoom.slots] };
    const usedNames = room.slots.filter(s => s.type !== 'empty').map(s => s.name);
    for (let i = 0; i < CONFIG.MAX_PLAYERS; i++) {
      if (room.slots[i].type !== 'empty') continue;
      const name = AI_NAMES.find(n => !usedNames.includes(n)) || `AI·${i}`;
      usedNames.push(name);
      room.slots[i] = {
        id: `ai_${i}_${Date.now()}`, name, type: 'ai', ready: true, isHost: false,
        aiDifficulty: room.aiDifficulty || 'normal',
      };
    }
    this.currentRoom = room;
    this.broadcast(room);
    this.onRoomUpdate?.(this.getLobbyState());
  }

  removeSlot(slotIndex) {
    if (!this.isHost()) return false;
    if (slotIndex === 0) return false;
    const room = { ...this.currentRoom, slots: [...this.currentRoom.slots] };
    if (room.slots[slotIndex]?.type === 'empty') return false;
    if (room.slots[slotIndex]?.type === 'human') return false;
    room.slots[slotIndex] = createEmptySlot();
    this.currentRoom = room;
    this.broadcast(room);
    this.onRoomUpdate?.(this.getLobbyState());
    return true;
  }

  setReady(ready) {
    const room = { ...this.currentRoom, slots: [...this.currentRoom.slots] };
    const slot = room.slots[this.mySlotIndex];
    if (!slot || slot.type !== 'human') return;
    slot.ready = ready;
    this.currentRoom = room;
    this.broadcast(room);
    this.onRoomUpdate?.(this.getLobbyState());
  }

  isHost() {
    return this.currentRoom?.hostId === this.playerId;
  }

  canStart() {
    if (!this.isHost()) return false;
    const occupied = this.currentRoom.slots.filter(s => s.type !== 'empty').length;
    const humans = this.currentRoom.slots.filter(s => s.type === 'human');
    const allReady = humans.every(s => s.ready);
    return occupied >= 2 && allReady;
  }

  startMatch() {
    if (!this.canStart()) throw new Error('至少需要2名玩家且所有真人已准备');
    const room = { ...this.currentRoom, slots: [...this.currentRoom.slots] };
    const usedNames = room.slots.filter(s => s.type !== 'empty').map(s => s.name);
    for (let i = 0; i < CONFIG.MAX_PLAYERS; i++) {
      if (room.slots[i].type !== 'empty') continue;
      const name = AI_NAMES.find(n => !usedNames.includes(n)) || `AI·${i}`;
      usedNames.push(name);
      room.slots[i] = {
        id: `ai_${i}`, name, type: 'ai', ready: true, isHost: false,
        aiDifficulty: room.aiDifficulty || 'normal',
      };
    }
    room.status = 'playing';
    this.currentRoom = room;
    const playerConfigs = room.slots.map((s, i) => ({
      id: `player_${i}`,
      name: s.name,
      isHuman: s.type === 'human' && s.id === this.playerId,
      isAI: s.type === 'ai' || (s.type === 'human' && s.id !== this.playerId),
      slotIndex: i,
      odPlayerId: s.id,
      aiDifficulty: s.aiDifficulty || room.aiDifficulty || 'normal',
    }));
    this.broadcast(room);
    this.channel?.postMessage({
      type: 'GAME_START', code: room.code, room, playerConfigs,
      modeId: room.modeId, aiDifficulty: room.aiDifficulty,
      forPlayerId: this.playerId,
    });
    return playerConfigs;
  }

  /** 其他标签页收到开战广播时，生成本客户端的玩家配置 */
  static configsForClient(room, myPlayerId) {
    return room.slots.map((s, i) => ({
      id: `player_${i}`,
      name: s.name,
      isHuman: s.type === 'human' && s.id === myPlayerId,
      isAI: s.type === 'ai' || (s.type === 'human' && s.id !== myPlayerId),
      slotIndex: i,
      aiDifficulty: s.aiDifficulty || room.aiDifficulty || 'normal',
    }));
  }

  setRoomOptions(modeId, aiDifficulty) {
    if (!this.isHost()) return false;
    const room = { ...this.currentRoom, modeId, aiDifficulty };
    this.currentRoom = room;
    this.broadcast(room);
    this.onRoomUpdate?.(this.getLobbyState());
    return true;
  }

  leaveRoom() {
    if (!this.currentRoom) return;
    const room = { ...this.currentRoom, slots: [...this.currentRoom.slots] };
    if (this.mySlotIndex >= 0 && room.slots[this.mySlotIndex]?.id === this.playerId) {
      if (this.isHost()) {
        const rooms = loadAllRooms();
        delete rooms[room.code];
        saveAllRooms(rooms);
      } else {
        room.slots[this.mySlotIndex] = createEmptySlot();
        this.broadcast(room);
      }
    }
    this.currentRoom = null;
    this.mySlotIndex = -1;
  }
}

export function peekRoom(code) {
  return loadRoom(code?.trim().toUpperCase());
}
